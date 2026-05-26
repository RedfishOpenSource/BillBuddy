export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  type: CategoryType
  parentId?: string
  icon: string
  color: string
  sortOrder: number
}
