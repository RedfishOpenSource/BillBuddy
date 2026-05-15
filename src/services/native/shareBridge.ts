import { Capacitor, registerPlugin } from '@capacitor/core'

export interface ShareFileOptions {
  fileName: string
  mimeType: string
  title?: string
  targetPackage?: string
  textContent?: string
  base64Content?: string
}

export interface ShareFileResult {
  sharedVia: 'package' | 'chooser'
}

interface BillSharePlugin {
  shareFile(options: ShareFileOptions): Promise<ShareFileResult>
}

const BillShare = registerPlugin<BillSharePlugin>('BillShare')

export function isShareBridgeAvailable(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export async function shareFile(options: ShareFileOptions): Promise<ShareFileResult | null> {
  if (!isShareBridgeAvailable()) {
    return null
  }

  try {
    return await BillShare.shareFile(options)
  } catch {
    return null
  }
}
