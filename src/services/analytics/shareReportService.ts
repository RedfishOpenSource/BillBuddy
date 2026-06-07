import jsPDF from 'jspdf'
import type { Bill, BillFilters } from '../../types/bill'
import type { Category } from '../../types/category'
import type { SummaryMetrics } from './billSummaryService'

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
  trend: Array<unknown>
  categorySummary: Array<unknown>
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

export function downloadTextFile(fileName: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType })
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

export function downloadPreparedShareFile(file: PreparedShareFile): void {
  if (file.textContent) {
    downloadTextFile(file.fileName, file.textContent, file.mimeType)
    return
  }

  if (file.base64Content) {
    const binary = window.atob(file.base64Content)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    const blob = new Blob([bytes], { type: file.mimeType })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.fileName
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  }
}

export function getShareResultMessage(channel?: ShareResultChannel, fallback = '分享方式'): string {
  if (channel === 'package') return `已通过系统${fallback}发起分享`
  if (channel === 'chooser') return `已打开系统${fallback}选择器`
  return '已导出分享文件'
}

function buildBillsPdfText(options: BillsReportOptions): string[] {
  const filters = options.filters
  return [
    options.title,
    '',
    `账单总数：${options.bills.length} 笔`,
    `关键字：${filters.keyword || '全部'}`,
    `交易类型：${filters.transactionKind || '全部'}`,
    `开始日期：${filters.startDate || '不限'}`,
    `结束日期：${filters.endDate || '不限'}`,
    '',
    ...options.bills.flatMap((bill, index) => [
      `${index + 1}. ${bill.description || '未命名账单'}`,
      `   金额：${bill.amount}`,
      `   交易类型：${bill.transactionKind}`,
      `   收支方式：${bill.source}`,
      `   分类：${bill.categoryId}`,
      `   日期：${bill.billDate}`,
      `   编号：${bill.billNo || '无'}`,
      '',
    ]),
  ]
}

function buildStatsPdfText(options: StatsReportOptions): string[] {
  return [
    options.title,
    '',
    `统计范围：${options.summaryLabel}`,
    `收入：${options.summary.income}`,
    `支出：${options.summary.expense}`,
    `负债消费：${options.summary.debtExpense}`,
    `还债：${options.summary.repayment}`,
    `净增减：${options.summary.net}`,
    `总笔数：${options.summary.count}`,
  ]
}

function buildPdfBase64(lines: string[]): string {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = 48

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(14)

  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 500)
    pdf.text(wrapped, 40, y)
    y += wrapped.length * 20 + 6

    if (y > 780) {
      pdf.addPage()
      y = 48
    }
  }

  return arrayBufferToBase64(pdf.output('arraybuffer'))
}

export async function prepareBillsShareFile(
  _format: ShareFormat,
  fileName: string,
  options: BillsReportOptions,
): Promise<PreparedShareFile> {
  const base64Content = buildPdfBase64(buildBillsPdfText(options))

  return {
    fileName: `${fileName}.pdf`,
    mimeType: 'application/pdf',
    base64Content,
  }
}

export async function prepareStatsShareFile(
  _format: ShareFormat,
  fileName: string,
  options: StatsReportOptions,
): Promise<PreparedShareFile> {
  const base64Content = buildPdfBase64(buildStatsPdfText(options))

  return {
    fileName: `${fileName}.pdf`,
    mimeType: 'application/pdf',
    base64Content,
  }
}
