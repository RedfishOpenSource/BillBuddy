import type { Category } from '../types/category'

export const defaultCategories: Category[] = [
  { id: 'food', name: '餐饮', type: 'expense', icon: '🍜', color: '#ff8c5a', sortOrder: 100 },
  { id: 'food-breakfast', name: '早餐', type: 'expense', parentId: 'food', icon: '🥐', color: '#ffb26b', sortOrder: 101 },
  { id: 'food-lunch', name: '午餐', type: 'expense', parentId: 'food', icon: '🍱', color: '#ff9559', sortOrder: 102 },
  { id: 'food-dinner', name: '晚餐', type: 'expense', parentId: 'food', icon: '🍲', color: '#ff7b54', sortOrder: 103 },
  { id: 'food-snack', name: '零食饮品', type: 'expense', parentId: 'food', icon: '☕', color: '#ff9f68', sortOrder: 104 },
  { id: 'food-takeout', name: '外卖', type: 'expense', parentId: 'food', icon: '🛵', color: '#ff7a45', sortOrder: 105 },
  { id: 'food-grocery', name: '买菜食材', type: 'expense', parentId: 'food', icon: '🥬', color: '#67c23a', sortOrder: 106 },

  { id: 'transport', name: '交通出行', type: 'expense', icon: '🚇', color: '#4d8dff', sortOrder: 200 },
  { id: 'transport-public', name: '公交地铁', type: 'expense', parentId: 'transport', icon: '🚌', color: '#5c96ff', sortOrder: 201 },
  { id: 'transport-taxi', name: '打车', type: 'expense', parentId: 'transport', icon: '🚕', color: '#4784f5', sortOrder: 202 },
  { id: 'transport-fuel', name: '加油充电', type: 'expense', parentId: 'transport', icon: '⛽', color: '#3e7bff', sortOrder: 203 },
  { id: 'transport-parking', name: '停车过路', type: 'expense', parentId: 'transport', icon: '🅿️', color: '#6b9eff', sortOrder: 204 },
  { id: 'transport-ticket', name: '高铁机票', type: 'expense', parentId: 'transport', icon: '🎫', color: '#6e84ff', sortOrder: 205 },

  { id: 'daily', name: '居家日用', type: 'expense', icon: '🏠', color: '#55b98e', sortOrder: 300 },
  { id: 'daily-utilities', name: '水电燃气', type: 'expense', parentId: 'daily', icon: '💡', color: '#5dc093', sortOrder: 301 },
  { id: 'daily-rent', name: '房租物业', type: 'expense', parentId: 'daily', icon: '🏘️', color: '#4fb686', sortOrder: 302 },
  { id: 'daily-home', name: '家居清洁', type: 'expense', parentId: 'daily', icon: '🧴', color: '#62c59a', sortOrder: 303 },
  { id: 'daily-communication', name: '话费网费', type: 'expense', parentId: 'daily', icon: '📶', color: '#4eb784', sortOrder: 304 },

  { id: 'shopping', name: '购物消费', type: 'expense', icon: '🛍️', color: '#ff5ea8', sortOrder: 400 },
  { id: 'shopping-daily', name: '日用品', type: 'expense', parentId: 'shopping', icon: '🧻', color: '#ff78b7', sortOrder: 401 },
  { id: 'shopping-clothing', name: '服饰鞋包', type: 'expense', parentId: 'shopping', icon: '👗', color: '#ff6ea1', sortOrder: 402 },
  { id: 'shopping-digital', name: '数码家电', type: 'expense', parentId: 'shopping', icon: '📱', color: '#ff5d92', sortOrder: 403 },
  { id: 'shopping-beauty', name: '美妆护理', type: 'expense', parentId: 'shopping', icon: '💄', color: '#ff87bf', sortOrder: 404 },

  { id: 'health', name: '医疗健康', type: 'expense', icon: '💊', color: '#9d7bff', sortOrder: 500 },
  { id: 'health-clinic', name: '门诊挂号', type: 'expense', parentId: 'health', icon: '🏥', color: '#ad89ff', sortOrder: 501 },
  { id: 'health-medicine', name: '药品保健', type: 'expense', parentId: 'health', icon: '💉', color: '#9e80ff', sortOrder: 502 },
  { id: 'health-checkup', name: '体检治疗', type: 'expense', parentId: 'health', icon: '🩺', color: '#9172ff', sortOrder: 503 },

  { id: 'education', name: '学习成长', type: 'expense', icon: '📚', color: '#6f86ff', sortOrder: 600 },
  { id: 'education-books', name: '书籍资料', type: 'expense', parentId: 'education', icon: '📖', color: '#8094ff', sortOrder: 601 },
  { id: 'education-course', name: '培训课程', type: 'expense', parentId: 'education', icon: '🧑‍🏫', color: '#7288ff', sortOrder: 602 },
  { id: 'education-exam', name: '考试学费', type: 'expense', parentId: 'education', icon: '📝', color: '#6179ff', sortOrder: 603 },

  { id: 'entertainment', name: '休闲娱乐', type: 'expense', icon: '🎮', color: '#ffb238', sortOrder: 700 },
  { id: 'entertainment-movie', name: '电影演出', type: 'expense', parentId: 'entertainment', icon: '🎬', color: '#ffbf57', sortOrder: 701 },
  { id: 'entertainment-game', name: '游戏充值', type: 'expense', parentId: 'entertainment', icon: '🕹️', color: '#ffb53d', sortOrder: 702 },
  { id: 'entertainment-sports', name: '运动健身', type: 'expense', parentId: 'entertainment', icon: '🏸', color: '#f0ac2f', sortOrder: 703 },
  { id: 'entertainment-subscription', name: '会员订阅', type: 'expense', parentId: 'entertainment', icon: '🎵', color: '#ffca67', sortOrder: 704 },

  { id: 'travel', name: '旅行出游', type: 'expense', icon: '🧳', color: '#3ab7bf', sortOrder: 800 },
  { id: 'travel-hotel', name: '酒店住宿', type: 'expense', parentId: 'travel', icon: '🏨', color: '#41c6cf', sortOrder: 801 },
  { id: 'travel-ticket', name: '景点门票', type: 'expense', parentId: 'travel', icon: '🎡', color: '#2fb1b9', sortOrder: 802 },
  { id: 'travel-local', name: '当地消费', type: 'expense', parentId: 'travel', icon: '📍', color: '#35bcc4', sortOrder: 803 },

  { id: 'social', name: '人情往来', type: 'expense', icon: '🎁', color: '#ff8e72', sortOrder: 900 },
  { id: 'social-gift', name: '礼物礼金', type: 'expense', parentId: 'social', icon: '💝', color: '#ff9c83', sortOrder: 901 },
  { id: 'social-red-envelope', name: '红包转账', type: 'expense', parentId: 'social', icon: '🧧', color: '#ff8668', sortOrder: 902 },
  { id: 'social-donation', name: '捐赠公益', type: 'expense', parentId: 'social', icon: '🤝', color: '#ff9f7f', sortOrder: 903 },

  { id: 'finance', name: '金融服务', type: 'expense', icon: '💳', color: '#7e8ca7', sortOrder: 1000 },
  { id: 'finance-fee', name: '手续费', type: 'expense', parentId: 'finance', icon: '🧾', color: '#8a97b0', sortOrder: 1001 },
  { id: 'finance-insurance', name: '保险保障', type: 'expense', parentId: 'finance', icon: '🛡️', color: '#7d8ca8', sortOrder: 1002 },
  { id: 'finance-repayment', name: '信用还款', type: 'expense', parentId: 'finance', icon: '💰', color: '#6f7f9b', sortOrder: 1003 },

  { id: 'other', name: '其他支出', type: 'expense', icon: '🧾', color: '#8f96b3', sortOrder: 1100 },
  { id: 'other-misc', name: '临时杂项', type: 'expense', parentId: 'other', icon: '📌', color: '#9aa2bf', sortOrder: 1101 },

  { id: 'salary', name: '工资收入', type: 'income', icon: '💼', color: '#2fbf71', sortOrder: 2000 },
  { id: 'salary-base', name: '基本工资', type: 'income', parentId: 'salary', icon: '💵', color: '#2fbf71', sortOrder: 2001 },
  { id: 'bonus', name: '奖金绩效', type: 'income', parentId: 'salary', icon: '✨', color: '#23b46a', sortOrder: 2002 },
  { id: 'salary-allowance', name: '津贴补助', type: 'income', parentId: 'salary', icon: '🪙', color: '#39c47a', sortOrder: 2003 },
  { id: 'salary-overtime', name: '加班补贴', type: 'income', parentId: 'salary', icon: '🕒', color: '#47ca83', sortOrder: 2004 },

  { id: 'business-income', name: '经营副业', type: 'income', icon: '🧑‍💻', color: '#36c988', sortOrder: 2100 },
  { id: 'business-income-freelance', name: '兼职劳务', type: 'income', parentId: 'business-income', icon: '🛠️', color: '#42ce92', sortOrder: 2101 },
  { id: 'business-income-sales', name: '经营收款', type: 'income', parentId: 'business-income', icon: '🏪', color: '#2fc17f', sortOrder: 2102 },
  { id: 'business-income-service', name: '服务收入', type: 'income', parentId: 'business-income', icon: '📦', color: '#55d39c', sortOrder: 2103 },

  { id: 'investment-income', name: '投资收益', type: 'income', icon: '📈', color: '#1faa63', sortOrder: 2200 },
  { id: 'investment-income-interest', name: '利息收益', type: 'income', parentId: 'investment-income', icon: '🏦', color: '#29b36d', sortOrder: 2201 },
  { id: 'investment-income-dividend', name: '分红收益', type: 'income', parentId: 'investment-income', icon: '💹', color: '#22a562', sortOrder: 2202 },
  { id: 'investment-income-fund', name: '理财到账', type: 'income', parentId: 'investment-income', icon: '📊', color: '#33bb75', sortOrder: 2203 },

  { id: 'refund-income', name: '退款返现', type: 'income', icon: '🔁', color: '#34c759', sortOrder: 2300 },
  { id: 'refund-income-refund', name: '订单退款', type: 'income', parentId: 'refund-income', icon: '↩️', color: '#3ad062', sortOrder: 2301 },
  { id: 'refund-income-cashback', name: '返现返利', type: 'income', parentId: 'refund-income', icon: '🎟️', color: '#30bd54', sortOrder: 2302 },
  { id: 'refund-income-reimbursement', name: '报销入账', type: 'income', parentId: 'refund-income', icon: '📨', color: '#44d36c', sortOrder: 2303 },

  { id: 'gift-income', name: '人情往来', type: 'income', icon: '🧧', color: '#43c977', sortOrder: 2400 },
  { id: 'gift-income-red-envelope', name: '红包礼金', type: 'income', parentId: 'gift-income', icon: '🎊', color: '#39c06d', sortOrder: 2401 },
  { id: 'gift-income-transfer', name: '亲友转账', type: 'income', parentId: 'gift-income', icon: '🤲', color: '#48cf7d', sortOrder: 2402 },

  { id: 'other-income', name: '其他收入', type: 'income', icon: '💰', color: '#34c759', sortOrder: 2500 },
  { id: 'other-income-side', name: '零散进账', type: 'income', parentId: 'other-income', icon: '🪄', color: '#45cf68', sortOrder: 2501 },
  { id: 'other-income-misc', name: '其他入账', type: 'income', parentId: 'other-income', icon: '🧺', color: '#36bf59', sortOrder: 2502 },
]
