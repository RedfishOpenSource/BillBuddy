import { defaultCategories } from '../../data/defaultCategories'
import type { Category } from '../../types/category'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

const requiredCategoryIds = new Set(['other-income'])

function normalizeCategories(categories: Category[]): Category[] {
  const normalizedCategories = categories
    .filter((category) => category.id !== 'transfer')
    .map(
      (category): Category => ({
        ...category,
        type: category.type === 'income' ? 'income' : 'expense',
      }),
    )

  defaultCategories.forEach((category) => {
    if (!requiredCategoryIds.has(category.id)) {
      return
    }

    const exists = normalizedCategories.some((item) => item.id === category.id)
    if (!exists) {
      normalizedCategories.push(category)
    }
  })

  return normalizedCategories.sort((left, right) => left.sortOrder - right.sortOrder)
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
  const categories = listCategories().filter((item) => item.id !== categoryId)
  return saveCategories(categories)
}
