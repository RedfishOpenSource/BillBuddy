import { describe, expect, it } from 'vitest'
import {
  createEmptyFilters,
  filterBills,
  sortBills,
  summarizeBills,
} from '../services/analytics/billSummaryService'
import { defaultCategories } from '../data/defaultCategories'
import type { Bill } from '../types/bill'

const bills: Bill[] = [
  {
    id: '1',
    source: 'bankCard',
    transactionKind: 'expense',
    categoryId: 'food',
    amount: 18,
    billNo: 'B1',
    description: '早餐 · 豆浆油条',
    billDate: '2026-05-01',
    rawText: '',
    status: 'confirmed',
    createdAt: '2026-05-01T08:00:00+08:00',
    updatedAt: '2026-05-01T08:00:00+08:00',
  },
  {
    id: '2',
    source: 'alipay',
    transactionKind: 'expense',
    categoryId: 'shopping',
    amount: 88.6,
    billNo: 'B2',
    description: '生活用品 · 纸巾',
    billDate: '2026-05-03',
    rawText: '',
    status: 'confirmed',
    createdAt: '2026-05-03T09:00:00+08:00',
    updatedAt: '2026-05-03T09:00:00+08:00',
  },
  {
    id: '3',
    source: 'bankCard',
    transactionKind: 'income',
    categoryId: 'salary',
    amount: 12000,
    billNo: 'B3',
    description: '5月工资',
    billDate: '2026-05-10',
    rawText: '',
    status: 'confirmed',
    createdAt: '2026-05-10T10:00:00+08:00',
    updatedAt: '2026-05-10T10:00:00+08:00',
  },
]

describe('billSummaryService', () => {
  it('filters by keyword across bill fields', () => {
    const filters = createEmptyFilters()
    filters.keyword = '12000'

    const filtered = filterBills(bills, filters, defaultCategories)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('3')
  })

  it('sorts bills by amount and date', () => {
    const amountSorted = sortBills(bills, 'amount_desc')
    const dateSorted = sortBills(bills, 'date_desc')

    expect(amountSorted[0].id).toBe('3')
    expect(dateSorted[0].id).toBe('3')
  })

  it('summarizes transaction kinds correctly', () => {
    const summary = summarizeBills(bills)
    expect(summary.expense).toBe(106.6)
    expect(summary.income).toBe(12000)
    expect(summary.debtExpense).toBe(0)
    expect(summary.repayment).toBe(0)
    expect(summary.net).toBe(11893.4)
  })
})
