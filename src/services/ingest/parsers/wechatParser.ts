import type { NotificationPayload, ParsedDraft } from '../../../types/ingest'
import { normalizeNotificationText } from '../notificationNormalizer'
import { extractAmount, extractBillDate, extractBillNo, inferBillSummary, inferCategoryId } from './shared'

export function parseWechatNotification(payload: NotificationPayload): ParsedDraft {
  const text = normalizeNotificationText(payload)
  const amount = extractAmount(text)

  return {
    source: 'wechat',
    sourceApp: 'wechat',
    amount,
    billNo: extractBillNo(text),
    billDate: extractBillDate(text, payload.receivedAt),
    categoryId: inferCategoryId(text),
    description: inferBillSummary(text, '微信账单'),
    rawText: text,
    confidence: amount ? 0.9 : 0.45,
  }
}
