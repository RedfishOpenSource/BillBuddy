export type BillSource = 'manual' | 'wechat' | 'alipay'
export type BillStatus = 'draft' | 'confirmed'
export type BillSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

export interface BillImage {
  id: string
  path: string
  name: string
  mimeType: string
  size: number
  createdAt: string
}

export interface BillVideo {
  id: string
  path: string
  name: string
  mimeType: string
  size: number
  createdAt: string
}

export interface Bill {
  id: string
  source: BillSource
  categoryId: string
  amount: number
  billNo: string
  description: string
  images: BillImage[]
  videos?: BillVideo[]
  billDate: string
  rawText: string
  status: BillStatus
  createdAt: string
  updatedAt: string
}

export interface BillDraftInput {
  source: BillSource
  categoryId?: string
  amount?: number
  billNo?: string
  description?: string
  images?: BillImage[]
  videos?: BillVideo[]
  billDate?: string
  rawText?: string
}

export interface BillFilters {
  categoryId: string
  keyword: string
  startDate: string
  endDate: string
  sortBy: BillSort
}
