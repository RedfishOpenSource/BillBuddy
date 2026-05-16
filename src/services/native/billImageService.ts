import type { BillImage, BillVideo } from '../../types/bill'
import { createId } from '../../utils/id'

const maxImageSide = 1600
const imageQuality = 0.82

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('文件读取失败'))
        return
      }

      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error('图片解码失败'))
    image.onload = () => resolve(image)
    image.src = source
  })
}

async function compressImage(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const longestSide = Math.max(image.width, image.height)
  const scale = longestSide > maxImageSide ? maxImageSide / longestSide : 1
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('无法压缩图片')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, targetWidth, targetHeight)
  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL('image/jpeg', imageQuality)
}

export async function createBillImagesFromFiles(files: File[] | FileList): Promise<BillImage[]> {
  const fileList = Array.from(files)

  return Promise.all(
    fileList.map(async (file) => ({
      id: createId('bill-image'),
      path: await compressImage(file),
      name: file.name || `bill-image-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      size: file.size,
      createdAt: new Date().toISOString(),
    })),
  )
}

export async function createBillVideosFromFiles(files: File[] | FileList): Promise<BillVideo[]> {
  const fileList = Array.from(files)

  return Promise.all(
    fileList.map(async (file) => ({
      id: createId('bill-video'),
      path: await readFileAsDataUrl(file),
      name: file.name || `bill-video-${Date.now()}.mp4`,
      mimeType: file.type || 'video/mp4',
      size: file.size,
      createdAt: new Date().toISOString(),
    })),
  )
}
