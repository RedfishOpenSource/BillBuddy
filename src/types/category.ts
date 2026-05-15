export type CategoryType = 'expense' | 'income' | 'transfer'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  sortOrder: number
}
