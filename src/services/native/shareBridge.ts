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

export class ShareBridgeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShareBridgeError'
  }
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

function decodeBase64Content(base64Content: string, mimeType: string): Blob {
  const binary = window.atob(base64Content)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

function buildShareBlob(options: ShareFileOptions): Blob {
  if (options.base64Content) {
    return decodeBase64Content(options.base64Content, options.mimeType)
  }

  return new Blob([options.textContent ?? ''], { type: options.mimeType })
}

export function isShareBridgeAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

async function shareWithWebApi(options: ShareFileOptions): Promise<ShareFileResult | null> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return null
  }

  const blob = buildShareBlob(options)
  const file = new File([blob], options.fileName, { type: options.mimeType })

  if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
    return null
  }

  try {
    await navigator.share({
      title: options.title,
      text: options.textContent,
      files: [file],
    })
    return { sharedVia: 'chooser' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null
    }

    throw new ShareBridgeError(error instanceof Error ? error.message : '浏览器分享失败')
  }
}

export async function shareFile(options: ShareFileOptions): Promise<ShareFileResult | null> {
  if (isShareBridgeAvailable()) {
    try {
      return await BillShare.shareFile(options)
    } catch (error) {
      const webShared = await shareWithWebApi(options).catch((webError) => {
        throw webError
      })

      if (webShared) {
        return webShared
      }

      throw new ShareBridgeError(error instanceof Error ? error.message : '系统分享不可用')
    }
  }

  return shareWithWebApi(options)
}
