import dayjs from 'dayjs'
import type { Bill, BillFilters, BillSort } from '../../types/bill'
import type { Category } from '../../types/category'
import { getCategoryDisplayName } from '../../utils/category'

export interface SummaryMetrics {
  income: number
  expense: number
  debtExpense: number
  repayment: number
  net: number
  count: number
}

export interface TransactionSummaryItem {
  key: 'income' | 'expense' | 'debt_expense' | 'repayment'
  label: string
  amount: number
  color: string
}

export interface TrendPoint {
  label: string
  income: number
  expense: number
}

export function createEmptyFilters(): BillFilters {
  return {
    transactionKind: '',
    keyword: '',
    startDate: '',
    endDate: '',
    sortBy: 'date_desc',
  }
}

export function filterBills(bills: Bill[], filters: BillFilters, categories: Category[] = []): Bill[] {
  const keyword = filters.keyword.trim().toLowerCase()
  const categoryNameMap = new Map(categories.map((item) => [item.id, getCategoryDisplayName(item, categories)]))

  return bills.filter((bill) => {
    if (filters.transactionKind && bill.transactionKind !== filters.transactionKind) return false
    if (filters.startDate && dayjs(bill.billDate).isBefore(dayjs(filters.startDate), 'day')) return false
    if (filters.endDate && dayjs(bill.billDate).isAfter(dayjs(filters.endDate), 'day')) return false

    if (!keyword) return true

    return [
      bill.purpose ?? '',
      bill.description,
      bill.billNo,
      bill.billDate,
      bill.amount,
      bill.source,
      bill.rawText,
      bill.status,
      categoryNameMap.get(bill.categoryId) ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
}

export function sortBills(bills: Bill[], sortBy: BillSort): Bill[] {
  const sorted = [...bills]

  if (sortBy === 'amount_desc') {
    return sorted.sort((left, right) => right.amount - left.amount)
  }

  if (sortBy === 'amount_asc') {
    return sorted.sort((left, right) => left.amount - right.amount)
  }

  if (sortBy === 'date_asc') {
    return sorted.sort((left, right) => dayjs(left.billDate).valueOf() - dayjs(right.billDate).valueOf())
  }

  return sorted.sort((left, right) => dayjs(right.billDate).valueOf() - dayjs(left.billDate).valueOf())
}

export function summarizeBills(bills: Bill[]): SummaryMetrics {
  const summary = bills.reduce<SummaryMetrics>(
    (currentSummary, bill) => {
      if (bill.transactionKind === 'income') {
        currentSummary.income += bill.amount
      }

      if (bill.transactionKind === 'expense') {
        currentSummary.expense += bill.amount
      }

      if (bill.transactionKind === 'debt_expense') {
        currentSummary.debtExpense += bill.amount
      }

      if (bill.transactionKind === 'repayment') {
        currentSummary.repayment += bill.amount
      }

      currentSummary.count += 1
      return currentSummary
    },
    { income: 0, expense: 0, debtExpense: 0, repayment: 0, net: 0, count: 0 },
  )

  summary.net = summary.income - summary.expense -summary.debtExpense
  return summary
}

export function buildTransactionSummary(bills: Bill[]): TransactionSummaryItem[] {
  const summary = summarizeBills(bills)

  return [
    { key: 'income', label: '收入', amount: summary.income, color: '#67c23a' },
    { key: 'expense', label: '支出', amount: summary.expense, color: '#f56c6c' },
    { key: 'debt_expense', label: '负债消费', amount: summary.debtExpense, color: '#e6a23c' },
    { key: 'repayment', label: '还债', amount: summary.repayment, color: '#409eff' },
  ]
}

export function getMonthBills(bills: Bill[], year: number, month: number): Bill[] {
  return bills.filter((bill) => {
    const date = dayjs(bill.billDate)
    return date.year() === year && date.month() + 1 === month
  })
}

export function getYearBills(bills: Bill[], year: number): Bill[] {
  return bills.filter((bill) => dayjs(bill.billDate).year() === year)
}

export function getAvailableYears(bills: Bill[]): number[] {
  const years = new Set(bills.map((bill) => dayjs(bill.billDate).year()))
  const currentYear = dayjs().year()
  years.add(currentYear)
  return [...years].sort((left, right) => right - left)
}
