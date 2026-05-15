import dayjs from 'dayjs'

export const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDate(value: string, template = 'YYYY.MM.DD') {
  return dayjs(value).format(template)
}

export function formatMonthLabel(year: number, month: number) {
  return dayjs(`${year}-${month}-01`).format('YYYY年MM月')
}

export function formatSourceLabel(source: string) {
  if (source === 'wechat') return '微信通知'
  if (source === 'alipay') return '支付宝通知'
  if (source === 'manual') return '手动录入'
  return '未知来源'
}

export function clampAmount(value: number) {
  return Math.round(value * 100) / 100
}
