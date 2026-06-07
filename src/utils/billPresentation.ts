import type { Bill } from '../types/bill'
import type { Category } from '../types/category'
import { formatDate, formatSourceLabel } from './format'

type BillDisplayTarget = Pick<Bill, 'description' | 'billNo' | 'billDate' | 'source'> & {
  purpose?: string
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncateText(value: string, maxLength = 28): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

export function getBillDisplayTitle(bill: BillDisplayTarget, category?: Pick<Category, 'name'> | null): string {
  const legacyPurpose = typeof bill.purpose === 'string' ? normalizeText(bill.purpose) : ''
  if (legacyPurpose) {
    return truncateText(legacyPurpose)
  }

  const description = normalizeText(bill.description)

  if (description) {
    return truncateText(description)
  }

  if (category?.name) {
    return `${category.name}账单`
  }

  return `${formatSourceLabel(bill.source)} ${formatDate(bill.billDate, 'MM.DD')}`
}
