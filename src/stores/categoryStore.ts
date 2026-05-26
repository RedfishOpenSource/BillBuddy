import { defineStore } from 'pinia'
import { ensureCategories, removeCategory, upsertCategory } from '../services/db/categoryRepository'
import type { Category, CategoryType } from '../types/category'
import { isChildCategory, sortCategories } from '../utils/category'
import { createId } from '../utils/id'

interface CategoryInput {
  id?: string
  name: string
  type: CategoryType
  parentId?: string
  icon: string
  color: string
}

export const useCategoryStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
  }),
  getters: {
    sortedCategories: (state) => sortCategories(state.categories),
    getCategoryById: (state) => (categoryId: string) =>
      state.categories.find((category) => category.id === categoryId) ?? null,
  },
  actions: {
    hydrate() {
      this.categories = ensureCategories()
    },
    saveCategory(input: CategoryInput) {
      const existing = input.id ? this.categories.find((category) => category.id === input.id) : null
      const parentId = input.parentId?.trim() || undefined
      const parent = parentId ? this.categories.find((category) => category.id === parentId) ?? null : null

      if (parent && isChildCategory(parent)) {
        throw new Error('仅支持一级分类和二级分类')
      }

      if (parent && parent.type !== input.type) {
        throw new Error('二级分类必须与一级分类保持同一收支类型')
      }

      const hasChildren = existing
        ? this.categories.some((category) => category.parentId === existing.id)
        : false

      if (existing && hasChildren && parentId) {
        throw new Error('当前一级分类下已有二级分类，暂不支持再改成二级分类')
      }

      const siblingCategories = this.categories.filter((category) => {
        if (existing && category.id === existing.id) {
          return false
        }

        return (category.parentId ?? '') === (parentId ?? '')
      })

      const category: Category = {
        id: input.id ?? createId('category'),
        name: input.name,
        type: input.type,
        parentId,
        icon: input.icon,
        color: input.color,
        sortOrder: existing?.sortOrder ?? (Math.max(0, ...siblingCategories.map((item) => item.sortOrder)) + 1),
      }

      this.categories = upsertCategory(category)
      return category
    },
    deleteCategory(categoryId: string) {
      this.categories = removeCategory(categoryId)
    },
  },
})
