import type { Bill, TransactionKind } from '../../types/bill'

const repaymentCategoryIds = new Set(['finance-mortgage', 'finance-credit', 'finance-aliBorrow'])

export function isRepaymentCategory(categoryId: string): boolean {
  return repaymentCategoryIds.has(categoryId)
}

export function getTransactionKindLabel(kind: TransactionKind): string {
  if (kind === 'income') return '收入'
  if (kind === 'expense') return '支出'
  if (kind === 'repayment') return '还债'
  return '负债消费'
}

export function isIncomeCounted(bill: Bill): boolean {
  return bill.transactionKind === 'income'
}

export function isExpenseCounted(bill: Bill): boolean {
  return bill.transactionKind === 'expense' || bill.transactionKind === 'repayment'
}
