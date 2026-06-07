import type { Account, AccountType } from '../../types/account'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

const defaultAccounts: Account[] = [
  {
    id: 'account-cash',
    name: '现金',
    type: 'asset_cash',
    icon: '💵',
    color: '#34c759',
    sortOrder: 100,
    createdAt: '2026-06-07T00:00:00+08:00',
    updatedAt: '2026-06-07T00:00:00+08:00',
  },
  {
    id: 'account-bank',
    name: '银行卡',
    type: 'asset_bank',
    icon: '🏦',
    color: '#4d8dff',
    sortOrder: 200,
    createdAt: '2026-06-07T00:00:00+08:00',
    updatedAt: '2026-06-07T00:00:00+08:00',
  },
  {
    id: 'account-credit',
    name: '信用卡',
    type: 'liability_credit',
    icon: '💳',
    color: '#ff8c5a',
    sortOrder: 300,
    createdAt: '2026-06-07T00:00:00+08:00',
    updatedAt: '2026-06-07T00:00:00+08:00',
  },
  {
    id: 'account-mortgage',
    name: '房贷',
    type: 'liability_mortgage',
    icon: '🏠',
    color: '#7e8ca7',
    sortOrder: 400,
    createdAt: '2026-06-07T00:00:00+08:00',
    updatedAt: '2026-06-07T00:00:00+08:00',
  },
  {
    id: 'account-ali-borrow',
    name: '借呗',
    type: 'liability_loan',
    icon: '🪙',
    color: '#ffb238',
    sortOrder: 500,
    createdAt: '2026-06-07T00:00:00+08:00',
    updatedAt: '2026-06-07T00:00:00+08:00',
  },
]

function isAccountType(value: unknown): value is AccountType {
  return value === 'asset_cash' || value === 'asset_bank' || value === 'liability_credit' || value === 'liability_mortgage' || value === 'liability_loan'
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeAccount(account: Partial<Account>, index: number): Account {
  const fallback = defaultAccounts[index] ?? defaultAccounts[0]
  const now = new Date().toISOString()

  return {
    id: getString(account.id) || fallback.id,
    name: getString(account.name) || fallback.name,
    type: isAccountType(account.type) ? account.type : fallback.type,
    icon: getString(account.icon) || fallback.icon,
    color: getString(account.color) || fallback.color,
    sortOrder: Number.isFinite(account.sortOrder) ? Number(account.sortOrder) : fallback.sortOrder,
    archived: Boolean(account.archived),
    createdAt: getString(account.createdAt) || now,
    updatedAt: getString(account.updatedAt) || now,
  }
}

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((left, right) => left.sortOrder - right.sortOrder)
}

export function listAccounts(): Account[] {
  const accounts = readCollection<Partial<Account>[]>(storageKeys.accounts, defaultAccounts)
  const normalized = sortAccounts(accounts.map(normalizeAccount))

  if (!accounts.length) {
    writeCollection(storageKeys.accounts, normalized)
  }

  return normalized
}

export function saveAccounts(accounts: Account[]): Account[] {
  const normalized = sortAccounts(accounts.map(normalizeAccount))
  writeCollection(storageKeys.accounts, normalized)
  return normalized
}

export function ensureAccounts(): Account[] {
  const accounts = listAccounts()
  if (accounts.length > 0) {
    return accounts
  }

  return saveAccounts(defaultAccounts)
}

export function upsertAccount(account: Account): Account[] {
  const accounts = listAccounts()
  const index = accounts.findIndex((item) => item.id === account.id)

  if (index >= 0) {
    accounts.splice(index, 1, account)
  } else {
    accounts.push(account)
  }

  return saveAccounts(accounts)
}
