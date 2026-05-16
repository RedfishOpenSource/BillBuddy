<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'
import MonthlySummaryCard from '../components/stats/MonthlySummaryCard.vue'
import { getMonthBills, summarizeBills } from '../services/analytics/billSummaryService'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { formatMonthLabel } from '../utils/format'

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const today = dayjs()

const monthBills = computed(() => getMonthBills(billStore.bills, today.year(), today.month() + 1))
const summary = computed(() => summarizeBills(monthBills.value, categoryStore.sortedCategories))
</script>

<template>
  <section class="screen screen--static">
    <MonthlySummaryCard :label="formatMonthLabel(today.year(), today.month() + 1)" :summary="summary" />
  </section>
</template>
