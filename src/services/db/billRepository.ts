import dayjs from 'dayjs'
import type { Bill, BillDraftInput, BillSource, BillStatus, TransactionKind } from '../../types/bill'
import { clampAmount } from '../../utils/format'
import { createId } from '../../utils/id'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

const CURRENT_BILL_SCHEMA_VERSION = 3

type LegacyBillRecord = Partial<Bill> & {
  purpose?: unknown
}

function sortBills(bills: Bill[]): Bill[] {
  return [...bills].sort((left, right) => dayjs(right.billDate).valueOf() - dayjs(left.billDate).valueOf())
}

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getTrimmedString(value: unknown): string {
  return getStringValue(value).trim()
}

function isBillSource(value: unknown): value is BillSource {
  return value === 'bankCard' || value === 'wechat' || value === 'alipay'
}

function isBillStatus(value: unknown): value is BillStatus {
  return value === 'draft' || value === 'confirmed'
}

function isTransactionKind(value: unknown): value is TransactionKind {
  return value === 'income' || value === 'expense' || value === 'repayment' || value === 'debt_expense'
}

function normalizeCategoryId(value: unknown): string {
  return getStringValue(value)
}

function resolveBillDescription(record: LegacyBillRecord): string {
  const description = getTrimmedString(record.description)

  if (description) {
    return description
  }

  return getTrimmedString(record.purpose)
}

function getStorageSchemaVersion(): number {
  const raw = readCollection<number>(storageKeys.schemaVersion, 0)
  return Number.isFinite(raw) ? Number(raw) : 0
}

function setStorageSchemaVersion(version: number): void {
  writeCollection(storageKeys.schemaVersion, version)
}

function resetLegacyBills(): void {
  writeCollection(storageKeys.bills, [])
  writeCollection(storageKeys.ingestRecords, [])
  setStorageSchemaVersion(CURRENT_BILL_SCHEMA_VERSION)
}

export function normalizeBill(record: LegacyBillRecord): Bill {
  const now = new Date().toISOString()
  const purpose = getTrimmedString(record.purpose)

  return {
    id: getStringValue(record.id) || createId('bill'),
    source: isBillSource(record.source) ? record.source : 'bankCard',
    transactionKind: isTransactionKind(record.transactionKind) ? record.transactionKind : 'expense',
    categoryId: normalizeCategoryId(record.categoryId),
    amount: clampAmount(Number(record.amount ?? 0)),
    purpose: purpose || undefined,
    billNo: getStringValue(record.billNo),
    description: resolveBillDescription(record),
    billDate: getStringValue(record.billDate) || dayjs().format('YYYY-MM-DD HH:mm'),
    rawText: getStringValue(record.rawText),
    status: isBillStatus(record.status) ? record.status : 'confirmed',
    createdAt: getStringValue(record.createdAt) || now,
    updatedAt: getStringValue(record.updatedAt) || now,
  }
}

export function listBills(): Bill[] {
  if (getStorageSchemaVersion() < CURRENT_BILL_SCHEMA_VERSION) {
    resetLegacyBills()
  }

  const rawBills = readCollection<LegacyBillRecord[]>(storageKeys.bills, [])
  return sortBills(rawBills.map(normalizeBill))
}

export function saveBills(bills: Bill[]): Bill[] {
  const sorted = sortBills(bills.map(normalizeBill))
  writeCollection(storageKeys.bills, sorted)
  setStorageSchemaVersion(CURRENT_BILL_SCHEMA_VERSION)
  return sorted
}

export function createBill(input: BillDraftInput & Required<Pick<Bill, 'transactionKind' | 'categoryId' | 'amount' | 'billNo' | 'description' | 'billDate'>>): Bill {
  const now = new Date().toISOString()

  const bill: Bill = {
    id: createId('bill'),
    source: input.source,
    transactionKind: input.transactionKind,
    categoryId: input.categoryId,
    amount: clampAmount(input.amount),
    purpose: getTrimmedString(input.purpose) || undefined,
    billNo: input.billNo,
    description: input.description.trim(),
    billDate: input.billDate,
    rawText: input.rawText ?? '',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  }

  return bill
}

export function upsertBill(bill: Bill): Bill[] {
  const bills = listBills()
  const index = bills.findIndex((item) => item.id === bill.id)
  const nextBill = normalizeBill({
    ...bill,
    amount: clampAmount(bill.amount),
    updatedAt: new Date().toISOString(),
  })

  if (index >= 0) {
    bills.splice(index, 1, nextBill)
  } else {
    bills.push(nextBill)
  }

  return saveBills(bills)
}

export function removeBill(billId: string): Bill[] {
  return saveBills(listBills().filter((bill) => bill.id !== billId))
}

export function findBill(billId: string): Bill | null {
  return listBills().find((bill) => bill.id === billId) ?? null
}
