import { expect, test, type Page } from '@playwright/test'

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function seedStorage(page: Page, values: Record<string, unknown>): Promise<void> {
  await page.addInitScript((entries) => {
    Object.entries(entries).forEach(([key, value]) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    })
  }, values)
}

async function seedDemoBills(page: Page): Promise<void> {
  const now = new Date()
  const yesterday = new Date(now)
  const twoDaysAgo = new Date(now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  yesterday.setDate(now.getDate() - 1)
  twoDaysAgo.setDate(now.getDate() - 2)

  const nowIso = now.toISOString()

  await seedStorage(page, {
    'billbuddy:bills': [
      {
        id: 'bill-demo-1',
        source: 'manual',
        categoryId: 'food',
        purpose: '午餐套餐',
        amount: 32,
        billNo: 'MANUAL-001',
        description: '公司附近简餐',
        billDate: formatDate(now),
        rawText: '',
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'bill-demo-2',
        source: 'wechat',
        categoryId: 'transport',
        purpose: '地铁出行',
        amount: 6,
        billNo: 'WX-20260512-01',
        description: '通勤',
        billDate: formatDate(yesterday),
        rawText: '微信支付 地铁出行 ￥6.00',
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'bill-demo-3',
        source: 'alipay',
        categoryId: 'shopping',
        purpose: '日用品采购',
        amount: 88.6,
        billNo: 'ALI-20260510-03',
        description: '洗发水和纸巾',
        billDate: formatDate(twoDaysAgo),
        rawText: '支付宝支出 ￥88.60',
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'bill-demo-4',
        source: 'manual',
        categoryId: 'salary',
        purpose: '5月工资',
        amount: 12800,
        billNo: 'SALARY-202605',
        description: '主业收入',
        billDate: formatDate(monthStart),
        rawText: '',
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
  })
}

async function seedWechatNotification(page: Page): Promise<void> {
  const now = new Date()
  const nowIso = now.toISOString()

  await seedStorage(page, {
    'billbuddy:ingest-records': [
      {
        id: 'ingest-demo-1',
        sourceApp: 'wechat',
        notificationTitle: '微信支付',
        notificationText: '你向麦当劳付款￥32.50，交易单号420000123456，5月12日',
        receivedAt: nowIso,
        parsedStatus: 'parsed',
        matchedBillId: '',
        draft: {
          source: 'wechat',
          categoryId: 'food',
          purpose: '麦当劳',
          amount: 32.5,
          billNo: '420000123456',
          description: '微信通知导入',
          billDate: formatDate(now),
          rawText: '微信通知：你向麦当劳付款￥32.50，交易单号420000123456，5月12日',
          confidence: 0.98,
          sourceApp: 'wechat',
        },
        errorMessage: '',
      },
    ],
  })
}

test('home dashboard renders on mobile viewport', async ({ page }) => {
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: 'BillBuddy' })).toBeVisible()
  await expect(page.getByText('个人账本、通知导入与月度汇总都集中在这里。')).toBeVisible()
})

test('demo bills can be seeded and browsed', async ({ page }) => {
  await seedDemoBills(page)

  await page.goto('/bills')
  await expect(page.getByRole('heading', { name: '账单检索' })).toBeVisible()
  await expect(page.getByText('午餐套餐').first()).toBeVisible()
  await expect(page.getByText('5月工资').first()).toBeVisible()
})

test('wechat notification draft can be confirmed into a bill', async ({ page }) => {
  await seedWechatNotification(page)

  await page.goto('/inbox')
  await expect(page.getByRole('heading', { name: '麦当劳' })).toBeVisible()
  await page.getByRole('button', { name: '确认入账' }).first().click()

  await expect(page.getByRole('heading', { name: '确认通知账单' })).toBeVisible()
  await page.getByRole('button', { name: '确认并保存' }).click()

  await expect(page).toHaveURL(/\/bill\//)
  await expect(page.getByText('微信通知导入')).toBeVisible()
  await expect(page.getByRole('heading', { name: '麦当劳' })).toBeVisible()
})
