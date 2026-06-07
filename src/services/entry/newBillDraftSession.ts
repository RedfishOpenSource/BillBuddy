import type { BillSource, TransactionKind } from '../../types/bill'

export type NewBillEntryMode = 'text' | 'ai'

export interface PendingNewBillDraft {
  mode: NewBillEntryMode
  source?: BillSource
  transactionKind?: TransactionKind
  categoryId?: string
  amount?: number
  purpose?: string
  billNo?: string
  description?: string
  billDate?: string
  rawText?: string
}

let pendingNewBillDraft: PendingNewBillDraft | null = null

function cloneDraft(draft: PendingNewBillDraft): PendingNewBillDraft {
  return {
    ...draft,
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
