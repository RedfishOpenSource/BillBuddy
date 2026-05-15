import type { IngestRecord, NotificationPayload } from '../../types/ingest'
import { createId } from '../../utils/id'
import { detectSourceApp } from './notificationNormalizer'
import { parseAlipayNotification } from './parsers/alipayParser'
import { parseWechatNotification } from './parsers/wechatParser'

export function parseNotificationToRecord(payload: NotificationPayload): IngestRecord {
  const sourceApp = detectSourceApp(payload)
  const receivedAt = payload.receivedAt ?? new Date().toISOString()
  const normalizedPayload = { ...payload, receivedAt }

  let draft: IngestRecord['draft'] = null

  if (sourceApp === 'wechat') {
    draft = parseWechatNotification(normalizedPayload)
  } else if (sourceApp === 'alipay') {
    draft = parseAlipayNotification(normalizedPayload)
  }

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
