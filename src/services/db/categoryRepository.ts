import { defaultCategories } from '../../data/defaultCategories'
import type { Category } from '../../types/category'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

export function listCategories() {
  return readCollection<Category[]>(storageKeys.categories, defaultCategories).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )
}

export function saveCategories(categories: Category[]) {
  writeCollection(storageKeys.categories, categories)
  return categories
}

export function ensureCategories() {
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
