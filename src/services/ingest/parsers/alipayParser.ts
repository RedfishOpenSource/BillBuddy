import type { NotificationPayload, ParsedDraft } from '../../../types/ingest'
import { normalizeNotificationText } from '../notificationNormalizer'
import { extractAmount, extractBillDate, extractBillNo, inferBillSummary, inferCategoryId } from './shared'

export function parseAlipayNotification(payload: NotificationPayload): ParsedDraft {
  const text = normalizeNotificationText(payload)
  const amount = extractAmount(text)
  const purpose = inferBillSummary(text, '支付宝账单')

  return {
    source: 'alipay',
    sourceApp: 'alipay',
    amount,
    purpose,
    billNo: extractBillNo(text),
    billDate: extractBillDate(text, payload.receivedAt),
    categoryId: inferCategoryId(text),
    description: purpose,
    rawText: text,
    confidence: amount ? 0.92 : 0.45,
  }
}
