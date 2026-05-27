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
        rawText: '微信支付 地铁出行 6.00',
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
        rawText: '支付宝支出 88.60',
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'bill-demo-4',
        source: 'manual',
        categoryId: 'salary',
        purpose: '月度工资',
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

test('bills toolbar settings drawer opens and closes', async ({ page }) => {
  await page.goto('/bills')

  await page.locator('.bill-search-strip__settings').click()
  await expect(page.locator('.settings-drawer-panel')).toBeVisible()
  await expect(page).toHaveURL(/drawer=settings/)

  await page.locator('.settings-drawer-panel .el-drawer__close-btn').click()
  await expect(page.locator('.settings-drawer-panel')).toBeHidden()
  await expect(page).not.toHaveURL(/drawer=settings/)
})

test('bills toolbar share button triggers web share fallback', async ({ page }) => {
  await seedDemoBills(page)
  await page.addInitScript(() => {
    ;(window as any).__billBuddyShareCalled = false
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: () => true,
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        ;(window as any).__billBuddyShareCalled = true
      },
    })
  })

  await page.goto('/bills')
  await page.locator('.bill-search-strip__more').click()

  await expect
    .poll(() => page.evaluate(() => Boolean((window as any).__billBuddyShareCalled)))
    .toBe(true)
})

test('stats year selector defaults to current year and spans previous and next 10 years', async ({ page }) => {
  const currentYear = new Date().getFullYear()

  await page.goto('/stats')

  const yearSelect = page.locator('.stats-toolbar__control').first()
  await expect(yearSelect).toContainText(String(currentYear))

  await yearSelect.locator('.el-select__wrapper').click()

  const yearOptions = page.locator('.el-select-dropdown:visible .el-select-dropdown__item')
  await expect(yearOptions).toHaveCount(21)
  await expect(yearOptions.first()).toContainText(String(currentYear - 10))
  await expect(yearOptions.last()).toContainText(String(currentYear + 10))
})
