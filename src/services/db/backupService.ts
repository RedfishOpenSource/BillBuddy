import type { Bill, BillImage } from '../../types/bill'
import type { Category } from '../../types/category'
import type { IngestRecord } from '../../types/ingest'
import { resolveBillImageSrc } from '../../utils/billPresentation'
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(blob)
  })
}

async function createPortableImage(image: BillImage): Promise<BillImage> {
  if (!image.path || image.path.startsWith('data:')) {
    return image
  }

  const resolvedPath = resolveBillImageSrc(image)

  if (!resolvedPath) {
    return image
  }

  try {
    const response = await fetch(resolvedPath)

    if (!response.ok) {
      throw new Error('图片获取失败')
    }

    return {
      ...image,
      path: await blobToDataUrl(await response.blob()),
    }
  } catch {
    return image
  }
}

async function createPortableBill(bill: Bill): Promise<Bill> {
  return {
    ...bill,
    images: await Promise.all((bill.images ?? []).map(createPortableImage)),
  }
}

async function createPortableIngestRecord(record: IngestRecord): Promise<IngestRecord> {
  if (!record.draft?.images?.length) {
    return record
  }

  return {
    ...record,
    draft: {
      ...record.draft,
      images: await Promise.all(record.draft.images.map(createPortableImage)),
    },
  }
}

export async function createBackupPayload(): Promise<BackupPayload> {
  return {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    bills: await Promise.all(listBills().map(createPortableBill)),
    categories: listCategories(),
    ingestRecords: await Promise.all(listIngestRecords().map(createPortableIngestRecord)),
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
