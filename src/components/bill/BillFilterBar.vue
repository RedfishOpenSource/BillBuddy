<script setup lang="ts">
import { reactive, watch } from 'vue'
import { createEmptyFilters } from '../../services/analytics/billSummaryService'
import type { BillFilters } from '../../types/bill'

const props = withDefaults(
  defineProps<{
    modelValue: BillFilters
    plain?: boolean
  }>(),
  {
    plain: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: BillFilters]
}>()

const filters = reactive<BillFilters>({ ...props.modelValue })
const transactionKindOptions = [
  { label: '支出', value: 'expense' },
  { label: '负债消费', value: 'debt_expense' },
  { label: '收入', value: 'income' },
  { label: '还债', value: 'repayment' },
]

watch(
  () => props.modelValue,
  (value) => Object.assign(filters, value),
  { deep: true },
)

watch(
  filters,
  (value) => emit('update:modelValue', { ...value }),
  { deep: true },
)

function resetFilters(): void {
  Object.assign(filters, createEmptyFilters())
}
</script>

<template>
  <component :is="plain ? 'div' : 'el-card'" shadow="never">
    <div class="filter-panel">
      <div class="section-title-row">
        <div>
          <span class="eyebrow">检索条件</span>
          <h3>搜索与筛选</h3>
        </div>
        <el-button link @click="resetFilters">重置</el-button>
      </div>
      <div class="filter-grid">
        <el-input v-model="filters.keyword" placeholder="搜索描述、编号、来源等字段" clearable />
        <el-select v-model="filters.transactionKind" clearable filterable placeholder="选择交易类型">
          <el-option
            v-for="option in transactionKindOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-date-picker v-model="filters.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
        <el-date-picker v-model="filters.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
      </div>
    </div>
  </component>
</template>
