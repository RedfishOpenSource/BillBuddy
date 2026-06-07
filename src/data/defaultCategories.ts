import type { Category } from '../types/category'

export const defaultCategories: Category[] = [
  { id: 'food', name: '餐饮', type: 'expense', icon: '🍜', color: '#ff8c5a', sortOrder: 100 },
  { id: 'food-breakfast', name: '早餐', type: 'expense', parentId: 'food', icon: '🥐', color: '#ffb26b', sortOrder: 101 },
  { id: 'food-lunch', name: '午餐', type: 'expense', parentId: 'food', icon: '🍱', color: '#ff9559', sortOrder: 102 },
  { id: 'food-dinner', name: '晚餐', type: 'expense', parentId: 'food', icon: '🍲', color: '#ff7b54', sortOrder: 103 },

  { id: 'transport', name: '交通出行', type: 'expense', icon: '🚇', color: '#4d8dff', sortOrder: 200 },
  { id: 'transport-public', name: '地铁', type: 'expense', parentId: 'transport', icon: '🚌', color: '#5c96ff', sortOrder: 201 },
  { id: 'transport-taxi', name: '打车', type: 'expense', parentId: 'transport', icon: '🚕', color: '#4784f5', sortOrder: 202 },
  { id: 'transport-fuel', name: '加油充电', type: 'expense', parentId: 'transport', icon: '⛽', color: '#3e7bff', sortOrder: 203 },
  { id: 'transport-parking', name: '停车过路', type: 'expense', parentId: 'transport', icon: '🅿️', color: '#6b9eff', sortOrder: 204 },
  { id: 'transport-ticket', name: '高铁机票', type: 'expense', parentId: 'transport', icon: '🎫', color: '#6e84ff', sortOrder: 205 },

  { id: 'daily', name: '居家日用', type: 'expense', icon: '🏠', color: '#55b98e', sortOrder: 300 },
  { id: 'daily-utilities', name: '水电燃气', type: 'expense', parentId: 'daily', icon: '💡', color: '#5dc093', sortOrder: 301 },
  { id: 'daily-rent', name: '房租物业', type: 'expense', parentId: 'daily', icon: '🏘️', color: '#4fb686', sortOrder: 302 },
  { id: 'daily-communication', name: '话费网费', type: 'expense', parentId: 'daily', icon: '📶', color: '#4eb784', sortOrder: 304 },
  { id: 'daily-daily', name: '日用品', type: 'expense', parentId: 'daily', icon: '🧻', color: '#ff78b7', sortOrder: 305 },

  { id: 'entertainment', name: '个人爱好', type: 'expense', icon: '🎮', color: '#ffb238', sortOrder: 700 },
  { id: 'entertainment-aiSubscribtion', name: 'AI订阅', type: 'expense', parentId: 'entertainment', icon: '🎬', color: '#ffbf57', sortOrder: 701 },
  { id: 'entertainment-vediosSubscription', name: '视频会员', type: 'expense', parentId: 'entertainment', icon: '🎵', color: '#ffca67', sortOrder: 702 },


  { id: 'social', name: '人情往来', type: 'expense', icon: '🎁', color: '#ff8e72', sortOrder: 900 },
  { id: 'social-gift', name: '礼金支出', type: 'expense', parentId: 'social', icon: '💝', color: '#ff9c83', sortOrder: 901 },

  { id: 'finance', name: '债务还款', type: 'expense', icon: '💳', color: '#7e8ca7', sortOrder: 1000 },
  { id: 'finance-mortgage', name: '房贷还款', type: 'expense', parentId: 'finance', icon: '🛡️', color: '#7d8ca8', sortOrder: 1002 },
  { id: 'finance-credit', name: '信用还款', type: 'expense', parentId: 'finance', icon: '💰', color: '#6f7f9b', sortOrder: 1003 },
  { id: 'finance-aliBorrow', name: '借呗还款', type: 'expense', parentId: 'finance', icon: '💰', color: '#6f7f9b', sortOrder: 1003 },


  { id: 'salary', name: '工资收入', type: 'income', icon: '💼', color: '#2fbf71', sortOrder: 2000 },
  { id: 'salary-base', name: '基本工资', type: 'income', parentId: 'salary', icon: '💵', color: '#2fbf71', sortOrder: 2001 },


  { id: 'other-income', name: '其他收支', type: 'income', icon: '💰', color: '#34c759', sortOrder: 2500 },
  { id: 'other-income_item', name: '其他入账', type: 'income', parentId: 'other-income', icon: '🪄', color: '#45cf68', sortOrder: 2501 },

  
]
