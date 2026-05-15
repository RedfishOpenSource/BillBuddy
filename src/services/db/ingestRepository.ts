import type { IngestRecord } from '../../types/ingest'
import { storageKeys } from './keys'
import { readCollection, writeCollection } from './storage'

function sortRecords(records: IngestRecord[]) {
  return [...records].sort(
    (left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime(),
  )
}

export function listIngestRecords() {
  return sortRecords(readCollection<IngestRecord[]>(storageKeys.ingestRecords, []))
}

export function saveIngestRecords(records: IngestRecord[]) {
  const sorted = sortRecords(records)
  writeCollection(storageKeys.ingestRecords, sorted)
  return sorted
}

export function upsertIngestRecord(record: IngestRecord) {
  const records = listIngestRecords()
  const index = records.findIndex((item) => item.id === record.id)

  if (index >= 0) {
    records.splice(index, 1, record)
  } else {
    records.push(record)
  }

  return saveIngestRecords(records)
}

export function removeIngestRecord(recordId: string) {
  return saveIngestRecords(listIngestRecords().filter((record) => record.id !== recordId))
}
