import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import type { Bill, BillFilters, BillImage, BillSort, BillStatus } from '../../types/bill'
import type { Category } from '../../types/category'
import { getCategoryDisplayName } from '../../utils/category'
import { resolveBillImageSrc } from '../../utils/billPresentation'
import { formatCurrency, formatDate, formatSourceLabel } from '../../utils/format'
import type { CategorySummaryItem, SummaryMetrics, TrendPoint } from './billSummaryService'

export type ShareFormat = 'pdf' | 'html' | 'markdown' | 'excel'
export type ShareResultChannel = 'package' | 'chooser' | 'download'

export interface PreparedShareFile {
  fileName: string
  mimeType: string
  textContent?: string
  base64Content?: string
}

interface BillsReportOptions {
  title: string
  filters: BillFilters
  bills: Bill[]
  categories: Category[]
}

interface StatsReportOptions {
  title: string
  summaryLabel: string
  summary: SummaryMetrics
  trendTitle: string
  trend: TrendPoint[]
  categorySummary: CategorySummaryItem[]
}

interface BillExportImage {
  id: string
  name: string
  mimeType: string
  size: number
  createdAt: string
  src: string
}

interface BillExportCard {
  bill: Bill
  title: string
  categoryName: string
  sourceLabel: string
  statusLabel: string
  images: BillExportImage[]
}

interface BillsReportContext {
  cards: BillExportCard[]
  filterCategoryName: string
}

const legacyExcelMimeType = 'application/vnd.ms-excel'
const xlsxMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const pdfPageWidth = 1240
const pdfPageHeight = 1754
const pdfMarginX = 70
const pdfMarginTop = 88
const pdfPageRenderWidth = 595.28
const pdfPageRenderHeight = 841.89
const pdfFieldGap = 26
const pdfFieldRowHeight = 88
const pdfImageSize = 170
const pdfImageGap = 20

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, '\n').trim()
}

function formatMultilineHtml(value: string): string {
  const text = normalizeText(value)
  return text ? escapeHtml(text).replace(/\n/g, '<br />') : '无'
}

function truncateText(value: string, maxLength = 18): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return window.btoa(binary)
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('无法读取图片内容'))
    reader.readAsDataURL(blob)
  })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法加载图片'))
    image.src = src
  })
}

function createCategoryMap(categories: Category[]): Map<string, string> {
  return new Map(categories.map((category) => [category.id, getCategoryDisplayName(category, categories)]))
}

function getBillStatusLabel(status: BillStatus): string {
  if (status === 'draft') {
    return '草稿'
  }

  return '已确认'
}

function getSortLabel(sortBy: BillSort): string {
  switch (sortBy) {
    case 'date_asc':
      return '按日期从早到晚'
    case 'amount_desc':
      return '按金额从高到低'
    case 'amount_asc':
      return '按金额从低到高'
    default:
      return '按日期从新到旧'
  }
}

function formatDateTime(value: string): string {
  return value ? formatDate(value, 'YYYY年MM月DD日 HH:mm:ss') : '无'
}

function formatImageSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return '未知'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function getBillExportTitle(bill: Bill, categoryName: string): string {
  const description = normalizeText(bill.description)

  if (description) {
    return description.replace(/\n/g, ' ')
  }

  if (categoryName) {
    return `${categoryName}账单`
  }

  return `${formatSourceLabel(bill.source)} ${formatDate(bill.billDate, 'MM月DD日')}`
}

function getFilterSummaryText(filters: BillFilters, categoryName: string): string {
  return [
    `关键字：${filters.keyword || '全部'}`,
    `分类：${categoryName || '全部分类'}`,
    `开始日期：${filters.startDate || '不限'}`,
    `结束日期：${filters.endDate || '不限'}`,
    `排序方式：${getSortLabel(filters.sortBy)}`,
  ].join(' ｜ ')
}

function countBillsWithImages(cards: BillExportCard[]): number {
  return cards.filter((card) => card.images.length > 0).length
}

function countBillImages(cards: BillExportCard[]): number {
  return cards.reduce((total, card) => total + card.images.length, 0)
}

async function createEmbeddedImageSrc(image: BillImage): Promise<string> {
  const resolvedSrc = resolveBillImageSrc(image)

  if (!resolvedSrc) {
    return ''
  }

  if (resolvedSrc.startsWith('data:')) {
    return resolvedSrc
  }

  try {
    const response = await fetch(resolvedSrc)

    if (!response.ok) {
      throw new Error('无法获取图片内容')
    }

    return await blobToDataUrl(await response.blob())
  } catch {
    return resolvedSrc.startsWith('http://') || resolvedSrc.startsWith('https://') ? resolvedSrc : ''
  }
}

async function createBillExportCard(bill: Bill, categoryName: string): Promise<BillExportCard> {
  const images = await Promise.all(
    bill.images.map(async (image, index) => ({
      id: image.id,
      name: image.name || `票据图片 ${index + 1}`,
      mimeType: image.mimeType || '未知类型',
      size: image.size,
      createdAt: image.createdAt,
      src: await createEmbeddedImageSrc(image),
    })),
  )

  return {
    bill,
    title: getBillExportTitle(bill, categoryName),
    categoryName: categoryName || '未分类',
    sourceLabel: formatSourceLabel(bill.source),
    statusLabel: getBillStatusLabel(bill.status),
    images,
  }
}

async function buildBillExportCards(options: BillsReportOptions): Promise<BillExportCard[]> {
  const categoryMap = createCategoryMap(options.categories)

  return Promise.all(
    options.bills.map((bill) => createBillExportCard(bill, categoryMap.get(bill.categoryId) ?? '未分类')),
  )
}

async function buildBillsReportContext(options: BillsReportOptions): Promise<BillsReportContext> {
  const cards = await buildBillExportCards(options)
  const categoryMap = createCategoryMap(options.categories)

  return {
    cards,
    filterCategoryName: categoryMap.get(options.filters.categoryId) ?? '全部分类',
  }
}

function buildDocument(title: string, body: string, extraStyles = ''): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
      body { margin: 0; padding: 24px; background: #f5f7fa; color: #303133; }
      main { max-width: 980px; margin: 0 auto; display: grid; gap: 16px; }
      section { background: #fff; border: 1px solid #ebeef5; border-radius: 18px; padding: 20px; }
      h1, h2, h3, h4, p { margin: 0; }
      h1 { font-size: 28px; }
      h2 { font-size: 22px; }
      h3 { font-size: 18px; }
      p { color: #606266; }
      .eyebrow { display: inline-block; margin-bottom: 6px; color: #909399; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
      .meta { display: grid; gap: 8px; }
      .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .tile { border: 1px solid #ebeef5; border-radius: 14px; padding: 16px; background: #fafafa; }
      .tile span { display: block; margin-bottom: 8px; color: #909399; font-size: 13px; }
      .tile strong { font-size: 22px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { padding: 10px 12px; border-bottom: 1px solid #ebeef5; text-align: left; vertical-align: top; }
      th { color: #909399; font-weight: 600; }
      .muted { color: #909399; }
      ${extraStyles}
      @media (max-width: 720px) {
        body { padding: 14px; }
        .stats, .bill-share-card__field-grid, .bill-share-card__image-grid { grid-template-columns: 1fr !important; }
      }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`
}

function buildExcelDocument(title: string, body: string, extraStyles = ''): string {
  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: 'Microsoft YaHei', sans-serif; margin: 16px; color: #303133; }
      h1, h2, p { margin: 0; }
      .meta { margin-bottom: 16px; display: grid; gap: 6px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #dcdfe6; padding: 10px; text-align: left; vertical-align: top; word-break: break-word; }
      th { background: #f5f7fa; color: #606266; }
      img { display: block; width: 120px; height: 120px; object-fit: cover; border-radius: 10px; border: 1px solid #ebeef5; margin-bottom: 8px; }
      .image-stack { display: grid; gap: 10px; }
      .image-card { padding: 8px; border: 1px solid #ebeef5; border-radius: 10px; background: #fafafa; }
      .image-meta { display: grid; gap: 4px; font-size: 12px; color: #606266; }
      ${extraStyles}
    </style>
  </head>
  <body>${body}</body>
</html>`
}

function downloadBlob(fileName: string, blob: Blob): void {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

function createCanvasPage(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = pdfPageWidth
  canvas.height = pdfPageHeight
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('无法创建 PDF 画布')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.textBaseline = 'top'
  return canvas
}

function drawPageHeader(context: CanvasRenderingContext2D, title: string, subtitleLines: string[]): number {
  context.fillStyle = '#0f172a'
  context.font = "600 48px 'PingFang SC', 'Microsoft YaHei', sans-serif"
  context.fillText(title, pdfMarginX, pdfMarginTop)

  context.fillStyle = '#64748b'
  context.font = "400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif"

  let currentY = pdfMarginTop + 74
  subtitleLines.forEach((line) => {
    context.fillText(line, pdfMarginX, currentY)
    currentY += 36
  })

  return currentY + 24
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const paragraphs = normalizeText(text).split('\n').filter(Boolean)

  if (!paragraphs.length) {
    return ['无']
  }

  paragraphs.forEach((paragraph) => {
    let currentLine = ''

    Array.from(paragraph).forEach((character) => {
      const nextLine = `${currentLine}${character}`
      if (context.measureText(nextLine).width <= maxWidth) {
        currentLine = nextLine
        return
      }

      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = character
    })

    if (currentLine) {
      lines.push(currentLine)
    }
  })

  return lines.length ? lines : ['无']
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle: string,
): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
  context.fillStyle = fillStyle
  context.fill()
  context.strokeStyle = strokeStyle
  context.lineWidth = 2
  context.stroke()
}

function drawTagRow(context: CanvasRenderingContext2D, tags: string[], x: number, startY: number): number {
  let currentX = x
  let currentY = startY

  context.font = "500 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"

  tags.forEach((tag) => {
    const tagWidth = context.measureText(tag).width + 36
    if (currentX + tagWidth > pdfPageWidth - pdfMarginX) {
      currentX = x
      currentY += 46
    }

    drawRoundedRect(context, currentX, currentY, tagWidth, 34, 17, '#f8fafc', '#dbeafe')
    context.fillStyle = '#334155'
    context.fillText(tag, currentX + 18, currentY + 6)
    currentX += tagWidth + 12
  })

  return currentY + 52
}

function drawFieldGrid(
  context: CanvasRenderingContext2D,
  x: number,
  startY: number,
  width: number,
  fields: Array<{ label: string; value: string }>,
): number {
  const columnWidth = (width - pdfFieldGap) / 2
  let currentY = startY

  fields.forEach((field, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const fieldX = x + column * (columnWidth + pdfFieldGap)
    const fieldY = startY + row * pdfFieldRowHeight

    drawRoundedRect(context, fieldX, fieldY, columnWidth, 72, 18, '#fafafa', '#ebeef5')
    context.fillStyle = '#64748b'
    context.font = "500 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText(field.label, fieldX + 18, fieldY + 14)

    context.fillStyle = '#0f172a'
    context.font = "400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    const valueLines = wrapText(context, field.value, columnWidth - 36).slice(0, 2)
    valueLines.forEach((line, lineIndex) => {
      context.fillText(line, fieldX + 18, fieldY + 38 + lineIndex * 28)
    })

    currentY = fieldY + pdfFieldRowHeight
  })

  return currentY
}

function drawTextSection(
  context: CanvasRenderingContext2D,
  x: number,
  startY: number,
  width: number,
  title: string,
  value: string,
): number {
  drawRoundedRect(context, x, startY, width, 150, 22, '#ffffff', '#ebeef5')
  context.fillStyle = '#0f172a'
  context.font = "600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif"
  context.fillText(title, x + 20, startY + 18)

  context.fillStyle = '#334155'
  context.font = "400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif"
  const lines = wrapText(context, value, width - 40)
  lines.slice(0, 4).forEach((line, index) => {
    context.fillText(line, x + 20, startY + 62 + index * 30)
  })

  return startY + 170
}

async function drawImagesSection(
  context: CanvasRenderingContext2D,
  x: number,
  startY: number,
  width: number,
  images: BillExportImage[],
): Promise<number> {
  const columns = 3
  const totalRows = Math.max(Math.ceil(images.length / columns), 1)
  const cardHeight = totalRows * (pdfImageSize + 64 + pdfImageGap) + 86
  drawRoundedRect(context, x, startY, width, cardHeight, 22, '#ffffff', '#ebeef5')

  context.fillStyle = '#0f172a'
  context.font = "600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif"
  context.fillText('票据图片', x + 20, startY + 18)

  if (!images.length) {
    context.fillStyle = '#64748b'
    context.font = "400 24px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText('当前账单未附带票据图片。', x + 20, startY + 64)
    return startY + cardHeight + 18
  }

  const availableWidth = width - 40
  const imageWidth = Math.min(pdfImageSize, Math.floor((availableWidth - pdfImageGap * (columns - 1)) / columns))
  const imageHeight = imageWidth

  for (const [index, image] of images.entries()) {
    const column = index % columns
    const row = Math.floor(index / columns)
    const imageX = x + 20 + column * (imageWidth + pdfImageGap)
    const imageY = startY + 64 + row * (imageHeight + 64 + pdfImageGap)

    drawRoundedRect(context, imageX, imageY, imageWidth, imageHeight, 18, '#f8fafc', '#e2e8f0')

    if (image.src) {
      try {
        const imageElement = await loadImageElement(image.src)
        context.save()
        context.beginPath()
        context.moveTo(imageX + 18, imageY)
        context.lineTo(imageX + imageWidth - 18, imageY)
        context.quadraticCurveTo(imageX + imageWidth, imageY, imageX + imageWidth, imageY + 18)
        context.lineTo(imageX + imageWidth, imageY + imageHeight - 18)
        context.quadraticCurveTo(imageX + imageWidth, imageY + imageHeight, imageX + imageWidth - 18, imageY + imageHeight)
        context.lineTo(imageX + 18, imageY + imageHeight)
        context.quadraticCurveTo(imageX, imageY + imageHeight, imageX, imageY + imageHeight - 18)
        context.lineTo(imageX, imageY + 18)
        context.quadraticCurveTo(imageX, imageY, imageX + 18, imageY)
        context.closePath()
        context.clip()
        context.drawImage(imageElement, imageX, imageY, imageWidth, imageHeight)
        context.restore()
      } catch {
        context.fillStyle = '#64748b'
        context.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"
        context.fillText('图片加载失败', imageX + 18, imageY + 18)
      }
    } else {
      context.fillStyle = '#64748b'
      context.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"
      context.fillText('无可用图片', imageX + 18, imageY + 18)
    }

    context.fillStyle = '#334155'
    context.font = "500 20px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText(truncateText(image.name, 10), imageX, imageY + imageHeight + 10)
    context.fillStyle = '#64748b'
    context.font = "400 18px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText(truncateText(formatImageSize(image.size), 10), imageX, imageY + imageHeight + 36)
  }

  return startY + cardHeight + 18
}

function drawImageMetadataSection(
  context: CanvasRenderingContext2D,
  x: number,
  startY: number,
  width: number,
  images: BillExportImage[],
): number {
  const lines = images.length
    ? images.map(
        (image, index) =>
          `图片 ${index + 1}：编号 ${image.id}；名称 ${image.name}；类型 ${image.mimeType}；大小 ${formatImageSize(image.size)}；添加时间 ${formatDateTime(image.createdAt)}`,
      )
    : ['当前账单未附带票据图片。']

  const boxHeight = Math.max(92, 60 + lines.length * 28)
  drawRoundedRect(context, x, startY, width, boxHeight, 22, '#ffffff', '#ebeef5')

  context.fillStyle = '#0f172a'
  context.font = "600 28px 'PingFang SC', 'Microsoft YaHei', sans-serif"
  context.fillText('图片字段信息', x + 20, startY + 18)

  context.fillStyle = '#334155'
  context.font = "400 20px 'PingFang SC', 'Microsoft YaHei', sans-serif"
  lines.forEach((line, index) => {
    const wrappedLines = wrapText(context, line, width - 40)
    const offsetY = startY + 60 + index * 28
    context.fillText(wrappedLines[0] ?? line, x + 20, offsetY)
  })

  return startY + boxHeight + 18
}

function buildBillsTableRows(options: StatsReportOptions): string[][] {
  return options.trend.map((point) => [point.label, formatCurrency(point.income), formatCurrency(point.expense)])
}

function buildStatsCategoryRows(options: StatsReportOptions): string[][] {
  return options.categorySummary.map((item) => [item.name, formatCurrency(item.amount), String(item.count)])
}

function drawTable(
  context: CanvasRenderingContext2D,
  startY: number,
  columns: Array<{ title: string; width: number }>,
  rows: string[][],
): void {
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0)
  let currentY = startY
  let currentX = pdfMarginX

  context.fillStyle = '#f8fafc'
  context.fillRect(pdfMarginX, currentY, tableWidth, 58)
  context.fillStyle = '#475569'
  context.font = "600 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"

  columns.forEach((column) => {
    context.fillText(column.title, currentX + 12, currentY + 16)
    currentX += column.width
  })

  currentY += 58
  context.font = "400 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"

  rows.forEach((row, rowIndex) => {
    context.fillStyle = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc'
    context.fillRect(pdfMarginX, currentY, tableWidth, 58)
    context.fillStyle = '#0f172a'

    let cellX = pdfMarginX
    row.forEach((value, valueIndex) => {
      const columnWidth = columns[valueIndex]?.width ?? 160
      context.fillText(truncateText(value, valueIndex === 0 ? 22 : 14), cellX + 12, currentY + 16)
      cellX += columnWidth
    })

    currentY += 58
  })

  context.strokeStyle = '#e2e8f0'
  context.lineWidth = 1
  for (let rowIndex = 0; rowIndex <= rows.length + 1; rowIndex += 1) {
    const lineY = startY + rowIndex * 58
    context.beginPath()
    context.moveTo(pdfMarginX, lineY)
    context.lineTo(pdfMarginX + tableWidth, lineY)
    context.stroke()
  }
}

function paginateRows<T>(rows: T[], pageSize: number): T[][] {
  if (!rows.length) {
    return [[]]
  }

  const pages: T[][] = []
  for (let index = 0; index < rows.length; index += pageSize) {
    pages.push(rows.slice(index, index + pageSize))
  }
  return pages
}

async function buildBillsReportPdfBase64(options: BillsReportOptions): Promise<string> {
  const { cards, filterCategoryName } = await buildBillsReportContext(options)
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })

  for (const [index, card] of cards.entries()) {
    if (index > 0) {
      pdf.addPage()
    }

    const canvas = createCanvasPage()
    const context = canvas.getContext('2d')!
    let currentY = drawPageHeader(context, options.title, [
      `导出时间：${formatDateTime(new Date().toISOString())}`,
      `筛选条件：${getFilterSummaryText(options.filters, filterCategoryName)}`,
      `当前账单：第 ${index + 1} 笔，共 ${cards.length} 笔`,
    ])

    const contentWidth = pdfPageWidth - pdfMarginX * 2
    const amountText = formatCurrency(card.bill.amount)

    drawRoundedRect(context, pdfMarginX, currentY, contentWidth, pdfPageHeight - currentY - 80, 28, '#ffffff', '#dbe4f0')
    currentY += 24

    context.fillStyle = '#64748b'
    context.font = "500 22px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText(`账单标题`, pdfMarginX + 24, currentY)
    context.fillStyle = '#0f172a'
    context.font = "600 40px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText(card.title, pdfMarginX + 24, currentY + 32)
    context.fillStyle = '#2563eb'
    context.font = "700 42px 'PingFang SC', 'Microsoft YaHei', sans-serif"
    context.fillText(amountText, pdfPageWidth - pdfMarginX - 24 - context.measureText(amountText).width, currentY + 28)
    currentY += 98

    currentY = drawTagRow(context, [
      `分类：${card.categoryName}`,
      `来源：${card.sourceLabel}`,
      `状态：${card.statusLabel}`,
      `图片：${card.images.length} 张`,
    ], pdfMarginX + 24, currentY)

    currentY = drawFieldGrid(
      context,
      pdfMarginX + 24,
      currentY,
      contentWidth - 48,
      [
        { label: '账单 ID', value: card.bill.id },
        { label: '账单编号', value: card.bill.billNo || '未填写' },
        { label: '账单日期', value: formatDate(card.bill.billDate, 'YYYY年MM月DD日') },
        { label: '来源', value: card.sourceLabel },
        { label: '状态', value: card.statusLabel },
        { label: '分类名称', value: card.categoryName },
        { label: '分类标识', value: card.bill.categoryId || '无' },
        { label: '创建时间', value: formatDateTime(card.bill.createdAt) },
        { label: '更新时间', value: formatDateTime(card.bill.updatedAt) },
        { label: '图片数量', value: `${card.images.length} 张` },
      ],
    )

    currentY = drawTextSection(context, pdfMarginX + 24, currentY + 8, contentWidth - 48, '补充描述', card.bill.description || '无')
    currentY = drawTextSection(context, pdfMarginX + 24, currentY, contentWidth - 48, '原始通知', card.bill.rawText || '无')
    currentY = await drawImagesSection(context, pdfMarginX + 24, currentY, contentWidth - 48, card.images)
    drawImageMetadataSection(context, pdfMarginX + 24, currentY, contentWidth - 48, card.images)

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfPageRenderWidth, pdfPageRenderHeight)
  }

  if (!cards.length) {
    const canvas = createCanvasPage()
    const context = canvas.getContext('2d')!
    drawPageHeader(context, options.title, ['当前筛选条件下没有可导出的账单。'])
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfPageRenderWidth, pdfPageRenderHeight)
  }

  return arrayBufferToBase64(pdf.output('arraybuffer'))
}

async function buildStatsReportPdfBase64(options: StatsReportOptions): Promise<string> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const trendPages = paginateRows(buildBillsTableRows(options), 18)
  const categoryPages = paginateRows(buildStatsCategoryRows(options), 18)

  const renderPage = (
    title: string,
    subtitleLines: string[],
    sections: Array<{ heading: string; columns: Array<{ title: string; width: number }>; rows: string[][] }>,
    pageIndex: number,
  ) => {
    const canvas = createCanvasPage()
    const context = canvas.getContext('2d')!
    let currentY = drawPageHeader(context, title, subtitleLines)

    sections.forEach((section) => {
      context.fillStyle = '#0f172a'
      context.font = "600 30px 'PingFang SC', 'Microsoft YaHei', sans-serif"
      context.fillText(section.heading, pdfMarginX, currentY)
      currentY += 50
      drawTable(context, currentY, section.columns, section.rows.length ? section.rows : [['暂无数据', '-', '-']])
      currentY += (section.rows.length + 1) * 58 + 42
    })

    if (pageIndex > 0) {
      pdf.addPage()
    }

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfPageRenderWidth, pdfPageRenderHeight)
  }

  renderPage(
    options.title,
    [
      `统计范围：${options.summaryLabel}`,
      `导出时间：${formatDateTime(new Date().toISOString())}`,
      `收入 ${formatCurrency(options.summary.income)} ｜ 支出 ${formatCurrency(options.summary.expense)} ｜ 净值 ${formatCurrency(options.summary.net)}`,
    ],
    [
      {
        heading: options.trendTitle,
        columns: [
          { title: '时间', width: 280 },
          { title: '收入', width: 410 },
          { title: '支出', width: 410 },
        ],
        rows: trendPages[0] ?? [],
      },
    ],
    0,
  )

  trendPages.slice(1).forEach((rows, index) => {
    renderPage(
      options.title,
      [`统计范围：${options.summaryLabel}`, `趋势续表 ${index + 2}`],
      [
        {
          heading: `${options.trendTitle}（续）`,
          columns: [
            { title: '时间', width: 280 },
            { title: '收入', width: 410 },
            { title: '支出', width: 410 },
          ],
          rows,
        },
      ],
      index + 1,
    )
  })

  const categoryStartPageIndex = Math.max(trendPages.length, 1)
  categoryPages.forEach((rows, index) => {
    renderPage(
      options.title,
      [`统计范围：${options.summaryLabel}`, `分类概览 ${index + 1}`],
      [
        {
          heading: '分类占比',
          columns: [
            { title: '分类', width: 380 },
            { title: '金额', width: 420 },
            { title: '笔数', width: 300 },
          ],
          rows,
        },
      ],
      categoryStartPageIndex + index,
    )
  })

  return arrayBufferToBase64(pdf.output('arraybuffer'))
}

function buildBillFieldEntries(card: BillExportCard): Array<{ label: string; value: string }> {
  return [
    { label: '账单 ID', value: card.bill.id },
    { label: '来源', value: card.sourceLabel },
    { label: '状态', value: card.statusLabel },
    { label: '分类名称', value: card.categoryName },
    { label: '分类标识', value: card.bill.categoryId || '无' },
    { label: '金额', value: formatCurrency(card.bill.amount) },
    { label: '账单编号', value: card.bill.billNo || '未填写' },
    { label: '账单日期', value: formatDate(card.bill.billDate, 'YYYY年MM月DD日') },
    { label: '创建时间', value: formatDateTime(card.bill.createdAt) },
    { label: '更新时间', value: formatDateTime(card.bill.updatedAt) },
    { label: '图片数量', value: `${card.images.length} 张` },
  ]
}

function buildBillCardHtml(card: BillExportCard, index: number): string {
  const fields = buildBillFieldEntries(card)
    .map(
      (field) => `
        <div class="bill-share-card__field">
          <span>${escapeHtml(field.label)}</span>
          <strong>${escapeHtml(field.value)}</strong>
        </div>`,
    )
    .join('')

  const images = card.images.length
    ? `
      <div class="bill-share-card__block">
        <h3>票据图片</h3>
        <div class="bill-share-card__image-grid">
          ${card.images
            .map(
              (image, imageIndex) => `
                <article class="bill-share-card__image-card">
                  ${image.src ? `<img class="bill-share-card__image" src="${escapeHtml(image.src)}" alt="票据图片 ${imageIndex + 1}" />` : '<div class="bill-share-card__image bill-share-card__image--empty">图片暂时无法展示</div>'}
                  <div class="bill-share-card__image-meta">
                    <p><strong>图片编号：</strong>${escapeHtml(image.id)}</p>
                    <p><strong>图片名称：</strong>${escapeHtml(image.name)}</p>
                    <p><strong>图片类型：</strong>${escapeHtml(image.mimeType)}</p>
                    <p><strong>图片大小：</strong>${escapeHtml(formatImageSize(image.size))}</p>
                    <p><strong>添加时间：</strong>${escapeHtml(formatDateTime(image.createdAt))}</p>
                  </div>
                </article>`,
            )
            .join('')}
        </div>
      </div>`
    : `
      <div class="bill-share-card__block">
        <h3>票据图片</h3>
        <p class="muted">当前账单未附带票据图片。</p>
      </div>`

  return `
    <section class="bill-share-card">
      <div class="bill-share-card__head">
        <div>
          <span class="eyebrow">账单 ${index + 1}</span>
          <h2>${escapeHtml(card.title)}</h2>
        </div>
        <strong class="bill-share-card__amount">${escapeHtml(formatCurrency(card.bill.amount))}</strong>
      </div>
      <div class="bill-share-card__tags">
        <span>分类：${escapeHtml(card.categoryName)}</span>
        <span>来源：${escapeHtml(card.sourceLabel)}</span>
        <span>状态：${escapeHtml(card.statusLabel)}</span>
        <span>图片：${card.images.length} 张</span>
      </div>
      <div class="bill-share-card__field-grid">${fields}</div>
      <div class="bill-share-card__block">
        <h3>补充描述</h3>
        <p>${formatMultilineHtml(card.bill.description)}</p>
      </div>
      <div class="bill-share-card__block">
        <h3>原始通知</h3>
        <p>${formatMultilineHtml(card.bill.rawText)}</p>
      </div>
      ${images}
    </section>`
}

export async function buildBillsReportHtml(options: BillsReportOptions): Promise<string> {
  const { cards, filterCategoryName } = await buildBillsReportContext(options)
  const body = `
    <section class="meta">
      <h1>${escapeHtml(options.title)}</h1>
      <p>导出时间：${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
      <p>${escapeHtml(getFilterSummaryText(options.filters, filterCategoryName))}</p>
    </section>
    <section>
      <div class="stats">
        <div class="tile"><span>账单总数</span><strong>${cards.length} 笔</strong></div>
        <div class="tile"><span>带图账单</span><strong>${countBillsWithImages(cards)} 笔</strong></div>
        <div class="tile"><span>图片总数</span><strong>${countBillImages(cards)} 张</strong></div>
      </div>
    </section>
    ${cards.length ? cards.map((card, index) => buildBillCardHtml(card, index)).join('') : '<section><p class="muted">当前筛选条件下没有可导出的账单。</p></section>'}
  `

  return buildDocument(
    options.title,
    body,
    `
      .bill-share-card { display: grid; gap: 16px; }
      .bill-share-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .bill-share-card__amount { color: #2563eb; font-size: 26px; white-space: nowrap; }
      .bill-share-card__tags { display: flex; flex-wrap: wrap; gap: 10px; }
      .bill-share-card__tags span { padding: 6px 12px; border-radius: 999px; border: 1px solid #dbeafe; background: #eff6ff; color: #334155; font-size: 13px; }
      .bill-share-card__field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .bill-share-card__field { padding: 14px; border-radius: 14px; border: 1px solid #ebeef5; background: #fafafa; }
      .bill-share-card__field span { display: block; margin-bottom: 8px; color: #909399; font-size: 13px; }
      .bill-share-card__field strong { font-size: 16px; word-break: break-word; }
      .bill-share-card__block { display: grid; gap: 10px; }
      .bill-share-card__block p { line-height: 1.7; white-space: normal; }
      .bill-share-card__image-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .bill-share-card__image-card { padding: 12px; border-radius: 16px; border: 1px solid #ebeef5; background: #fafafa; display: grid; gap: 10px; }
      .bill-share-card__image { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; border-radius: 12px; border: 1px solid #dcdfe6; background: #fff; }
      .bill-share-card__image--empty { display: grid; place-items: center; color: #909399; }
      .bill-share-card__image-meta { display: grid; gap: 4px; }
      .bill-share-card__image-meta p { font-size: 13px; color: #606266; }
      .bill-share-card__image-meta strong { color: #303133; }
    `,
  )
}

export async function buildBillsReportMarkdown(options: BillsReportOptions): Promise<string> {
  const { cards, filterCategoryName } = await buildBillsReportContext(options)
  const lines = [
    `# ${options.title}`,
    '',
    `- 导出时间：${formatDateTime(new Date().toISOString())}`,
    `- ${getFilterSummaryText(options.filters, filterCategoryName)}`,
    `- 账单总数：${cards.length} 笔`,
    `- 带图账单：${countBillsWithImages(cards)} 笔`,
    `- 图片总数：${countBillImages(cards)} 张`,
    '',
  ]

  if (!cards.length) {
    lines.push('当前筛选条件下没有可导出的账单。')
    return lines.join('\n')
  }

  cards.forEach((card, index) => {
    lines.push(`## 账单 ${index + 1}：${card.title}`)
    lines.push('')
    buildBillFieldEntries(card).forEach((field) => {
      lines.push(`- ${field.label}：${field.value}`)
    })
    lines.push(`- 金额：${formatCurrency(card.bill.amount)}`)
    lines.push(`- 补充描述：${normalizeText(card.bill.description) || '无'}`)
    lines.push(`- 原始通知：${normalizeText(card.bill.rawText) || '无'}`)
    lines.push('')
    lines.push('### 票据图片')
    lines.push('')

    if (!card.images.length) {
      lines.push('当前账单未附带票据图片。')
      lines.push('')
      return
    }

    card.images.forEach((image, imageIndex) => {
      if (image.src) {
        lines.push(`<img src="${image.src}" alt="票据图片 ${imageIndex + 1}" width="220" />`)
      }
      lines.push(`- 图片 ${imageIndex + 1} 编号：${image.id}`)
      lines.push(`- 图片 ${imageIndex + 1} 名称：${image.name}`)
      lines.push(`- 图片 ${imageIndex + 1} 类型：${image.mimeType}`)
      lines.push(`- 图片 ${imageIndex + 1} 大小：${formatImageSize(image.size)}`)
      lines.push(`- 图片 ${imageIndex + 1} 添加时间：${formatDateTime(image.createdAt)}`)
      lines.push('')
    })
  })

  return lines.join('\n')
}

async function buildBillsExcelHtml(options: BillsReportOptions): Promise<string> {
  const { cards, filterCategoryName } = await buildBillsReportContext(options)
  const rows = cards
    .map((card) => {
      const fieldMap = new Map(buildBillFieldEntries(card).map((field) => [field.label, field.value]))

      return `
        <tr>
          <td>${escapeHtml(card.title)}</td>
          <td>${escapeHtml(fieldMap.get('账单 ID') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('来源') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('状态') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('分类名称') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('分类标识') ?? '')}</td>
          <td>${escapeHtml(formatCurrency(card.bill.amount))}</td>
          <td>${escapeHtml(fieldMap.get('账单编号') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('账单日期') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('创建时间') ?? '')}</td>
          <td>${escapeHtml(fieldMap.get('更新时间') ?? '')}</td>
          <td>${escapeHtml(normalizeText(card.bill.description) || '无')}</td>
          <td>${escapeHtml(normalizeText(card.bill.rawText) || '无')}</td>
          <td>${escapeHtml(fieldMap.get('图片数量') ?? '')}</td>
          <td>
            ${
              card.images.length
                ? `<div class="image-stack">${card.images
                    .map(
                      (image, index) => `
                        <div class="image-card">
                          ${image.src ? `<img src="${escapeHtml(image.src)}" alt="票据图片 ${index + 1}" />` : '<div>图片暂时无法展示</div>'}
                          <div class="image-meta">
                            <div>图片编号：${escapeHtml(image.id)}</div>
                            <div>图片名称：${escapeHtml(image.name)}</div>
                            <div>图片类型：${escapeHtml(image.mimeType)}</div>
                            <div>图片大小：${escapeHtml(formatImageSize(image.size))}</div>
                            <div>添加时间：${escapeHtml(formatDateTime(image.createdAt))}</div>
                          </div>
                        </div>`,
                    )
                    .join('')}</div>`
                : '当前账单未附带票据图片。'
            }
          </td>
        </tr>`
    })
    .join('')

  return buildExcelDocument(
    options.title,
    `
      <div class="meta">
        <h1>${escapeHtml(options.title)}</h1>
        <p>导出时间：${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
        <p>${escapeHtml(getFilterSummaryText(options.filters, filterCategoryName))}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>账单标题</th>
            <th>账单 ID</th>
            <th>来源</th>
            <th>状态</th>
            <th>分类名称</th>
            <th>分类标识</th>
            <th>金额</th>
            <th>账单编号</th>
            <th>账单日期</th>
            <th>创建时间</th>
            <th>更新时间</th>
            <th>补充描述</th>
            <th>原始通知</th>
            <th>图片数量</th>
            <th>图片内容</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="15">当前筛选条件下没有可导出的账单。</td></tr>'}</tbody>
      </table>
    `,
  )
}

export function buildStatsReportHtml(options: StatsReportOptions): string {
  const trendRows = options.trend
    .map(
      (point) => `
        <tr>
          <td>${escapeHtml(point.label)}</td>
          <td>${escapeHtml(formatCurrency(point.income))}</td>
          <td>${escapeHtml(formatCurrency(point.expense))}</td>
        </tr>`,
    )
    .join('')
  const categoryRows = options.categorySummary
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(formatCurrency(item.amount))}</td>
          <td>${item.count}</td>
        </tr>`,
    )
    .join('')

  return buildDocument(
    options.title,
    `
      <section class="meta">
        <h1>${escapeHtml(options.title)}</h1>
        <p>统计范围：${escapeHtml(options.summaryLabel)}</p>
        <p>导出时间：${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
      </section>
      <section>
        <h2>账单概览</h2>
        <div class="stats">
          <div class="tile"><span>收入</span><strong>${escapeHtml(formatCurrency(options.summary.income))}</strong></div>
          <div class="tile"><span>支出</span><strong>${escapeHtml(formatCurrency(options.summary.expense))}</strong></div>
          <div class="tile"><span>净值</span><strong>${escapeHtml(formatCurrency(options.summary.net))}</strong></div>
        </div>
      </section>
      <section>
        <h2>${escapeHtml(options.trendTitle)}</h2>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>收入</th>
              <th>支出</th>
            </tr>
          </thead>
          <tbody>${trendRows || '<tr><td colspan="3" class="muted">暂无趋势数据</td></tr>'}</tbody>
        </table>
      </section>
      <section>
        <h2>分类占比</h2>
        <table>
          <thead>
            <tr>
              <th>分类</th>
              <th>金额</th>
              <th>笔数</th>
            </tr>
          </thead>
          <tbody>${categoryRows || '<tr><td colspan="3" class="muted">当前视图没有分类占比数据</td></tr>'}</tbody>
        </table>
      </section>
    `,
  )
}

export function buildStatsReportMarkdown(options: StatsReportOptions): string {
  const lines = [
    `# ${options.title}`,
    '',
    `- 统计范围：${options.summaryLabel}`,
    `- 导出时间：${formatDateTime(new Date().toISOString())}`,
    `- 收入：${formatCurrency(options.summary.income)}`,
    `- 支出：${formatCurrency(options.summary.expense)}`,
    `- 净值：${formatCurrency(options.summary.net)}`,
    '',
    `## ${options.trendTitle}`,
    '',
    '| 时间 | 收入 | 支出 |',
    '| --- | --- | --- |',
  ]

  options.trend.forEach((point) => {
    lines.push(`| ${point.label} | ${formatCurrency(point.income)} | ${formatCurrency(point.expense)} |`)
  })

  lines.push('', '## 分类占比', '', '| 分类 | 金额 | 笔数 |', '| --- | --- | --- |')
  options.categorySummary.forEach((item) => {
    lines.push(`| ${item.name} | ${formatCurrency(item.amount)} | ${item.count} |`)
  })

  return lines.join('\n')
}

function buildStatsWorkbook(options: StatsReportOptions): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.json_to_sheet([
    { 指标: '收入', 金额: options.summary.income },
    { 指标: '支出', 金额: options.summary.expense },
    { 指标: '净值', 金额: options.summary.net },
    { 指标: '笔数', 金额: options.summary.count },
  ])
  const trendSheet = XLSX.utils.json_to_sheet(
    options.trend.map((point) => ({ 时间: point.label, 收入: point.income, 支出: point.expense })),
  )
  const categorySheet = XLSX.utils.json_to_sheet(
    options.categorySummary.map((item) => ({ 分类: item.name, 金额: item.amount, 笔数: item.count })),
  )

  XLSX.utils.book_append_sheet(workbook, summarySheet, '概览')
  XLSX.utils.book_append_sheet(workbook, trendSheet, '趋势')
  XLSX.utils.book_append_sheet(workbook, categorySheet, '分类')
  return workbook
}

export function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  downloadBlob(fileName, new Blob([content], { type: mimeType }))
}

export function downloadPreparedShareFile(file: PreparedShareFile): void {
  const blob = file.base64Content
    ? base64ToBlob(file.base64Content, file.mimeType)
    : new Blob([file.textContent ?? ''], { type: file.mimeType })

  downloadBlob(file.fileName, blob)
}

export function getShareResultMessage(sharedVia: ShareResultChannel, targetLabel = '目标应用'): string {
  switch (sharedVia) {
    case 'package':
      return `已打开${targetLabel}分享`
    case 'chooser':
      return `已打开系统分享，请继续选择${targetLabel}`
    default:
      return '当前设备已导出分享文件'
  }
}

export async function prepareBillsShareFile(
  format: ShareFormat,
  baseFileName: string,
  options: BillsReportOptions,
): Promise<PreparedShareFile> {
  switch (format) {
    case 'pdf':
      return {
        fileName: `${baseFileName}.pdf`,
        mimeType: 'application/pdf',
        base64Content: await buildBillsReportPdfBase64(options),
      }
    case 'excel':
      return {
        fileName: `${baseFileName}.xls`,
        mimeType: legacyExcelMimeType,
        textContent: await buildBillsExcelHtml(options),
      }
    case 'markdown':
      return {
        fileName: `${baseFileName}.md`,
        mimeType: 'text/markdown',
        textContent: await buildBillsReportMarkdown(options),
      }
    case 'html':
      return {
        fileName: `${baseFileName}.html`,
        mimeType: 'text/html',
        textContent: await buildBillsReportHtml(options),
      }
  }
}

export async function prepareStatsShareFile(
  format: ShareFormat,
  baseFileName: string,
  options: StatsReportOptions,
): Promise<PreparedShareFile> {
  switch (format) {
    case 'pdf':
      return {
        fileName: `${baseFileName}.pdf`,
        mimeType: 'application/pdf',
        base64Content: await buildStatsReportPdfBase64(options),
      }
    case 'excel':
      return {
        fileName: `${baseFileName}.xlsx`,
        mimeType: xlsxMimeType,
        base64Content: XLSX.write(buildStatsWorkbook(options), { type: 'base64', bookType: 'xlsx' }),
      }
    case 'markdown':
      return {
        fileName: `${baseFileName}.md`,
        mimeType: 'text/markdown',
        textContent: buildStatsReportMarkdown(options),
      }
    case 'html':
      return {
        fileName: `${baseFileName}.html`,
        mimeType: 'text/html',
        textContent: buildStatsReportHtml(options),
      }
  }
}
