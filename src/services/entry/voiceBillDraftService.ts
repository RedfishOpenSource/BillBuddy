import dayjs from 'dayjs'
import type { Category } from '../../types/category'
import { sortCategories } from '../../utils/category'
import { extractAmount, extractBillDate, extractBillNo, inferBillSummary } from '../ingest/parsers/shared'
import { localAiBillModel } from './localAiBillModel'
import type { PendingNewBillDraft } from './newBillDraftSession'

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function includesAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

function inferCategoryId(text: string, categories: Category[]): string {
  const normalizedText = text.toLowerCase()
  const prioritizedCategories = [...sortCategories(categories)].sort(
    (left, right) => Number(Boolean(right.parentId)) - Number(Boolean(left.parentId)),
  )

  for (const category of prioritizedCategories) {
    if (normalizedText.includes(category.name.toLowerCase())) {
      return category.id
    }

    const categoryKeywords = localAiBillModel.categoryKeywords[category.id as keyof typeof localAiBillModel.categoryKeywords] ?? []
    if (includesAny(normalizedText, categoryKeywords)) {
      return category.id
    }
  }

  if (includesAny(normalizedText, localAiBillModel.incomeKeywords)) {
    return categories.some((category) => category.id === 'other-income') ? 'other-income' : 'salary'
  }

  if (includesAny(normalizedText, localAiBillModel.expenseKeywords)) {
    return 'other'
  }

  return 'other'
}

export function buildVoiceBillDraft(text: string, categories: Category[]): PendingNewBillDraft {
  const normalizedText = normalizeText(text)
  const amount = extractAmount(normalizedText) ?? 0

  return {
    mode: 'ai',
    source: 'bankCard',
    categoryId: inferCategoryId(normalizedText, categories),
    amount,
    billNo: extractBillNo(normalizedText),
    description: inferBillSummary(normalizedText, '语音录入账单'),
    billDate: extractBillDate(normalizedText, dayjs().toISOString()),
    rawText: normalizedText,
  }
}
