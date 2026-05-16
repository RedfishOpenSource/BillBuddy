import dayjs from 'dayjs'

const categoryKeywords: Record<string, string[]> = {
  food: ['餐', '外卖', '咖啡', '奶茶', '早餐', '午餐', '晚餐', '超市', '便利店'],
  transport: ['地铁', '打车', '公交', '出行', '滴滴', '高铁', '停车'],
  shopping: ['淘宝', '京东', '拼多多', '购物', '商店', '商城'],
  daily: ['水电', '燃气', '物业', '家居', '买菜'],
  health: ['医院', '药店', '医疗', '挂号'],
  entertainment: ['电影', '游戏', 'KTV', '音乐', '会员'],
  salary: ['工资', '薪资'],
  bonus: ['奖金', '红包', '奖励'],
}

export function extractAmount(text: string) {
  const matchers = [
    /(?:￥|¥)\s?(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s?元/,
    /收款\s?(\d+(?:\.\d{1,2})?)/,
    /付款\s?(\d+(?:\.\d{1,2})?)/,
  ]

  for (const matcher of matchers) {
    const match = text.match(matcher)
    if (match) {
      return Number(match[1])
    }
  }

  return undefined
}

export function extractBillNo(text: string) {
  const match = text.match(/(?:账单编号|交易单号|订单号|单号|商户单号)[:：\s]*([A-Za-z0-9_-]{6,})/)
  return match?.[1] ?? ''
}

export function extractBillDate(text: string, fallback = new Date().toISOString()) {
  const fullDate = text.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/)
  if (fullDate) {
    return dayjs(`${fullDate[1]}-${fullDate[2]}-${fullDate[3]}`).format('YYYY-MM-DD')
  }

  const shortDate = text.match(/(\d{1,2})月(\d{1,2})日/)
  if (shortDate) {
    const year = dayjs(fallback).year()
    return dayjs(`${year}-${shortDate[1]}-${shortDate[2]}`).format('YYYY-MM-DD')
  }

  return dayjs(fallback).format('YYYY-MM-DD')
}

export function inferCategoryId(text: string) {
  const joined = text.toLowerCase()

  for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => joined.includes(keyword.toLowerCase()))) {
      return categoryId
    }
  }

  return 'other'
}

export function inferBillSummary(text: string, fallback: string) {
  const merchantMatch = text.match(/(?:向|在)([^，。,.]{2,20}?)(?:付款|消费|收款)/)
  if (merchantMatch) {
    return merchantMatch[1]
  }

  const segments = text.split(/[，。,]/).map((item) => item.trim()).filter(Boolean)
  return segments[0]?.slice(0, 20) ?? fallback
}
