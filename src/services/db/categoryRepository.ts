import { defaultCategories } from '../../data/defaultCategories'
import type { Category } from '../../types/category'
import { getCategoryDescendantIds, isChildCategory, sortCategories } from '../../utils/category'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCategories(categories: Category[]): Category[] {
  const mergedCategories = categories
    .filter((category) => category.id !== 'transfer')
    .map(
      (category): Category => ({
        ...category,
        type: category.type === 'income' ? 'income' : 'expense',
        parentId: getStringValue(category.parentId) || undefined,
      }),
    )

  defaultCategories.forEach((category) => {
    const exists = mergedCategories.some((item) => item.id === category.id)
    if (!exists) {
      mergedCategories.push(category)
    }
  })

  const categoryMap = new Map(mergedCategories.map((category) => [category.id, category]))

  return sortCategories(
    mergedCategories.map((category) => {
      const parentId = category.parentId
      const parent = parentId ? categoryMap.get(parentId) : null

      if (!parent || parent.id === category.id || isChildCategory(parent)) {
        return {
          ...category,
          parentId: undefined,
        }
      }

      return category
    }),
  )
}

function hasLegacyTransferCategory(categories: Category[]): boolean {
  return categories.some((category) => {
    const legacyCategory = category as unknown as { id?: string; type?: string }
    return legacyCategory.id === 'transfer' || legacyCategory.type === 'transfer'
  })
}

export function listCategories(): Category[] {
  const categories = readCollection<Category[]>(storageKeys.categories, defaultCategories)
  const normalized = normalizeCategories(categories)

  if (normalized.length !== categories.length || hasLegacyTransferCategory(categories)) {
    writeCollection(storageKeys.categories, normalized)
  }

  return normalized
}

export function saveCategories(categories: Category[]): Category[] {
  const normalized = normalizeCategories(categories)
  writeCollection(storageKeys.categories, normalized)
  return normalized
}

export function ensureCategories(): Category[] {
  const categories = listCategories()

  if (categories.length > 0) {
    return categories
  }

  return saveCategories(defaultCategories)
}

export function upsertCategory(category: Category) {
  const categories = listCategories()
  const index = categories.findIndex((item) => item.id === category.id)

  if (index >= 0) {
    categories.splice(index, 1, category)
  } else {
    categories.push(category)
  }

  return saveCategories(categories)
}

export function removeCategory(categoryId: string) {
  const categories = listCategories()
  const descendantIds = new Set(getCategoryDescendantIds(categoryId, categories))
  return saveCategories(categories.filter((item) => !descendantIds.has(item.id)))
}
