import type { BillFormPayload } from '../../../stores/billStore'
import { parseWechatChatCandidate } from './wechatChatParser'

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

export function parseWechatChatCsv(content: string): BillFormPayload[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseCsvLine(line))
    .map((values) => parseWechatChatCandidate({
      timestamp: values[0],
      text: values.join(' '),
    }))
    .filter((item): item is BillFormPayload => item !== null)
}
