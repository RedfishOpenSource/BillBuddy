import { describe, expect, it } from 'vitest'
import { parseNotificationToRecord } from '../services/ingest/notificationParser'

describe('parseNotificationToRecord', () => {
  it('parses a wechat payment notification into a bill draft', () => {
    const record = parseNotificationToRecord({
      packageName: 'com.tencent.mm',
      title: '微信支付',
      text: '你向瑞幸咖啡付款￥19.90，交易单号420000123456，5月12日',
      receivedAt: '2026-05-12T10:30:00+08:00',
    })

    expect(record.sourceApp).toBe('wechat')
    expect(record.parsedStatus).toBe('parsed')
    expect(record.draft?.amount).toBe(19.9)
    expect(record.draft?.billNo).toBe('420000123456')
    expect(record.draft?.billDate).toBe('2026-05-12')
    expect(record.draft?.categoryId).toBe('food')
  })

  it('marks unsupported sources as ignored', () => {
    const record = parseNotificationToRecord({
      packageName: 'com.example.bank',
      title: '银行卡通知',
      text: '您有一笔新的交易',
    })

    expect(record.sourceApp).toBe('unknown')
    expect(record.parsedStatus).toBe('ignored')
    expect(record.draft).toBeNull()
  })
})
