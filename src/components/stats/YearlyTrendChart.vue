<script setup lang="ts">
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { TrendPoint } from '../../services/analytics/billSummaryService'
import { formatCurrency } from '../../utils/format'

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent])

const props = defineProps<{
  points: TrendPoint[]
  eyebrow: string
  title: string
}>()

const option = computed(() => ({
  color: ['#67c23a', '#f56c6c'],
  tooltip: {
    trigger: 'axis',
    formatter: (params: Array<{ seriesName: string; value: number; axisValue: string }>) =>
      params
        .map((item) => `${item.axisValue} · ${item.seriesName}：${formatCurrency(item.value)}`)
        .join('<br/>'),
  },
  legend: {
    textStyle: { color: '#606266' },
  },
  grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: props.points.map((point) => point.label),
    axisLabel: { color: '#909399' },
    axisLine: { lineStyle: { color: '#dcdfe6' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#909399' },
    splitLine: { lineStyle: { color: '#ebeef5' } },
  },
  series: [
    {
      name: '收入',
      type: 'line',
      smooth: true,
      data: props.points.map((point) => point.income),
      areaStyle: { color: 'rgba(103, 194, 58, 0.10)' },
    },
    {
      name: '支出',
      type: 'line',
      smooth: true,
      data: props.points.map((point) => point.expense),
      areaStyle: { color: 'rgba(245, 108, 108, 0.10)' },
    },
  ],
}))
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="section-title-row">
        <div>
          <span class="eyebrow">{{ eyebrow }}</span>
          <h3>{{ title }}</h3>
        </div>
      </div>
    </template>
    <v-chart class="chart" :option="option" autoresize />
  </el-card>
</template>
