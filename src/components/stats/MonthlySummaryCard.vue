<script setup lang="ts">
import type { SummaryMetrics } from '../../services/analytics/billSummaryService'
import { formatCurrency } from '../../utils/format'

defineProps<{
  label: string
  summary: SummaryMetrics
}>()
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="section-title-row">
        <div>
          <span class="eyebrow">{{ label }}</span>
          <h3>账单概览</h3>
        </div>
        <el-tag type="info" effect="plain">{{ summary.count }} 笔</el-tag>
      </div>
    </template>

    <div class="summary-grid summary-grid--stats summary-grid--compact">
      <el-statistic class="summary-statistic is-income" title="收入" :value="summary.income" :formatter="formatCurrency" />
      <el-statistic class="summary-statistic is-expense" title="支付" :value="summary.expense" :formatter="formatCurrency" />
      <el-statistic class="summary-statistic is-net" title="净增减" :value="summary.net" :formatter="formatCurrency" />
    </div>
  </el-card>
</template>
