import { describe, expect, it } from 'vitest'
import { filterBills, createEmptyFilters } from '../services/analytics/billSummaryService'
import { normalizeBill } from '../services/db/billRepository'
import type { Bill } from '../types/bill'
import { getBillDisplayTitle } from '../utils/billPresentation'

describe('bill purpose compatibility', () => {
  it('prefers purpose over description when building titles', () => {
    const bill = {
      source: 'bankCard',
      transactionKind: 'expense',
      billDate: '2026-05-27',
      purpose: '午餐套餐',
      description: '公司附近简餐',
      billNo: 'MANUAL-001',
    } as const

    expect(getBillDisplayTitle(bill)).toBe('午餐套餐')
  })

  it('preserves legacy purpose during normalization', () => {
    const bill = normalizeBill({
      id: 'legacy-bill',
      source: 'wechat',
      categoryId: 'food',
      amount: 32.5,
      purpose: '麦当劳',
      description: '微信通知导入',
      billNo: '420000123456',
      billDate: '2026-05-27',
      rawText: '微信通知',
      status: 'confirmed',
      createdAt: '2026-05-27T10:00:00+08:00',
      updatedAt: '2026-05-27T10:00:00+08:00',
    })

    expect(bill.purpose).toBe('麦当劳')
    expect(bill.description).toBe('微信通知导入')
  })

  it('matches keyword searches against purpose', () => {
    const filters = createEmptyFilters()
    filters.keyword = '工资'

    const bills: Bill[] = [
      {
        id: 'bill-salary',
        source: 'bankCard',
        transactionKind: 'income',
        categoryId: 'salary',
        amount: 12800,
        purpose: '5月工资',
        billNo: 'SALARY-202605',
        description: '主业收入',
        billDate: '2026-05-01',
        rawText: '',
        status: 'confirmed',
        createdAt: '2026-05-01T09:00:00+08:00',
        updatedAt: '2026-05-01T09:00:00+08:00',
      },
    ]

    expect(filterBills(bills, filters)).toHaveLength(1)
  })
})
