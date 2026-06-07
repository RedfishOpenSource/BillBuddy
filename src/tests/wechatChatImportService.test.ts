import { describe, expect, it } from 'vitest'
import { parseWechatChatText } from '../services/ingest/parsers/wechatChatTextParser'
import { parseWechatChatHtml } from '../services/ingest/parsers/wechatChatHtmlParser'
import { parseWechatChatCsv } from '../services/ingest/parsers/wechatChatCsvParser'
import { importWechatChatFile } from '../services/ingest/wechatChatImportService'

describe('wechatChatImportService', () => {
  it('parses wechat payment records from plain text blocks', () => {
    const content = [
      '2026-05-12 10:30',
      '微信支付',
      '你向瑞幸咖啡付款￥19.90，交易单号420000123456，5月12日',
      '',
      '今天晚上吃什么？',
    ].join('\n')

    const bills = parseWechatChatText(content)

    expect(bills).toHaveLength(1)
    expect(bills[0].amount).toBe(19.9)
    expect(bills[0].billNo).toBe('420000123456')
    expect(bills[0].categoryId).toBe('food')
    expect(bills[0].source).toBe('wechat')
  })

  it('parses html chat content by stripping tags', () => {
    const content = '<html><body><div>微信支付<br>向便利店付款￥12.80，订单号A123456，2026-05-13</div></body></html>'

    const bills = parseWechatChatHtml(content)

    expect(bills).toHaveLength(1)
    expect(bills[0].amount).toBe(12.8)
    expect(bills[0].billNo).toBe('A123456')
  })

  it('parses csv chat rows', () => {
    const content = [
      '2026-05-14 09:00,微信支付,收款 88.00元 订单号 WX778899',
      '2026-05-14 10:00,聊天消息,记得买菜',
    ].join('\n')

    const bills = parseWechatChatCsv(content)

    expect(bills).toHaveLength(1)
    expect(bills[0].amount).toBe(88)
    expect(bills[0].billNo).toBe('WX778899')
  })

  it('deduplicates repeated records during file import', () => {
    const content = [
      '2026-05-12 10:30',
      '微信支付',
      '你向瑞幸咖啡付款￥19.90，交易单号420000123456，5月12日',
      '',
      '2026-05-12 10:30',
      '微信支付',
      '你向瑞幸咖啡付款￥19.90，交易单号420000123456，5月12日',
    ].join('\n')

    const result = importWechatChatFile('wechat.txt', content)

    expect(result.bills).toHaveLength(1)
    expect(result.skippedCount).toBe(1)
  })

  it('skips non-payment chat content', () => {
    const content = [
      '2026-05-12 10:30',
      '今天晚上吃什么？',
      '',
      '2026-05-12 11:00',
      '收到，晚上见',
    ].join('\n')

    const result = importWechatChatFile('wechat.txt', content)

    expect(result.bills).toHaveLength(0)
    expect(result.skippedCount).toBe(0)
  })
})
