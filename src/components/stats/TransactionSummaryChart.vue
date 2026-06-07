<script setup lang="ts">
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { TransactionSummaryItem } from '../../services/analytics/billSummaryService'
import { formatCurrency } from '../../utils/format'

use([CanvasRenderer, PieChart, LegendComponent, TooltipComponent])

const props = defineProps<{
  items: TransactionSummaryItem[]
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (item: { name: string; value: number }) => `${item.name}：${formatCurrency(item.value)}`,
  },
  legend: {
    bottom: 0,
    textStyle: { color: '#606266' },
  },
  series: [
    {
      name: '交易类型占比',
      type: 'pie',
      radius: ['48%', '74%'],
      center: ['50%', '44%'],
      label: {
        color: '#606266',
        formatter: '{b}',
      },
      data: props.items.map((item) => ({
        name: item.label,
        value: Number(item.amount.toFixed(2)),
        itemStyle: { color: item.color },
      })),
    },
  ],
}))
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="section-title-row">
        <div>
          <span class="eyebrow">结构分析</span>
          <h3>交易类型占比</h3>
        </div>
      </div>
    </template>
    <v-chart class="chart chart-pie" :option="option" autoresize />
  </el-card>
</template>
