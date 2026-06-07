export type BillSource = 'bankCard' | 'wechat' | 'alipay'
export type BillStatus = 'draft' | 'confirmed'
export type BillSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
export type TransactionKind = 'income' | 'expense' | 'repayment' | 'debt_expense'

export interface Bill {
  id: string
  source: BillSource
  transactionKind: TransactionKind
  categoryId: string
  amount: number
  purpose?: string
  billNo: string
  description: string
  billDate: string
  rawText: string
  status: BillStatus
  createdAt: string
  updatedAt: string
}

export interface BillDraftInput {
  source: BillSource
  transactionKind?: TransactionKind
  categoryId?: string
  amount?: number
  purpose?: string
  billNo?: string
  description?: string
  billDate?: string
  rawText?: string
}

export interface BillFilters {
  transactionKind: string
  keyword: string
  startDate: string
  endDate: string
  sortBy: BillSort
}
