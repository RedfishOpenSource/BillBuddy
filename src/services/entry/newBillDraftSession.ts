import type { BillImage, BillSource, BillVideo } from '../../types/bill'

export type NewBillEntryMode = 'text' | 'gallery' | 'camera' | 'video' | 'ai'

export interface PendingNewBillDraft {
  mode: NewBillEntryMode
  source?: BillSource
  categoryId?: string
  amount?: number
  purpose?: string
  billNo?: string
  description?: string
  images?: BillImage[]
  videos?: BillVideo[]
  billDate?: string
  rawText?: string
}

let pendingNewBillDraft: PendingNewBillDraft | null = null

function cloneDraft(draft: PendingNewBillDraft): PendingNewBillDraft {
  return {
    ...draft,
    images: [...(draft.images ?? [])],
    videos: [...(draft.videos ?? [])],
  }
}

export function setPendingNewBillDraft(draft: PendingNewBillDraft | null): void {
  pendingNewBillDraft = draft ? cloneDraft(draft) : null
}

export function consumePendingNewBillDraft(): PendingNewBillDraft | null {
  if (!pendingNewBillDraft) {
    return null
  }

  const currentDraft = cloneDraft(pendingNewBillDraft)
  pendingNewBillDraft = null
  return currentDraft
}
