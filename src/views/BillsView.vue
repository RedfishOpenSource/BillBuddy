<script setup lang="ts">
import { ArrowDown, MoreFilled, Operation, Search } from '@element-plus/icons-vue'
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
import type { BillSort } from '../types/bill'

const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const filters = ref(createEmptyFilters())
const filterDrawerVisible = ref(false)
const shareActionDrawerVisible = ref(false)
const sharing = ref(false)

const shareTargets = [
  { label: '微信', targetPackage: 'com.tencent.mm' },
  { label: 'QQ', targetPackage: 'com.tencent.mobileqq' },
  { label: '支付宝', targetPackage: 'com.eg.android.AlipayGphone' },
] as const

const visibleBills = computed(() =>
  sortBills(
    filterBills(billStore.bills, filters.value, categoryStore.sortedCategories),
    filters.value.sortBy,
  ),
)

const activeFilterCount = computed(() => {
  return [
    filters.value.keyword,
    filters.value.categoryId,
    filters.value.startDate,
    filters.value.endDate,
  ].filter(Boolean).length
})

const selectedCategoryLabel = computed(() =>
  categoryStore.getCategoryById(filters.value.categoryId)?.name ?? '全部分类',
)

const selectedSortLabel = computed(() => {
  switch (filters.value.sortBy) {
    case 'date_asc':
      return '最早在前'
    case 'amount_desc':
      return '金额从高到低'
    case 'amount_asc':
      return '金额从低到高'
    default:
      return '最新在前'
  }
})

const selectedDateLabel = computed(() => {
  const { startDate, endDate } = filters.value

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

function resetFilters(): void {
  filters.value = createEmptyFilters()
}

function handleCategoryCommand(command: string | number): void {
  filters.value.categoryId = typeof command === 'string' ? command : ''
}

function handleSortCommand(command: string | number): void {
  if (typeof command === 'string') {
    filters.value.sortBy = command as BillSort
  }
}

function handleDateCommand(command: string | number): void {
  if (typeof command !== 'string') {
    return
  }

  const today = dayjs().format('YYYY-MM-DD')

  switch (command) {
    case 'last7':
      filters.value.startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
      filters.value.endDate = today
      return
    case 'last30':
      filters.value.startDate = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
      filters.value.endDate = today
      return
    case 'thisMonth':
      filters.value.startDate = dayjs().startOf('month').format('YYYY-MM-DD')
      filters.value.endDate = today
      return
    default:
      filters.value.startDate = ''
      filters.value.endDate = ''
  }
}

async function handleShare(targetPackage: string): Promise<void> {
  if (!visibleBills.value.length) {
    ElMessage.warning('当前没有可分享的账单')
    return
  }

  sharing.value = true
  shareActionDrawerVisible.value = false

  try {
    const file = await prepareBillsShareFile('pdf', `账单分享-${new Date().toISOString().slice(0, 10)}`, {
      title: '账单分享',
      filters: filters.value,
      bills: visibleBills.value,
      categories: categoryStore.sortedCategories,
    })
    const shared = await shareFile({
      ...file,
      title: '分享账单列表',
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
<<<<<<< HEAD
  <section class="screen screen--dense">
    <header class="page-heading">
      <div>
        <span class="eyebrow">账单列表</span>
        <h2>账单检索</h2>
=======
  <section class="screen">
    <div class="bill-search-panel">
      <div class="bill-search-strip">
        <el-input
          v-model="filters.keyword"
          :prefix-icon="Search"
          placeholder="搜索账单描述、编号、通知内容"
          clearable
        />
        <el-button class="bill-search-strip__more" circle plain aria-label="更多操作" @click="shareActionDrawerVisible = true">
          <el-icon><MoreFilled /></el-icon>
        </el-button>
>>>>>>> 542dbf31caab0fd391c331b1660cbf2f813891e4
      </div>

      <div class="bill-quick-filter-bar">
        <el-dropdown @command="handleCategoryCommand">
          <button type="button" class="bill-quick-filter-chip" :class="{ 'is-active': !!filters.categoryId }">
            <span>{{ selectedCategoryLabel }}</span>
            <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="">全部分类</el-dropdown-item>
              <el-dropdown-item v-for="category in categoryStore.sortedCategories" :key="category.id" :command="category.id">
                {{ category.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown @command="handleDateCommand">
          <button
            type="button"
            class="bill-quick-filter-chip"
            :class="{ 'is-active': !!filters.startDate || !!filters.endDate }"
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
          <button type="button" class="bill-quick-filter-chip" :class="{ 'is-active': filters.sortBy !== 'date_desc' }">
            <span>{{ selectedSortLabel }}</span>
            <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="date_desc">最新在前</el-dropdown-item>
              <el-dropdown-item command="date_asc">最早在前</el-dropdown-item>
              <el-dropdown-item command="amount_desc">金额从高到低</el-dropdown-item>
              <el-dropdown-item command="amount_asc">金额从低到高</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button class="bill-quick-filter-chip bill-quick-filter-chip--action" plain @click="filterDrawerVisible = true">
          <el-icon><Operation /></el-icon>
          <span>筛选</span>
        </el-button>
      </div>

<<<<<<< HEAD
    <div class="bill-search-strip">
      <el-input
        v-model="filters.keyword"
        :prefix-icon="Search"
        placeholder="搜索账单描述、编号、通知内容"
        clearable
      />
      <el-button class="bill-search-strip__button" plain @click="filterDrawerVisible = true">
        <el-icon><Operation /></el-icon>
        <span>筛选</span>
      </el-button>
    </div>

    <div class="bill-quick-filter-bar">
      <el-dropdown @command="handleCategoryCommand">
        <button type="button" class="bill-quick-filter-chip" :class="{ 'is-active': !!filters.categoryId }">
          <span>{{ selectedCategoryLabel }}</span>
          <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="">全部分类</el-dropdown-item>
            <el-dropdown-item v-for="category in categoryStore.sortedCategories" :key="category.id" :command="category.id">
              {{ category.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown @command="handleDateCommand">
        <button
          type="button"
          class="bill-quick-filter-chip"
          :class="{ 'is-active': !!filters.startDate || !!filters.endDate }"
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
        <button type="button" class="bill-quick-filter-chip" :class="{ 'is-active': filters.sortBy !== 'date_desc' }">
          <span>{{ selectedSortLabel }}</span>
          <el-icon class="bill-quick-filter-chip__icon"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="date_desc">最新在前</el-dropdown-item>
            <el-dropdown-item command="date_asc">最早在前</el-dropdown-item>
            <el-dropdown-item command="amount_desc">金额从高到低</el-dropdown-item>
            <el-dropdown-item command="amount_asc">金额从低到高</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="bill-toolbar-meta">
      <span class="bill-toolbar-meta__count">{{ billCountText }}</span>
      <el-button v-if="activeFilterCount" text @click="resetFilters">清空筛选</el-button>
=======
      <div class="filter-summary">
        <div>
          <span class="eyebrow">筛选概览</span>
          <p class="filter-summary__text">{{ filterSummary }}</p>
        </div>
        <div class="inline-actions">
          <el-button v-if="activeFilterCount" text @click="resetFilters">清空筛选</el-button>
        </div>
      </div>
>>>>>>> 542dbf31caab0fd391c331b1660cbf2f813891e4
    </div>

    <div v-if="visibleBills.length" class="stack-list">
      <button
        v-for="bill in visibleBills"
        :key="bill.id"
        type="button"
        class="unstyled-button"
        @click="router.push(`/bill/${bill.id}`)"
      >
        <BillCard :bill="bill" :category="categoryStore.getCategoryById(bill.categoryId)" clickable />
      </button>
    </div>
    <el-empty v-else description="当前筛选条件下没有账单。" />

    <el-drawer v-model="filterDrawerVisible" title="筛选条件" direction="ltr" size="88%" append-to-body>
      <BillFilterBar v-model="filters" :categories="categoryStore.sortedCategories" plain />
    </el-drawer>

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
