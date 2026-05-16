import dayjs from 'dayjs'
import type { Bill, BillFilters, BillSort } from '../../types/bill'
import type { Category } from '../../types/category'

export interface SummaryMetrics {
  income: number
  expense: number
  net: number
  count: number
}

export interface CategorySummaryItem {
  categoryId: string
  name: string
  type: Category['type']
  color: string
  amount: number
  count: number
}

export interface TrendPoint {
  label: string
  income: number
  expense: number
}

export function createEmptyFilters(): BillFilters {
  return {
    categoryId: '',
    keyword: '',
    startDate: '',
    endDate: '',
    sortBy: 'date_desc',
  }
}

export function filterBills(bills: Bill[], filters: BillFilters, categories: Category[] = []): Bill[] {
  const keyword = filters.keyword.trim().toLowerCase()
  const categoryNameMap = new Map(categories.map((item) => [item.id, item.name]))

  return bills.filter((bill) => {
    if (filters.categoryId && bill.categoryId !== filters.categoryId) return false
    if (filters.startDate && dayjs(bill.billDate).isBefore(dayjs(filters.startDate), 'day')) return false
    if (filters.endDate && dayjs(bill.billDate).isAfter(dayjs(filters.endDate), 'day')) return false

    if (!keyword) return true

    return [
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

export function summarizeBills(bills: Bill[], categories: Category[]): SummaryMetrics {
  const categoryMap = new Map(categories.map((item) => [item.id, item]))
  const summary = bills.reduce<SummaryMetrics>(
    (currentSummary, bill) => {
      const type = categoryMap.get(bill.categoryId)?.type ?? 'expense'

      if (type === 'income') {
        currentSummary.income += bill.amount
      } else {
        currentSummary.expense += bill.amount
      }

      currentSummary.count += 1
      return currentSummary
    },
    { income: 0, expense: 0, net: 0, count: 0 },
  )

  summary.net = summary.income - summary.expense
  return summary
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

export function buildCategorySummary(bills: Bill[], categories: Category[]): CategorySummaryItem[] {
  const categoryMap = new Map(categories.map((item) => [item.id, item]))
  const bucket = new Map<string, CategorySummaryItem>()

  bills.forEach((bill) => {
    const category = categoryMap.get(bill.categoryId)

    if (!category) return

    const current = bucket.get(category.id) ?? {
      categoryId: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      amount: 0,
      count: 0,
    }

    current.amount += bill.amount
    current.count += 1
    bucket.set(category.id, current)
  })

  return [...bucket.values()].sort((left, right) => right.amount - left.amount)
}

function summarizeTrendBucket(bills: Bill[], categoryMap: Map<string, Category>): Pick<TrendPoint, 'income' | 'expense'> {
  return bills.reduce(
    (summary, bill) => {
      const type = categoryMap.get(bill.categoryId)?.type ?? 'expense'

      if (type === 'income') {
        summary.income += bill.amount
      }

      if (type === 'expense') {
        summary.expense += bill.amount
      }

      return summary
    },
    { income: 0, expense: 0 },
  )
}

export function buildYearlyTrend(bills: Bill[], categories: Category[], year: number): TrendPoint[] {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)
  const categoryMap = new Map(categories.map((item) => [item.id, item]))

  return months.map<TrendPoint>((month) => {
    const monthBills = getMonthBills(bills, year, month)
    const { income, expense } = summarizeTrendBucket(monthBills, categoryMap)

    return {
      label: `${month}月`,
      income,
      expense,
    }
  })
}

export function buildMonthlyTrend(bills: Bill[], categories: Category[], year: number, month: number): TrendPoint[] {
  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  const daysInMonth = monthStart.daysInMonth()
  const monthBills = getMonthBills(bills, year, month)
  const categoryMap = new Map(categories.map((item) => [item.id, item]))

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const dayBills = monthBills.filter((bill) => dayjs(bill.billDate).date() === day)
    const { income, expense } = summarizeTrendBucket(dayBills, categoryMap)

    return {
      label: `${day}日`,
      income,
      expense,
    }
  })
}

export function getAvailableYears(bills: Bill[]): number[] {
  const years = new Set(bills.map((bill) => dayjs(bill.billDate).year()))
  const currentYear = dayjs().year()
  years.add(currentYear)
  return [...years].sort((left, right) => right - left)
}
