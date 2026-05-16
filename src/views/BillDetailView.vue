<script setup lang="ts">
import { MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackPageHeader from '../components/BackPageHeader.vue'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { formatCurrency, formatDate, formatSourceLabel } from '../utils/format'
import {
  getBillDisplayTitle,
  getBillImageCountText,
  getBillVideoCountText,
  resolveBillImageSrc,
  resolveBillVideoSrc,
} from '../utils/billPresentation'

const route = useRoute()
const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const actionDrawerVisible = ref(false)

const billId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const bill = computed(() => billStore.bills.find((item) => item.id === billId.value) ?? null)
const category = computed(() =>
  bill.value ? categoryStore.getCategoryById(bill.value.categoryId) : null,
)
const displayTitle = computed(() => (bill.value ? getBillDisplayTitle(bill.value, category.value) : '账单详情'))
const imagePreviewList = computed(() => bill.value?.images.map((image) => resolveBillImageSrc(image)) ?? [])

async function handleDelete(): Promise<void> {
  if (!bill.value) {
    return
  }

  actionDrawerVisible.value = false
  const billToDelete = bill.value.id
  const action = await ElMessageBox.confirm('删除后不可恢复，确定继续吗？', '删除账单', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    distinguishCancelAndClose: true,
    closeOnClickModal: false,
  }).catch((reason) => reason)

  if (action !== 'confirm') {
    return
  }

  billStore.deleteBill(billToDelete)
  ElMessage.success('账单已删除')
  await router.replace('/bills')
}
</script>

<template>
  <section v-if="bill" class="screen">
    <BackPageHeader eyebrow="账单详情" :title="displayTitle" @back="router.back()">
      <template #actions>
        <el-button circle :icon="MoreFilled" @click="actionDrawerVisible = true" />
      </template>
    </BackPageHeader>

    <el-card shadow="never" class="detail-hero">
      <span class="detail-hero__icon" :style="{ background: `${category?.color ?? '#8f96b3'}22` }">
        {{ category?.icon ?? '🧾' }}
      </span>
      <strong>{{ formatCurrency(bill.amount) }}</strong>
      <div class="page-actions">
        <el-tag effect="plain">{{ category?.name ?? '未分类' }}</el-tag>
        <el-tag type="info" effect="plain">{{ formatSourceLabel(bill.source) }}</el-tag>
        <el-tag v-if="bill.images.length" type="success" effect="plain">{{ getBillImageCountText(bill.images) }}</el-tag>
        <el-tag v-if="bill.videos?.length" type="warning" effect="plain">{{ getBillVideoCountText(bill.videos) }}</el-tag>
      </div>
    </el-card>

    <el-card v-if="bill.images.length" shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">附件</span>
            <h3>票据图片</h3>
          </div>
        </div>
      </template>
      <div class="bill-image-gallery">
        <el-image
          v-for="(image, index) in bill.images"
          :key="image.id"
          :src="resolveBillImageSrc(image)"
          :preview-src-list="imagePreviewList"
          :initial-index="index"
          fit="cover"
          class="bill-image-gallery__item"
          preview-teleported
        />
      </div>
    </el-card>

    <el-card v-if="bill.videos?.length" shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">附件</span>
            <h3>商品视频</h3>
          </div>
        </div>
      </template>
      <div class="bill-image-gallery">
        <video
          v-for="video in bill.videos"
          :key="video.id"
          :src="resolveBillVideoSrc(video)"
          controls
          preload="metadata"
          class="bill-image-gallery__item bill-video-gallery__item"
        />
      </div>
    </el-card>

    <el-card shadow="never" class="detail-card">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="账单日期">{{ formatDate(bill.billDate) }}</el-descriptions-item>
        <el-descriptions-item label="账单编号">{{ bill.billNo || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="补充描述">{{ bill.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="图片数量">{{ getBillImageCountText(bill.images) }}</el-descriptions-item>
        <el-descriptions-item label="视频数量">{{ getBillVideoCountText(bill.videos ?? []) }}</el-descriptions-item>
        <el-descriptions-item label="原始通知">{{ bill.rawText || '该账单为手动录入' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-drawer v-model="actionDrawerVisible" direction="btt" size="auto" :with-header="false" append-to-body>
      <div class="action-sheet">
        <div class="action-sheet__header">
          <span class="eyebrow">更多操作</span>
          <h3>{{ displayTitle }}</h3>
        </div>
        <div class="action-sheet__actions">
          <el-button type="primary" @click="router.push(`/bill/${bill.id}/edit`)">编辑账单</el-button>
          <el-button type="danger" plain @click="handleDelete">删除账单</el-button>
        </div>
      </div>
    </el-drawer>
  </section>

  <section v-else class="screen">
    <el-empty description="没有找到对应账单。" />
  </section>
</template>
