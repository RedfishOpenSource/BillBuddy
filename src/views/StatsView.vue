<script setup lang="ts">
import { Share } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { computed, defineAsyncComponent, ref } from 'vue'
import MonthlySummaryCard from '../components/stats/MonthlySummaryCard.vue'
import {
  buildCategorySummary,
  buildMonthlyTrend,
  buildYearlyTrend,
  getMonthBills,
  getYearBills,
  summarizeBills,
} from '../services/analytics/billSummaryService'
import { downloadPreparedShareFile, prepareStatsShareFile } from '../services/analytics/shareReportService'
import { shareFile } from '../services/native/shareBridge'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { formatMonthLabel } from '../utils/format'

const YearlyTrendChart = defineAsyncComponent(() => import('../components/stats/YearlyTrendChart.vue'))
const CategorySummaryChart = defineAsyncComponent(() => import('../components/stats/CategorySummaryChart.vue'))

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const allMonthsValue = 0
const currentYear = dayjs().year()
const sharing = ref(false)

const availableYears = computed(() => Array.from({ length: 21 }, (_, index) => currentYear - 10 + index))
const selectedYear = ref(currentYear)
const selectedMonth = ref<number | null>(dayjs().month() + 1)
const effectiveMonth = computed(() => selectedMonth.value ?? allMonthsValue)
const isYearView = computed(() => effectiveMonth.value === allMonthsValue)

const scopedBills = computed(() => {
  if (isYearView.value) {
    return getYearBills(billStore.bills, selectedYear.value)
  }

  return getMonthBills(billStore.bills, selectedYear.value, effectiveMonth.value)
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

  return buildMonthlyTrend(billStore.bills, categoryStore.sortedCategories, selectedYear.value, effectiveMonth.value)
})

const summaryLabel = computed(() => {
  if (isYearView.value) {
    return `${selectedYear.value}年`
  }

  return formatMonthLabel(selectedYear.value, effectiveMonth.value)
})

const trendEyebrow = computed(() => (isYearView.value ? '年度视图' : '月度视图'))
const trendTitle = computed(() => (isYearView.value ? '月度趋势' : '每日趋势'))

async function handleShare(): Promise<void> {
  if (!trend.value.length) {
    ElMessage.warning('当前没有可分享的统计结果')
    return
  }

  sharing.value = true

  try {
    const monthLabel = effectiveMonth.value === allMonthsValue ? '全年' : effectiveMonth.value
    const file = await prepareStatsShareFile('pdf', `统计汇总-${selectedYear.value}-${monthLabel}`, {
      title: '统计汇总',
      summaryLabel: summaryLabel.value,
      summary: summary.value,
      trendTitle: trendTitle.value,
      trend: trend.value,
      categorySummary: categorySummary.value,
    })

    const shared = await shareFile({
      ...file,
      title: '分享统计',
      preferChooser: true,
    })

    if (shared) {
      ElMessage.success('已打开系统分享')
    } else {
      downloadPreparedShareFile(file)
      ElMessage.success('统计文件已导出')
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '分享失败，请稍后重试')
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <section class="screen">
    <div class="stats-toolbar">
      <el-select v-model="selectedYear" class="stats-toolbar__control" placeholder="年份">
        <el-option v-for="year in availableYears" :key="year" :label="`${year}年`" :value="year" />
      </el-select>
      <el-select v-model="selectedMonth" class="stats-toolbar__control" placeholder="月份" clearable>
        <el-option label="全年" :value="allMonthsValue" />
        <el-option v-for="month in 12" :key="month" :label="`${month}月`" :value="month" />
      </el-select>
      <el-button
        class="toolbar-icon-button stats-toolbar__more"
        text
        :loading="sharing"
        aria-label="分享统计"
        @click="handleShare"
      >
        <el-icon><Share /></el-icon>
      </el-button>
    </div>

    <MonthlySummaryCard :label="summaryLabel" :summary="summary" />
    <YearlyTrendChart :points="trend" :eyebrow="trendEyebrow" :title="trendTitle" />
    <CategorySummaryChart v-if="!isYearView" :items="categorySummary" />
  </section>
</template>
