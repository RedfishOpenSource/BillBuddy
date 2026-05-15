import { getNativeStorageItem, isNativeStorageAvailable, setNativeStorageItem } from '../native/storageBridge'

const memoryFallback = new Map<string, string>()
const storageCache = new Map<string, string>()
let initializedKeys = new Set<string>()

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getLocalStorageItem(key: string): string | null {
  if (!canUseLocalStorage()) {
    return null
  }

  return window.localStorage.getItem(key)
}

function setLocalStorageValue(key: string, value: string): void {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(key, value)
    return
  }

  memoryFallback.set(key, value)
}

export async function initializeStorage(keys: string[]): Promise<void> {
  const uniqueKeys = [...new Set(keys)]

  for (const key of uniqueKeys) {
    if (initializedKeys.has(key)) {
      continue
    }

    const localValue = getLocalStorageItem(key) ?? memoryFallback.get(key) ?? null

    if (isNativeStorageAvailable()) {
      const nativeValue = await getNativeStorageItem(key)
      const resolvedValue = nativeValue ?? localValue

      if (typeof resolvedValue === 'string') {
        storageCache.set(key, resolvedValue)
      }

      if (nativeValue === null && typeof localValue === 'string') {
        void setNativeStorageItem(key, localValue)
      }
    } else if (typeof localValue === 'string') {
      storageCache.set(key, localValue)
    }

    initializedKeys.add(key)
  }
}

export function readCollection<T>(key: string, fallback: T): T {
  const raw = storageCache.get(key) ?? getLocalStorageItem(key) ?? memoryFallback.get(key)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeCollection<T>(key: string, value: T) {
  const serialized = JSON.stringify(value)

  storageCache.set(key, serialized)
  initializedKeys.add(key)
  setLocalStorageValue(key, serialized)

  if (isNativeStorageAvailable()) {
    void setNativeStorageItem(key, serialized)
  }
}
