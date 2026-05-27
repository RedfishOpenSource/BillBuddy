<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '../../types/category'
import type { IngestRecord } from '../../types/ingest'
import { getCategoryDisplayName } from '../../utils/category'
import { formatCurrency, formatDate } from '../../utils/format'

const props = defineProps<{
  record: IngestRecord
  category: Category | null
  categories?: Category[]
}>()

const emit = defineEmits<{
  review: [recordId: string]
  dismiss: [recordId: string]
}>()

const sourceLabel = computed(() => {
  if (props.record.sourceApp === 'wechat') {
    return '微信'
  }

  if (props.record.sourceApp === 'alipay') {
    return '支付宝'
  }

  return '未知来源'
})

const parsedTagType = computed<'success' | 'warning'>(() => {
  if (props.record.parsedStatus === 'parsed') {
    return 'success'
  }

  return 'warning'
})

const parsedTagLabel = computed(() => {
  if (props.record.parsedStatus === 'parsed') {
    return '高置信度'
  }

  return '待确认'
})

const displayTitle = computed(() => {
  const purpose = props.record.draft?.purpose?.trim()
  if (purpose) {
    return purpose
  }

  const description = props.record.draft?.description?.trim()
  if (description) {
    return description
  }

  return props.record.notificationTitle
})
const categoryLabel = computed(() => {
  if (!props.category) {
    return '其他'
  }

  return getCategoryDisplayName(props.category, props.categories ?? [props.category]) || props.category.name
})
</script>

<template>
  <el-card shadow="never" class="ingest-card">
    <template #header>
      <div class="section-title-row">
        <div>
          <span class="eyebrow">{{ sourceLabel }}</span>
          <h3>{{ displayTitle }}</h3>
        </div>
        <el-tag :type="parsedTagType" effect="plain">{{ parsedTagLabel }}</el-tag>
      </div>
    </template>

    <div class="ingest-card__body">
      <div>
        <span>建议分类</span>
        <strong>{{ category?.icon }} {{ categoryLabel }}</strong>
      </div>
      <div>
        <span>建议金额</span>
        <strong>{{ formatCurrency(record.draft?.amount ?? 0) }}</strong>
      </div>
      <div>
        <span>账单日期</span>
        <strong>{{ formatDate(record.draft?.billDate ?? record.receivedAt) }}</strong>
      </div>
      <div>
        <span>通知时间</span>
        <strong>{{ formatDate(record.receivedAt, 'MM.DD HH:mm') }}</strong>
      </div>
    </div>
    <p class="ingest-card__text">{{ record.notificationTitle }} · {{ record.notificationText }}</p>
    <div class="ingest-card__actions">
      <el-button type="primary" @click="emit('review', record.id)">确认入账</el-button>
      <el-button @click="emit('dismiss', record.id)">忽略</el-button>
    </div>
  </el-card>
</template>
