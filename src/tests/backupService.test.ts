import { beforeEach, describe, expect, it } from 'vitest'
import { defaultCategories } from '../data/defaultCategories'
import { createBackupPayload, applyBackupPayload, parseBackupPayload } from '../services/db/backupService'
import { listBills, saveBills } from '../services/db/billRepository'
import { saveCategories } from '../services/db/categoryRepository'
import { listIngestRecords, saveIngestRecords } from '../services/db/ingestRepository'
import type { Bill, BillImage } from '../types/bill'
import type { IngestRecord } from '../types/ingest'

const createdAt = '2026-05-14T09:00:00.000Z'
const receivedAt = '2026-05-14T09:05:00.000Z'
const billDate = '2026-05-14'
const exportedAt = '2026-05-14T09:10:00.000Z'

const testImage: BillImage = {
  id: 'image-1',
  path: 'data:image/png;base64,ZmFrZQ==',
  name: '小票.png',
  mimeType: 'image/png',
  size: 128,
  createdAt,
}

const testBill: Bill = {
  id: 'bill-1',
  source: 'manual',
  categoryId: 'food',
  amount: 32.5,
  billNo: '手动-001',
  description: '午餐套餐',
  images: [testImage],
  billDate,
  rawText: '',
  status: 'confirmed',
  createdAt,
  updatedAt: createdAt,
}

const testIngestRecord: IngestRecord = {
  id: 'ingest-1',
  sourceApp: 'wechat',
  notificationTitle: '微信支付',
  notificationText: '午餐套餐 ￥32.50',
  receivedAt,
  parsedStatus: 'needs_review',
  matchedBillId: '',
  draft: {
    source: 'wechat',
    categoryId: 'food',
    amount: 32.5,
    billNo: '微信-001',
    description: '午餐套餐',
    images: [testImage],
    billDate,
    rawText: '微信支付 午餐套餐 ￥32.50',
    confidence: 0.92,
    sourceApp: 'wechat',
  },
  errorMessage: '',
}

describe('backupService', () => {
  beforeEach(() => {
    saveBills([])
    saveIngestRecords([])
    saveCategories(defaultCategories)
  })

  it('exports bills and ingest draft images into backup payload', async () => {
    saveBills([testBill])
    saveIngestRecords([testIngestRecord])

    const payload = await createBackupPayload()

    expect(payload.schemaVersion).toBe(2)
    expect(payload.bills).toHaveLength(1)
    expect(payload.bills[0].images).toEqual([testImage])
    expect(payload.ingestRecords).toHaveLength(1)
    expect(payload.ingestRecords[0].draft?.images).toEqual([testImage])
  })

  it('restores images from backup payload after parse and apply', () => {
    const payload = parseBackupPayload(
      JSON.stringify({
        schemaVersion: 2,
        exportedAt,
        bills: [testBill],
        categories: defaultCategories,
        ingestRecords: [testIngestRecord],
      }),
    )

    applyBackupPayload(payload)

    const restoredBills = listBills()
    const restoredIngestRecords = listIngestRecords()

    expect(restoredBills).toHaveLength(1)
    expect(restoredBills[0].images).toEqual([testImage])
    expect(restoredIngestRecords).toHaveLength(1)
    expect(restoredIngestRecords[0].draft?.images).toEqual([testImage])
  })
})
