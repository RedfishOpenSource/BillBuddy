<script setup lang="ts">
import { computed } from 'vue'
import type { Bill } from '../../types/bill'
import type { Category } from '../../types/category'
import { formatCurrency, formatDate, formatSourceLabel } from '../../utils/format'
import { getBillDisplayTitle } from '../../utils/billPresentation'

const props = defineProps<{
  bill: Bill
  category: Category | null
  clickable?: boolean
}>()

const amountClass = computed(() => (props.category?.type === 'income' ? 'is-income' : 'is-expense'))
const displayTitle = computed(() => getBillDisplayTitle(props.bill, props.category))
</script>

<template>
  <article class="bill-card" :class="{ 'is-clickable': clickable }">
    <div class="bill-card__icon" :style="{ background: `${category?.color ?? '#8087a2'}22` }">
      {{ category?.icon ?? '🧾' }}
    </div>
    <div class="bill-card__content">
      <div class="bill-card__topline">
        <div>
          <h3>{{ displayTitle }}</h3>
          <div class="bill-card__labels">
            <el-tag size="small" effect="plain">{{ category?.name ?? '未分类' }}</el-tag>
            <el-tag size="small" type="info" effect="plain">{{ formatSourceLabel(bill.source) }}</el-tag>
            <el-tag v-if="bill.images.length" size="small" type="success" effect="plain">{{ bill.images.length }} 张图片</el-tag>
          </div>
        </div>
        <strong class="bill-card__amount" :class="amountClass">{{ formatCurrency(bill.amount) }}</strong>
      </div>
      <div class="bill-card__meta">
        <span>{{ formatDate(bill.billDate) }}</span>
        <span>{{ bill.billNo || '无编号' }}</span>
      </div>
      <p v-if="bill.description" class="bill-card__description">{{ bill.description }}</p>
    </div>
  </article>
</template>
