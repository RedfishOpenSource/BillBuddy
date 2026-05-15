import { defineStore } from 'pinia'
import { ensureCategories, removeCategory, upsertCategory } from '../services/db/categoryRepository'
import type { Category, CategoryType } from '../types/category'
import { createId } from '../utils/id'

interface CategoryInput {
  id?: string
  name: string
  type: CategoryType
  icon: string
  color: string
}

export const useCategoryStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
  }),
  getters: {
    sortedCategories: (state) => [...state.categories].sort((left, right) => left.sortOrder - right.sortOrder),
    getCategoryById: (state) => (categoryId: string) =>
      state.categories.find((category) => category.id === categoryId) ?? null,
  },
  actions: {
    hydrate() {
      this.categories = ensureCategories()
    },
    saveCategory(input: CategoryInput) {
      const existing = input.id ? this.categories.find((category) => category.id === input.id) : null
      const category: Category = {
        id: input.id ?? createId('category'),
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
        sortOrder: existing?.sortOrder ?? this.categories.length + 1,
      }

      this.categories = upsertCategory(category)
      return category
    },
    deleteCategory(categoryId: string) {
      this.categories = removeCategory(categoryId)
    },
  },
})
