import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { createBill, findBill, listBills, removeBill, upsertBill } from '../services/db/billRepository'
import type { Bill, BillImage, BillSource, BillStatus, BillVideo } from '../types/bill'

export interface BillFormPayload {
  id?: string
  source: BillSource
  categoryId: string
  amount: number
  billNo: string
  description: string
  images: BillImage[]
  videos?: BillVideo[]
  billDate: string
  rawText?: string
  status?: BillStatus
}

function buildUpdatedBill(existing: Bill, payload: BillFormPayload): Bill {
  return {
    ...existing,
    ...payload,
    amount: Number(payload.amount),
    images: payload.images ?? [],
    videos: payload.videos ?? [],
    updatedAt: new Date().toISOString(),
    status: payload.status ?? existing.status,
  }
}

export const useBillStore = defineStore('bills', {
  state: () => ({
    bills: [] as Bill[],
  }),
  getters: {
    recentBills: (state) => state.bills.slice(0, 6),
    getBillById: () => (billId: string) => findBill(billId),
  },
  actions: {
    hydrate() {
      this.bills = listBills()
    },
    saveBill(payload: BillFormPayload) {
      const existing = payload.id ? this.bills.find((bill) => bill.id === payload.id) : null

      const bill = existing
        ? buildUpdatedBill(existing, payload)
        : createBill({
            source: payload.source,
            categoryId: payload.categoryId,
            amount: Number(payload.amount),
            billNo: payload.billNo,
            description: payload.description,
            images: payload.images ?? [],
            videos: payload.videos ?? [],
            billDate: payload.billDate || dayjs().format('YYYY-MM-DD'),
            rawText: payload.rawText,
          })

      this.bills = upsertBill(bill)
      return bill
    },
    deleteBill(billId: string) {
      this.bills = removeBill(billId)
    },
    seedDemoBills() {
      if (this.bills.length > 0) {
        return
      }

      const samples: BillFormPayload[] = [
        {
          source: 'manual',
          categoryId: 'food',
          amount: 32,
          billNo: '手动-001',
          description: '午餐套餐 · 公司附近简餐',
          images: [],
          videos: [],
          billDate: dayjs().format('YYYY-MM-DD'),
        },
        {
          source: 'wechat',
          categoryId: 'transport',
          amount: 6,
          billNo: '微信-20260512-01',
          description: '地铁出行 · 通勤',
          images: [],
          videos: [],
          billDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
          rawText: '微信支付 地铁出行 ￥6.00',
        },
        {
          source: 'alipay',
          categoryId: 'shopping',
          amount: 88.6,
          billNo: '支出-20260510-03',
          description: '日用品采购 · 洗发水和纸巾',
          images: [],
          videos: [],
          billDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
          rawText: '支付宝支出 ￥88.60',
        },
        {
          source: 'manual',
          categoryId: 'salary',
          amount: 12800,
          billNo: '工资-202605',
          description: '5月工资入账',
          images: [],
          videos: [],
          billDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        },
      ]

      samples.forEach((sample) => {
        this.saveBill(sample)
      })
    },
  },
})
