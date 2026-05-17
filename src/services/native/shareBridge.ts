import { Capacitor, registerPlugin } from '@capacitor/core'

export interface ShareFileOptions {
  fileName: string
  mimeType: string
  title?: string
  targetPackage?: string
  preferChooser?: boolean
  textContent?: string
  base64Content?: string
}

export interface ShareFileResult {
  sharedVia: 'package' | 'chooser'
}

export interface ShareTargetOption {
  label: string
  shortLabel: string
  description: string
  targetPackage: string
}

interface BillSharePlugin {
  shareFile(options: ShareFileOptions): Promise<ShareFileResult>
}

const BillShare = registerPlugin<BillSharePlugin>('BillShare')

export const preferredShareTargets: readonly ShareTargetOption[] = [
  {
    label: '微信',
    shortLabel: '微',
    description: '优先分享到微信',
    targetPackage: 'com.tencent.mm',
  },
  {
    label: 'QQ',
    shortLabel: 'Q',
    description: '优先分享到 QQ',
    targetPackage: 'com.tencent.mobileqq',
  },
] as const

export function isShareBridgeAvailable(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export function shareFile(options: ShareFileOptions): Promise<ShareFileResult | null> {
  if (!isShareBridgeAvailable()) {
    return Promise.resolve(null)
  }

  return BillShare.shareFile(options).catch(() => null)
}
