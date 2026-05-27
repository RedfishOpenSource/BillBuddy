import { Capacitor } from '@capacitor/core'
import type { Bill, BillImage, BillVideo } from '../types/bill'
import type { Category } from '../types/category'
import { formatDate, formatSourceLabel } from './format'

type BillDisplayTarget = Pick<Bill, 'description' | 'billNo' | 'billDate' | 'source'> & {
  purpose?: string
}

type BillFileTarget = Pick<BillImage | BillVideo, 'path'>

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncateText(value: string, maxLength = 28): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function resolveBillFileSrc(file: BillFileTarget): string {
  if (!file.path) {
    return ''
  }

  if (
    file.path.startsWith('data:') ||
    file.path.startsWith('blob:') ||
    file.path.startsWith('http://') ||
    file.path.startsWith('https://')
  ) {
    return file.path
  }

  return Capacitor.convertFileSrc(file.path)
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

export function resolveBillImageSrc(image: Pick<BillImage, 'path'>): string {
  return resolveBillFileSrc(image)
}

export function resolveBillVideoSrc(video: Pick<BillVideo, 'path'>): string {
  return resolveBillFileSrc(video)
}

export function getBillImageCountText(images: BillImage[]): string {
  if (!images.length) {
    return '无图片'
  }

  return `${images.length} 张图片`
}

export function getBillVideoCountText(videos: BillVideo[]): string {
  if (!videos.length) {
    return '无视频'
  }

  return `${videos.length} 段视频`
}
