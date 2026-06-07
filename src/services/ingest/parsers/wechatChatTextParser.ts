import type { BillFormPayload } from '../../../stores/billStore'
import { parseWechatChatCandidate } from './wechatChatParser'

const timestampPattern = /^(20\d{2}[./-]\d{1,2}[./-]\d{1,2}|20\d{2}年\d{1,2}月\d{1,2}日)(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/

function splitMessageBlocks(content: string): string[] {
  return content
    .split(/\r?\n\s*\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function extractTimestamp(block: string): string | undefined {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return lines.find((line) => timestampPattern.test(line))
}

export function parseWechatChatText(content: string): BillFormPayload[] {
  return splitMessageBlocks(content)
    .map((block) => parseWechatChatCandidate({
      timestamp: extractTimestamp(block),
      text: block,
    }))
    .filter((item): item is BillFormPayload => item !== null)
}
