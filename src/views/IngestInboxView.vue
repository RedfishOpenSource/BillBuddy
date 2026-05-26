<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import IngestDraftCard from '../components/ingest/IngestDraftCard.vue'
import { useCategoryStore } from '../stores/categoryStore'
import { useIngestStore } from '../stores/ingestStore'

const router = useRouter()
const categoryStore = useCategoryStore()
const ingestStore = useIngestStore()

const pendingRecords = computed(() => ingestStore.pendingRecords)
</script>

<template>
  <section class="screen">
    <el-alert type="info" :closable="false" show-icon>
      微信和支付宝通知会先进入这里，确认后再写入正式账单。
    </el-alert>

    <div v-if="pendingRecords.length" class="stack-list">
      <IngestDraftCard
        v-for="record in pendingRecords"
        :key="record.id"
        :record="record"
        :category="categoryStore.getCategoryById(record.draft?.categoryId ?? '')"
        :categories="categoryStore.sortedCategories"
        @review="router.push(`/bill/new?ingest=${record.id}`)"
        @dismiss="ingestStore.dismissRecord(record.id)"
      />
    </div>
    <el-empty v-else description="目前没有待确认的通知账单。" />
  </section>
</template>
