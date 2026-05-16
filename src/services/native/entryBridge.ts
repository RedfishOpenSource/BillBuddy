import { Capacitor, registerPlugin } from '@capacitor/core'
import type { BillImage, BillVideo } from '../../types/bill'
import { createId } from '../../utils/id'

interface NativeEntryAsset {
  path: string
  name: string
  mimeType: string
  size: number
  createdAt: string
}

interface NativeEntryResult {
  cancelled?: boolean
}

interface PickImagesResult extends NativeEntryResult {
  assets?: NativeEntryAsset[]
}

interface CaptureAssetResult extends NativeEntryResult {
  asset?: NativeEntryAsset | null
}

interface SpeechResult extends NativeEntryResult {
  text?: string
}

interface BillEntryPlugin {
  pickImages(): Promise<PickImagesResult>
  capturePhoto(): Promise<CaptureAssetResult>
  captureVideo(): Promise<CaptureAssetResult>
  recognizeSpeech(options?: { prompt?: string }): Promise<SpeechResult>
}

const BillEntry = registerPlugin<BillEntryPlugin>('BillEntry')

function mapImageAsset(asset: NativeEntryAsset): BillImage {
  return {
    id: createId('bill-image'),
    path: asset.path,
    name: asset.name,
    mimeType: asset.mimeType,
    size: asset.size,
    createdAt: asset.createdAt,
  }
}

function mapVideoAsset(asset: NativeEntryAsset): BillVideo {
  return {
    id: createId('bill-video'),
    path: asset.path,
    name: asset.name,
    mimeType: asset.mimeType,
    size: asset.size,
    createdAt: asset.createdAt,
  }
}

async function runEntryAction<T>(action: () => Promise<T>): Promise<T | null> {
  if (!isBillEntryAvailable()) {
    return null
  }

  try {
    return await action()
  } catch {
    return null
  }
}

export function isBillEntryAvailable(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export async function pickBillImages(): Promise<BillImage[] | null> {
  return runEntryAction(async function () {
    const result = await BillEntry.pickImages()
    if (result.cancelled) {
      return []
    }

    return (result.assets ?? []).map(mapImageAsset)
  })
}

export async function captureBillPhoto(): Promise<BillImage | null> {
  return runEntryAction(async function () {
    const result = await BillEntry.capturePhoto()
    if (result.cancelled || !result.asset) {
      return null
    }

    return mapImageAsset(result.asset)
  })
}

export async function captureBillVideo(): Promise<BillVideo | null> {
  return runEntryAction(async function () {
    const result = await BillEntry.captureVideo()
    if (result.cancelled || !result.asset) {
      return null
    }

    return mapVideoAsset(result.asset)
  })
}

export async function recognizeBillSpeech(prompt = '请说出账单内容'): Promise<string | null> {
  return runEntryAction(async function () {
    const result = await BillEntry.recognizeSpeech({ prompt })
    if (result.cancelled) {
      return null
    }

    const text = result.text?.trim() ?? ''
    return text || null
  })
}
