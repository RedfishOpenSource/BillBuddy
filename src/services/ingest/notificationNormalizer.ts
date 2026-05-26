import type { IngestSourceApp, NotificationPayload } from '../../types/ingest'

const amountPattern = /(?:[¥￥]\s*\d+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?\s*元|金额[:：\s]*\d+(?:\.\d{1,2})?)/i
const billNoPattern = /(?:交易单号|订单号|商户单号|转账单号|收款单号|账单编号)[:：\s]*[A-Za-z0-9_-]{6,}/i
const wechatTitlePattern = /(微信支付|微信收款|微信转账|收款到账通知|转账收款|付款成功|支付成功)/i
const wechatTextPattern = /(向.+付款|向你转账|收到转账|微信支付|微信转账|收款到账|付款成功|支付成功|商户单号|交易单号|二维码收款|退款)/i
const alipayTitlePattern = /(付款成功|支付成功|收钱到账|收款到账|转账提醒|转账成功|退款成功|入账提醒)/i
const alipayTextPattern = /(支付宝支出|支付宝收入|向.+付款|向你转账|收钱到账|收款到账|交易成功|付款成功|支付成功|订单号|交易单号|商户单号|nfc支付|退款成功)/i

export function detectSourceApp(payload: NotificationPayload): IngestSourceApp {
  const packageName = payload.packageName.toLowerCase()
  const joined = normalizeNotificationText(payload).toLowerCase()

  if (packageName.includes('tencent.mm') || joined.includes('微信')) {
    return 'wechat'
  }

  if (packageName.includes('alipay') || joined.includes('支付宝')) {
    return 'alipay'
  }

  return 'unknown'
}

export function normalizeNotificationText(payload: NotificationPayload): string {
  return `${payload.title} ${payload.text}`.replace(/\s+/g, ' ').trim()
}

export function isPaymentNotificationPayload(payload: NotificationPayload): boolean {
  const sourceApp = detectSourceApp(payload)
  const normalizedText = normalizeNotificationText(payload)
  const hasPaymentAmount = amountPattern.test(normalizedText) || billNoPattern.test(normalizedText)

  if (!hasPaymentAmount) {
    return false
  }

  if (sourceApp === 'wechat') {
    return wechatTitlePattern.test(payload.title) || wechatTextPattern.test(normalizedText)
  }

  if (sourceApp === 'alipay') {
    return alipayTitlePattern.test(payload.title) || alipayTextPattern.test(normalizedText.toLowerCase())
  }

  return false
}
