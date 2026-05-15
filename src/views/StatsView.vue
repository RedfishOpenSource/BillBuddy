<script setup lang="ts">
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import ShareFormatDialog from '../components/ShareFormatDialog.vue'
import MonthlySummaryCard from '../components/stats/MonthlySummaryCard.vue'
import {
  buildCategorySummary,
  buildMonthlyTrend,
  buildYearlyTrend,
  getAvailableYears,
  getMonthBills,
  getYearBills,
  summarizeBills,
} from '../services/analytics/billSummaryService'
import {
  downloadPreparedShareFile,
  getShareResultMessage,
  prepareStatsShareFile,
  type ShareFormat,
} from '../services/analytics/shareReportService'
import { shareFile } from '../services/native/shareBridge'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { formatMonthLabel } from '../utils/format'

const YearlyTrendChart = defineAsyncComponent(() => import('../components/stats/YearlyTrendChart.vue'))
const CategorySummaryChart = defineAsyncComponent(() => import('../components/stats/CategorySummaryChart.vue'))

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const allMonthsValue = 0
const filterDrawerVisible = ref(false)
const shareDialogVisible = ref(false)
const sharing = ref(false)

const availableYears = computed(() => getAvailableYears(billStore.bills))
const selectedYear = ref(dayjs().year())
const selectedMonth = ref(dayjs().month() + 1)
const isYearView = computed(() => selectedMonth.value === allMonthsValue)

watch(
  availableYears,
  (years) => {
    if (!years.includes(selectedYear.value)) {
      selectedYear.value = years[0]
    }
  },
  { immediate: true },
)

const scopedBills = computed(() => {
  if (isYearView.value) {
    return getYearBills(billStore.bills, selectedYear.value)
  }

  return getMonthBills(billStore.bills, selectedYear.value, selectedMonth.value)
})

const summary = computed(() => summarizeBills(scopedBills.value, categoryStore.sortedCategories))
const categorySummary = computed(() => {
  if (isYearView.value) {
    return []
  }

  return buildCategorySummary(scopedBills.value, categoryStore.sortedCategories)
})
const trend = computed(() => {
  if (isYearView.value) {
    return buildYearlyTrend(billStore.bills, categoryStore.sortedCategories, selectedYear.value)
  }

  return buildMonthlyTrend(billStore.bills, categoryStore.sortedCategories, selectedYear.value, selectedMonth.value)
})
const summaryLabel = computed(() => {
  if (isYearView.value) {
    return `${selectedYear.value}年`
  }

  return formatMonthLabel(selectedYear.value, selectedMonth.value)
})
const trendEyebrow = computed(() => (isYearView.value ? '年度视图' : '月度视图'))
const trendTitle = computed(() => (isYearView.value ? '月度趋势' : '每日趋势'))
const filterSummary = computed(() => `当前范围 ${summaryLabel.value}，共 ${scopedBills.value.length} 笔账单。`)

async function handleShare(format: ShareFormat): Promise<void> {
  if (!trend.value.length) {
    ElMessage.warning('当前没有可分享的统计结果')
    return
  }

  sharing.value = true

  try {
    const monthLabel = selectedMonth.value || '全年'
    const file = await prepareStatsShareFile(format, `统计汇总-${selectedYear.value}-${monthLabel}`, {
      title: '统计汇总',
      summaryLabel: summaryLabel.value,
      summary: summary.value,
      trendTitle: trendTitle.value,
      trend: trend.value,
      categorySummary: categorySummary.value,
    })
    const shared = await shareFile({
      ...file,
      title: '分享统计结果',
      targetPackage: 'com.tencent.mm',
    })

    if (shared) {
      ElMessage.success(getShareResultMessage(shared.sharedVia))
    } else {
      downloadPreparedShareFile(file)
      ElMessage.success(getShareResultMessage('download'))
    }

    shareDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分享失败，请稍后重试')
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <section class="screen">
    <header class="page-heading">
      <div>
        <span class="eyebrow">统计分析</span>
        <h2>月度 / 年度汇总</h2>
      </div>
      <div class="inline-actions">
        <el-button @click="shareDialogVisible = true">分享至微信</el-button>
      </div>
    </header>

    <div class="filter-summary">
      <div>
        <span class="eyebrow">统计范围</span>
        <p class="filter-summary__text">{{ filterSummary }}</p>
      </div>
      <div class="inline-actions">
        <el-button plain @click="filterDrawerVisible = true">调整时间范围</el-button>
      </div>
    </div>

    <MonthlySummaryCard :label="summaryLabel" :summary="summary" />
    <YearlyTrendChart :points="trend" :eyebrow="trendEyebrow" :title="trendTitle" />
    <CategorySummaryChart v-if="!isYearView" :items="categorySummary" />

    <el-drawer v-model="filterDrawerVisible" title="统计范围" size="92%" append-to-body>
      <div class="toolbar-panel">
        <el-select v-model="selectedYear" placeholder="年份">
          <el-option v-for="year in availableYears" :key="year" :label="`${year}年`" :value="year" />
        </el-select>
        <el-select v-model="selectedMonth" placeholder="月份">
          <el-option label="全年" :value="allMonthsValue" />
          <el-option v-for="month in 12" :key="month" :label="`${month}月`" :value="month" />
        </el-select>
      </div>
    </el-drawer>

    <ShareFormatDialog v-model="shareDialogVisible" title="选择统计分享格式" :submitting="sharing" @submit="handleShare" />
  </section>
</template>
