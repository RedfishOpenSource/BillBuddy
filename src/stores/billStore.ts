import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { createBill, findBill, listBills, removeBill, upsertBill } from '../services/db/billRepository'
import type { Bill, BillSource, BillStatus, TransactionKind } from '../types/bill'

export interface BillFormPayload {
  id?: string
  source: BillSource
  transactionKind: TransactionKind
  categoryId: string
  amount?: number
  purpose?: string
  billNo: string
  description: string
  billDate: string
  rawText?: string
  status?: BillStatus
}

function buildUpdatedBill(existing: Bill, payload: BillFormPayload): Bill {
  return {
    ...existing,
    ...payload,
    amount: Number(payload.amount),
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
            transactionKind: payload.transactionKind,
            categoryId: payload.categoryId,
            amount: Number(payload.amount),
            purpose: payload.purpose,
            billNo: payload.billNo,
            description: payload.description,
            billDate: payload.billDate || dayjs().format('YYYY-MM-DD HH:mm'),
            rawText: payload.rawText,
          })

      this.bills = upsertBill(bill)
      return bill
    },
    saveBills(payloads: BillFormPayload[]) {
      const bills = payloads.map((payload) => this.saveBill(payload))
      return bills
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
          source: 'bankCard',
          transactionKind: 'expense',
          categoryId: 'food',
          amount: 32,
          billNo: '手动-001',
          description: '午餐套餐 · 公司附近简餐',
          billDate: dayjs().format('YYYY-MM-DD HH:mm'),
        },
        {
          source: 'wechat',
          transactionKind: 'expense',
          categoryId: 'transport',
          amount: 6,
          billNo: '微信-20260512-01',
          description: '地铁出行 · 通勤',
          billDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
          rawText: '微信支付 地铁出行 ￥6.00',
        },
        {
          source: 'alipay',
          transactionKind: 'expense',
          categoryId: 'shopping',
          amount: 88.6,
          billNo: '支出-20260510-03',
          description: '日用品采购 · 洗发水和纸巾',
          billDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
          rawText: '支付宝支出 ￥88.60',
        },
        {
          source: 'bankCard',
          transactionKind: 'income',
          categoryId: 'salary',
          amount: 12800,
          billNo: '工资-202605',
          description: '5月工资入账',
          billDate: dayjs().startOf('month').format('YYYY-MM-DD HH:mm'),
        },
      ]

      samples.forEach((sample) => {
        this.saveBill(sample)
      })
    },
  },
})
