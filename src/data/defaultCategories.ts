import type { Category } from '../types/category'

export const defaultCategories: Category[] = [
  { id: 'food', name: '餐饮', type: 'expense', icon: '🍜', color: '#ff8c5a', sortOrder: 1 },
  { id: 'transport', name: '交通', type: 'expense', icon: '🚇', color: '#4d8dff', sortOrder: 2 },
  { id: 'shopping', name: '购物', type: 'expense', icon: '🛍️', color: '#ff5ea8', sortOrder: 3 },
  { id: 'daily', name: '日用', type: 'expense', icon: '🏠', color: '#55b98e', sortOrder: 4 },
  { id: 'health', name: '医疗', type: 'expense', icon: '💊', color: '#9d7bff', sortOrder: 5 },
  { id: 'entertainment', name: '娱乐', type: 'expense', icon: '🎬', color: '#ffb238', sortOrder: 6 },
  { id: 'salary', name: '工资', type: 'income', icon: '💼', color: '#2fbf71', sortOrder: 7 },
  { id: 'bonus', name: '奖金', type: 'income', icon: '✨', color: '#16a34a', sortOrder: 8 },
  { id: 'other-income', name: '其他收入', type: 'income', icon: '💰', color: '#34c759', sortOrder: 9 },
  { id: 'other', name: '其他', type: 'expense', icon: '🧾', color: '#8f96b3', sortOrder: 10 },
]
