<script setup lang="ts">
import { reactive, watch } from 'vue'
import { createEmptyFilters } from '../../services/analytics/billSummaryService'
import type { BillFilters } from '../../types/bill'
import type { Category } from '../../types/category'

const props = withDefaults(
  defineProps<{
    modelValue: BillFilters
    categories: Category[]
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
        <el-select v-model="filters.categoryId" placeholder="选择分类" clearable>
          <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
        </el-select>
        <el-date-picker v-model="filters.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
        <el-date-picker v-model="filters.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
      </div>
    </div>
  </component>
</template>
