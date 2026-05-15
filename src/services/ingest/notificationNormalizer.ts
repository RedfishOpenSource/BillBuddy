import type { IngestSourceApp, NotificationPayload } from '../../types/ingest'

export function detectSourceApp(payload: NotificationPayload): IngestSourceApp {
  const packageName = payload.packageName.toLowerCase()
  const joined = `${payload.title} ${payload.text}`.toLowerCase()

  if (packageName.includes('tencent.mm') || joined.includes('微信')) {
    return 'wechat'
  }

  if (packageName.includes('alipay') || joined.includes('支付宝')) {
    return 'alipay'
  }

  return 'unknown'
}

export function normalizeNotificationText(payload: NotificationPayload) {
  return `${payload.title} ${payload.text}`.replace(/\s+/g, ' ').trim()
}
