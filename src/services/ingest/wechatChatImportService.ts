import type { BillFormPayload } from '../../stores/billStore'
import { parseWechatChatCsv } from './parsers/wechatChatCsvParser'
import { parseWechatChatHtml } from './parsers/wechatChatHtmlParser'
import { parseWechatChatText } from './parsers/wechatChatTextParser'

export interface WechatChatImportResult {
  bills: BillFormPayload[]
  skippedCount: number
}

function dedupeBills(bills: BillFormPayload[]): BillFormPayload[] {
  const seen = new Set<string>()

  return bills.filter((bill) => {
    const key = bill.billNo
      ? `billNo:${bill.billNo}`
      : `fallback:${bill.amount}|${bill.billDate}|${bill.rawText ?? ''}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function isHtmlContent(content: string): boolean {
  return /<html|<body|<div|<p|<br/i.test(content)
}

function parseByFileType(fileName: string, content: string): BillFormPayload[] {
  const normalizedName = fileName.toLowerCase()

  if (normalizedName.endsWith('.csv')) {
    return parseWechatChatCsv(content)
  }

  if (normalizedName.endsWith('.html') || normalizedName.endsWith('.htm') || isHtmlContent(content)) {
    return parseWechatChatHtml(content)
  }

  return parseWechatChatText(content)
}

export function importWechatChatFile(fileName: string, content: string): WechatChatImportResult {
  const parsed = parseByFileType(fileName, content)
  const bills = dedupeBills(parsed)

  return {
    bills,
    skippedCount: parsed.length - bills.length,
  }
}
