import { Capacitor } from '@capacitor/core'
import type { Bill, BillImage } from '../types/bill'
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
  const description = normalizeText(bill.description)

  if (description) {
    return truncateText(description)
  }

  const legacyPurpose = typeof bill.purpose === 'string' ? normalizeText(bill.purpose) : ''
  if (legacyPurpose) {
    return truncateText(legacyPurpose)
  }

  if (category?.name) {
    return `${category.name}账单`
  }

  return `${formatSourceLabel(bill.source)} ${formatDate(bill.billDate, 'MM.DD')}`
}

export function resolveBillImageSrc(image: Pick<BillImage, 'path'>): string {
  if (!image.path) {
    return ''
  }

  if (
    image.path.startsWith('data:') ||
    image.path.startsWith('blob:') ||
    image.path.startsWith('http://') ||
    image.path.startsWith('https://')
  ) {
    return image.path
  }

  return Capacitor.convertFileSrc(image.path)
}

export function getBillImageCountText(images: BillImage[]): string {
  if (!images.length) {
    return '无图片'
  }

  return `${images.length} 张图片`
}
