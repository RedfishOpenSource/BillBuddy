import { Capacitor, registerPlugin } from '@capacitor/core'

interface GetItemOptions {
  key: string
}

interface SetItemOptions {
  key: string
  value: string
}

interface StorageValueResult {
  value: string | null
}

interface BillStoragePlugin {
  getItem(options: GetItemOptions): Promise<StorageValueResult>
  setItem(options: SetItemOptions): Promise<void>
}

const BillStorage = registerPlugin<BillStoragePlugin>('BillStorage')

export function isNativeStorageAvailable(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export async function getNativeStorageItem(key: string): Promise<string | null> {
  if (!isNativeStorageAvailable()) {
    return null
  }

  try {
    const result = await BillStorage.getItem({ key })
    return typeof result.value === 'string' ? result.value : null
  } catch {
    return null
  }
}

export async function setNativeStorageItem(key: string, value: string): Promise<boolean> {
  if (!isNativeStorageAvailable()) {
    return false
  }

  try {
    await BillStorage.setItem({ key, value })
    return true
  } catch {
    return false
  }
}
