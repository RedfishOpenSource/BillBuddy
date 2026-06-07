<script setup lang="ts">
import { ArrowDown, Operation, Search, Share } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BillCard from '../components/bill/BillCard.vue'
import BillFilterBar from '../components/bill/BillFilterBar.vue'
import {
  createEmptyFilters,
  filterBills,
  sortBills,
} from '../services/analytics/billSummaryService'
import {
  downloadPreparedShareFile,
  getShareResultMessage,
  prepareBillsShareFile,
} from '../services/analytics/shareReportService'
import { shareFile } from '../services/native/shareBridge'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import type { BillFilters, BillSort } from '../types/bill'

const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const appliedFilters = ref(createEmptyFilters())
const draftFilters = ref(createEmptyFilters())
const filterDrawerVisible = ref(false)
const sharing = ref(false)
const visibleBills = computed(() =>
  sortBills(
    filterBills(billStore.bills, appliedFilters.value, categoryStore.sortedCategories),
    appliedFilters.value.sortBy,
  ),
)

const activeFilterCount = computed(() => {
  return [
    appliedFilters.value.keyword,
    appliedFilters.value.transactionKind,
    appliedFilters.value.startDate,
    appliedFilters.value.endDate,
  ].filter(Boolean).length
})

const transactionKindOptions = [
  { label: '全部交易类型', value: '' },
  { label: '支出', value: 'expense' },
  { label: '负债消费', value: 'debt_expense' },
  { label: '收入', value: 'income' },
  { label: '还债', value: 'repayment' },
]

const selectedCategoryLabel = computed(() =>
  transactionKindOptions.find((option) => option.value === appliedFilters.value.transactionKind)?.label || '交易类型',
)

const selectedSortLabel = computed(() => {
  switch (appliedFilters.value.sortBy) {
    case 'date_asc':
      return '日期从早到晚'
    case 'amount_desc':
      return '金额从高到低'
    case 'amount_asc':
      return '金额从低到高'
    default:
      return '日期从新到旧'
  }
})

const selectedDateLabel = computed(() => {
  const { startDate, endDate } = appliedFilters.value

  if (!startDate && !endDate) {
    return '全部时间'
  }

  const today = dayjs()
  const currentDay = today.format('YYYY-MM-DD')
  const lastSevenDays = today.subtract(6, 'day').format('YYYY-MM-DD')
  const lastThirtyDays = today.subtract(29, 'day').format('YYYY-MM-DD')
  const thisMonthStart = today.startOf('month').format('YYYY-MM-DD')

  if (startDate === lastSevenDays && endDate === currentDay) {
    return '近 7 天'
  }

  if (startDate === lastThirtyDays && endDate === currentDay) {
    return '近 30 天'
  }

  if (startDate === thisMonthStart && endDate === currentDay) {
    return '本月'
  }

  return '自定义时间'
})

const billCountText = computed(() => `共 ${visibleBills.value.length} 笔账单`)

function cloneFilters(filters: BillFilters): BillFilters {
  return { ...filters }
}

function syncDraftFilters(): void {
  draftFilters.value = cloneFilters(appliedFilters.value)
}

function resetFilters(): void {
  appliedFilters.value = createEmptyFilters()
  syncDraftFilters()
}

function openFilterDrawer(): void {
  syncDraftFilters()
  filterDrawerVisible.value = true
}

function openBillDetail(billId: string): void {
  void router.push(`/bill/${billId}`)
}

function closeFilterDrawer(): void {
  filterDrawerVisible.value = false
  syncDraftFilters()
}

function applyFilterDrawer(): void {
  appliedFilters.value = cloneFilters(draftFilters.value)
  filterDrawerVisible.value = false
}

function applyQuickCategory(transactionKind = ''): void {
  appliedFilters.value.transactionKind = transactionKind
}

function handleTransactionKindCommand(command: string | number): void {
  applyQuickCategory(String(command))
}

function handleSortCommand(command: string | number): void {
  if (typeof command === 'string') {
    appliedFilters.value.sortBy = command as BillSort
  }
}

function handleDateCommand(command: string | number): void {
  if (typeof command !== 'string') {
    return
  }

  const today = dayjs().format('YYYY-MM-DD')

  switch (command) {
    case 'last7':
      appliedFilters.value.startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
      appliedFilters.value.endDate = today
      return
    case 'last30':
      appliedFilters.value.startDate = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
      appliedFilters.value.endDate = today
      return
    case 'thisMonth':
      appliedFilters.value.startDate = dayjs().startOf('month').format('YYYY-MM-DD')
      appliedFilters.value.endDate = today
      return
    default:
      appliedFilters.value.startDate = ''
      appliedFilters.value.endDate = ''
  }
}

function openShareDialog(): void {
  void handleShare()
}

async function handleShare(): Promise<void> {
  sharing.value = true
  ElMessage.info('正在准备分享文件，请稍候…')

  try {
    const file = await prepareBillsShareFile('pdf', `账单分享-${new Date().toISOString().slice(0, 10)}`, {
      title: '账单分享',
      filters: appliedFilters.value,
      bills: visibleBills.value,
      categories: categoryStore.sortedCategories,
    })

    let shared = null

    try {
      shared = await shareFile({
        ...file,
        title: '分享账单',
        preferChooser: true,
      })
    } catch (error) {
      downloadPreparedShareFile(file)
      ElMessage.warning(error instanceof Error ? `${error.message}，已导出分享文件` : '系统分享失败，已导出分享文件')
      return
    }

    if (shared) {
      ElMessage.success(getShareResultMessage(shared.sharedVia, '分享方式'))
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
    <div class="bill-search-panel">
      <div class="bill-search-strip">
        <el-input
          v-model="appliedFilters.keyword"
          :prefix-icon="Search"
          placeholder="搜索账单描述、编号、通知内容"
          clearable
        />
        <el-button
          class="toolbar-icon-button bill-search-strip__more"
          text
          :loading="sharing"
          aria-label="分享账单"
          @click="openShareDialog"
        >
          <el-icon><Share /></el-icon>
        </el-button>
      </div>

      <div class="bill-quick-filter-bar">
        <el-dropdown @command="handleTransactionKindCommand">
          <button
            type="button"
            class="bill-quick-filter-chip bill-quick-filter-chip--action"
            :class="{ 'is-active': !!appliedFilters.transactionKind }"
          >
            <span>{{ selectedCategoryLabel }}</span>
            <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="option in transactionKindOptions"
                :key="option.value || 'all'"
                :command="option.value"
              >
                {{ option.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown @command="handleDateCommand">
          <button
            type="button"
            class="bill-quick-filter-chip"
            :class="{ 'is-active': !!appliedFilters.startDate || !!appliedFilters.endDate }"
          >
            <span>{{ selectedDateLabel }}</span>
            <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="all">全部时间</el-dropdown-item>
              <el-dropdown-item command="last7">近 7 天</el-dropdown-item>
              <el-dropdown-item command="last30">近 30 天</el-dropdown-item>
              <el-dropdown-item command="thisMonth">本月</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown @command="handleSortCommand">
          <button type="button" class="bill-quick-filter-chip" :class="{ 'is-active': appliedFilters.sortBy !== 'date_desc' }">
            <span>{{ selectedSortLabel }}</span>
            <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="date_desc">日期从新到旧</el-dropdown-item>
              <el-dropdown-item command="date_asc">日期从早到晚</el-dropdown-item>
              <el-dropdown-item command="amount_desc">金额从高到低</el-dropdown-item>
              <el-dropdown-item command="amount_asc">金额从低到高</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button class="bill-quick-filter-chip bill-quick-filter-chip--action" plain @click="openFilterDrawer">
          <el-icon><Operation /></el-icon>
          <span>筛选</span>
        </el-button>
      </div>

      <div class="bill-toolbar-meta">
        <span class="bill-toolbar-meta__count">{{ billCountText }}</span>
        <el-button v-if="activeFilterCount" text @click="resetFilters">清空筛选</el-button>
      </div>
    </div>

    <div v-if="visibleBills.length" class="stack-list">
      <button
        v-for="bill in visibleBills"
        :key="bill.id"
        type="button"
        class="unstyled-button"
        @click="openBillDetail(bill.id)"
      >
        <BillCard
          :bill="bill"
          :category="categoryStore.getCategoryById(bill.categoryId)"
          :categories="categoryStore.sortedCategories"
          clickable
        />
      </button>
    </div>
    <el-empty v-else description="当前筛选条件下没有账单。" />

    <el-drawer
      v-model="filterDrawerVisible"
      title="筛选条件"
      direction="rtl"
      size="88%"
      append-to-body
      @closed="syncDraftFilters"
    >
      <div class="bill-filter-drawer">
        <BillFilterBar v-model="draftFilters" plain />
        <div class="bill-filter-drawer__footer">
          <el-button @click="closeFilterDrawer">取消</el-button>
          <el-button type="primary" @click="applyFilterDrawer">确认</el-button>
        </div>
      </div>
    </el-drawer>


  </section>
</template>
