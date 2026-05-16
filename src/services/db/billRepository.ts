import dayjs from 'dayjs'
import type { Bill, BillDraftInput, BillImage, BillSource, BillStatus, BillVideo } from '../../types/bill'
import { clampAmount } from '../../utils/format'
import { createId } from '../../utils/id'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

type LegacyBillRecord = Partial<Bill> & {
  purpose?: unknown
  images?: unknown
  videos?: unknown
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
  return value === 'manual' || value === 'wechat' || value === 'alipay'
}

function isBillStatus(value: unknown): value is BillStatus {
  return value === 'draft' || value === 'confirmed'
}

function normalizeBillImage(item: unknown, index: number): BillImage | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const image = item as Partial<BillImage>
  const path = getStringValue(image.path)

  if (!path) {
    return null
  }

  return {
    id: getStringValue(image.id) || createId(`bill-image-${index}`),
    path,
    name: getStringValue(image.name) || `账单图片-${index + 1}`,
    mimeType: getStringValue(image.mimeType) || 'image/jpeg',
    size: Number.isFinite(image.size) ? Number(image.size) : 0,
    createdAt: getStringValue(image.createdAt) || new Date().toISOString(),
  }
}

function normalizeBillImages(value: unknown): BillImage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => normalizeBillImage(item, index))
    .filter((image): image is BillImage => image !== null)
}

function normalizeBillVideo(item: unknown, index: number): BillVideo | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const video = item as Partial<BillVideo>
  const path = getStringValue(video.path)

  if (!path) {
    return null
  }

  return {
    id: getStringValue(video.id) || createId(`bill-video-${index}`),
    path,
    name: getStringValue(video.name) || `账单视频-${index + 1}`,
    mimeType: getStringValue(video.mimeType) || 'video/mp4',
    size: Number.isFinite(video.size) ? Number(video.size) : 0,
    createdAt: getStringValue(video.createdAt) || new Date().toISOString(),
  }
}

function normalizeBillVideos(value: unknown): BillVideo[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => normalizeBillVideo(item, index))
    .filter((video): video is BillVideo => video !== null)
}

function normalizeCategoryId(value: unknown): string {
  const categoryId = getStringValue(value)

  if (!categoryId || categoryId === 'transfer') {
    return 'other'
  }

  return categoryId
}

function resolveBillDescription(record: LegacyBillRecord): string {
  const description = getTrimmedString(record.description)

  if (description) {
    return description
  }

  return getTrimmedString(record.purpose)
}

export function normalizeBill(record: LegacyBillRecord): Bill {
  const now = new Date().toISOString()

  return {
    id: getStringValue(record.id) || createId('bill'),
    source: isBillSource(record.source) ? record.source : 'manual',
    categoryId: normalizeCategoryId(record.categoryId),
    amount: clampAmount(Number(record.amount ?? 0)),
    billNo: getStringValue(record.billNo),
    description: resolveBillDescription(record),
    images: normalizeBillImages(record.images),
    videos: normalizeBillVideos(record.videos),
    billDate: getStringValue(record.billDate) || dayjs().format('YYYY-MM-DD'),
    rawText: getStringValue(record.rawText),
    status: isBillStatus(record.status) ? record.status : 'confirmed',
    createdAt: getStringValue(record.createdAt) || now,
    updatedAt: getStringValue(record.updatedAt) || now,
  }
}

export function listBills(): Bill[] {
  const rawBills = readCollection<LegacyBillRecord[]>(storageKeys.bills, [])
  return sortBills(rawBills.map(normalizeBill))
}

export function saveBills(bills: Bill[]): Bill[] {
  const sorted = sortBills(bills.map(normalizeBill))
  writeCollection(storageKeys.bills, sorted)
  return sorted
}

export function createBill(input: BillDraftInput & Required<Pick<Bill, 'categoryId' | 'amount' | 'billNo' | 'description' | 'billDate'>>): Bill {
  const now = new Date().toISOString()

  const bill: Bill = {
    id: createId('bill'),
    source: input.source,
    categoryId: input.categoryId,
    amount: clampAmount(input.amount),
    billNo: input.billNo,
    description: input.description.trim(),
    images: normalizeBillImages(input.images),
    videos: normalizeBillVideos(input.videos),
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
