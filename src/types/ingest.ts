import type { BillDraftInput } from './bill'

export type IngestSourceApp = 'wechat' | 'alipay' | 'unknown'
export type IngestParseStatus = 'parsed' | 'needs_review' | 'ignored' | 'confirmed'

export interface NotificationPayload {
  packageName: string
  title: string
  text: string
  receivedAt?: string
}

export interface ParsedDraft extends BillDraftInput {
  confidence: number
  sourceApp: IngestSourceApp
}

export interface IngestRecord {
  id: string
  sourceApp: IngestSourceApp
  notificationTitle: string
  notificationText: string
  receivedAt: string
  parsedStatus: IngestParseStatus
  matchedBillId: string
  draft: ParsedDraft | null
  errorMessage: string
}
