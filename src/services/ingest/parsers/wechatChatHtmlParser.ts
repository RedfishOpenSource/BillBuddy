import type { BillFormPayload } from '../../../stores/billStore'
import { parseWechatChatCandidate } from './wechatChatParser'

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\r/g, '')
}

export function parseWechatChatHtml(content: string): BillFormPayload[] {
  return stripHtml(content)
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => parseWechatChatCandidate({ text: block }))
    .filter((item): item is BillFormPayload => item !== null)
}
