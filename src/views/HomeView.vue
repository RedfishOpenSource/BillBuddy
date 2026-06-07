<script setup lang="ts">
import { computed } from 'vue'
import MonthlySummaryCard from '../components/stats/MonthlySummaryCard.vue'
import { summarizeBills } from '../services/analytics/billSummaryService'
import { useBillStore } from '../stores/billStore'

const billStore = useBillStore()
const summary = computed(() => summarizeBills(billStore.bills))
const summaryLabel = '全部账单'
</script>

<template>
  <section class="screen screen--static">
    <MonthlySummaryCard :label="summaryLabel" :summary="summary" />
  </section>
</template>
