import type { IngestRecord, NotificationPayload } from '../../types/ingest'
import { createId } from '../../utils/id'
import { detectSourceApp, isPaymentNotificationPayload } from './notificationNormalizer'
import { parseAlipayNotification } from './parsers/alipayParser'
import { parseWechatNotification } from './parsers/wechatParser'

export function parseNotificationToRecord(payload: NotificationPayload): IngestRecord {
  const sourceApp = detectSourceApp(payload)
  const receivedAt = payload.receivedAt ?? new Date().toISOString()
  const normalizedPayload = { ...payload, receivedAt }

  if (!isPaymentNotificationPayload(normalizedPayload)) {
    return {
      id: createId('ingest'),
      sourceApp,
      notificationTitle: payload.title,
      notificationText: payload.text,
      receivedAt,
      parsedStatus: 'ignored',
      matchedBillId: '',
      draft: null,
      errorMessage: '已忽略非支付类通知',
    }
  }

  const draft = sourceApp === 'wechat'
    ? parseWechatNotification(normalizedPayload)
    : sourceApp === 'alipay'
      ? parseAlipayNotification(normalizedPayload)
      : null

  const parsedStatus = !draft ? 'ignored' : draft.confidence >= 0.8 ? 'parsed' : 'needs_review'

  return {
    id: createId('ingest'),
    sourceApp,
    notificationTitle: payload.title,
    notificationText: payload.text,
    receivedAt,
    parsedStatus,
    matchedBillId: '',
    draft,
    errorMessage: draft ? '' : '暂不支持解析该通知来源',
  }
}
