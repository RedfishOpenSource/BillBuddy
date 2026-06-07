import dayjs from 'dayjs'
import type { BillFormPayload } from '../../../stores/billStore'
import { extractAmount, extractBillDate, extractBillNo, inferBillSummary, inferCategoryId } from './shared'

const paymentKeywords = ['微信支付', '付款', '收款', '转账', '退款', '交易单号', '商户单号', '订单号']

export interface WechatChatCandidate {
  timestamp?: string
  text: string
}

function containsPaymentKeyword(text: string): boolean {
  return paymentKeywords.some((keyword) => text.includes(keyword))
}

function normalizeTimestamp(timestamp?: string): string {
  return timestamp ? dayjs(timestamp).toISOString() : new Date().toISOString()
}

export function parseWechatChatCandidate(candidate: WechatChatCandidate): BillFormPayload | null {
  const text = candidate.text.trim()

  if (!text || !containsPaymentKeyword(text)) {
    return null
  }

  const amount = extractAmount(text)

  if (amount === undefined || Number.isNaN(amount) || amount <= 0) {
    return null
  }

  const fallbackTimestamp = normalizeTimestamp(candidate.timestamp)
  const description = inferBillSummary(text, '微信账单')

  return {
    source: 'wechat',
    transactionKind: 'expense',
    categoryId: inferCategoryId(text),
    amount,
    purpose: description,
    billNo: extractBillNo(text),
    description,
    billDate: extractBillDate(text, fallbackTimestamp),
    rawText: text,
    status: 'confirmed',
  }
}
