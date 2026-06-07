import type { Bill } from '../../types/bill'
import type { Category } from '../../types/category'
import type { IngestRecord } from '../../types/ingest'
import { listBills, saveBills } from './billRepository'
import { listCategories, saveCategories } from './categoryRepository'
import { listIngestRecords, saveIngestRecords } from './ingestRepository'

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  bills: Bill[]
  categories: Category[]
  ingestRecords: IngestRecord[]
}

function isArrayCollection(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export async function createBackupPayload(): Promise<BackupPayload> {
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    bills: listBills(),
    categories: listCategories(),
    ingestRecords: listIngestRecords(),
  }
}

export function parseBackupPayload(content: string): BackupPayload {
  const parsed = JSON.parse(content) as Partial<BackupPayload>

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('备份文件格式不正确')
  }

  if (!isArrayCollection(parsed.bills) || !isArrayCollection(parsed.categories) || !isArrayCollection(parsed.ingestRecords)) {
    throw new Error('备份内容不完整')
  }

  return {
    schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    bills: parsed.bills as Bill[],
    categories: parsed.categories as Category[],
    ingestRecords: parsed.ingestRecords as IngestRecord[],
  }
}

export function applyBackupPayload(payload: BackupPayload): void {
  saveCategories(payload.categories)
  saveBills(payload.bills)
  saveIngestRecords(payload.ingestRecords)
}
