import dayjs from 'dayjs'
import type { TransactionKind } from '../types/bill'

export const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value: string, template = 'YYYY.MM.DD HH:mm') {
  return dayjs(value).format(template)
}

export function formatMonthLabel(year: number, month: number) {
  return dayjs(`${year}-${month}-01`).format('YYYY年MM月')
}

export function formatSourceLabel(source: string) {
  if (source === 'wechat') return '微信'
  if (source === 'alipay') return '支付宝'
  if (source === 'bankCard') return '银行卡'
  return '未知收支方式'
}

export function formatTransactionKindLabel(kind: TransactionKind) {
  if (kind === 'income') return '收入'
  if (kind === 'expense') return '支出'
  if (kind === 'repayment') return '还债'
  return '负债消费'
}

export function clampAmount(value: number) {
  return Math.round(value * 100) / 100
}
