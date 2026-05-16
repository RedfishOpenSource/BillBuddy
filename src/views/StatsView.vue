<script setup lang="ts">
import { MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
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
import { downloadPreparedShareFile, getShareResultMessage, prepareStatsShareFile } from '../services/analytics/shareReportService'
import { shareFile } from '../services/native/shareBridge'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { formatMonthLabel } from '../utils/format'

const YearlyTrendChart = defineAsyncComponent(() => import('../components/stats/YearlyTrendChart.vue'))
const CategorySummaryChart = defineAsyncComponent(() => import('../components/stats/CategorySummaryChart.vue'))

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const allMonthsValue = 0
const shareActionDrawerVisible = ref(false)
const sharing = ref(false)

const shareTargets = [
  { label: '微信', targetPackage: 'com.tencent.mm' },
  { label: 'QQ', targetPackage: 'com.tencent.mobileqq' },
  { label: '支付宝', targetPackage: 'com.eg.android.AlipayGphone' },
] as const

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

async function handleShare(targetPackage: string): Promise<void> {
  if (!trend.value.length) {
    ElMessage.warning('当前没有可分享的统计结果')
    return
  }

  sharing.value = true
  shareActionDrawerVisible.value = false

  try {
    const monthLabel = selectedMonth.value === allMonthsValue ? '全年' : selectedMonth.value
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
      title: '分享统计结果',
      targetPackage,
    })

    if (shared) {
      ElMessage.success(getShareResultMessage(shared.sharedVia))
    } else {
      downloadPreparedShareFile(file)
      ElMessage.success(getShareResultMessage('download'))
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
      <el-select v-model="selectedMonth" class="stats-toolbar__control" placeholder="月份">
        <el-option label="全年" :value="allMonthsValue" />
        <el-option v-for="month in 12" :key="month" :label="`${month}月`" :value="month" />
      </el-select>
      <el-button class="stats-toolbar__more" circle plain aria-label="更多操作" @click="shareActionDrawerVisible = true">
        <el-icon><MoreFilled /></el-icon>
      </el-button>
    </div>

    <MonthlySummaryCard :label="summaryLabel" :summary="summary" />
    <YearlyTrendChart :points="trend" :eyebrow="trendEyebrow" :title="trendTitle" />
    <CategorySummaryChart v-if="!isYearView" :items="categorySummary" />

    <el-drawer v-model="shareActionDrawerVisible" direction="btt" size="auto" :with-header="false" append-to-body>
      <div class="action-sheet share-target-sheet">
        <div class="share-target-sheet__group">
          <span class="eyebrow">分享至</span>
          <div class="share-target-sheet__row">
            <el-button
              v-for="target in shareTargets"
              :key="target.targetPackage"
              :loading="sharing"
              @click="handleShare(target.targetPackage)"
            >
              {{ target.label }}
            </el-button>
          </div>
        </div>
        <el-button class="share-target-sheet__cancel" @click="shareActionDrawerVisible = false">取消</el-button>
      </div>
    </el-drawer>
  </section>
</template>
