<script setup lang="ts">
import { MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackPageHeader from '../components/BackPageHeader.vue'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { getCategoryDisplayName } from '../utils/category'
import { formatCurrency, formatDate, formatSourceLabel, formatTransactionKindLabel } from '../utils/format'
import { getBillDisplayTitle } from '../utils/billPresentation'

const route = useRoute()
const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const actionDrawerVisible = ref(false)
const deleteDialogVisible = ref(false)

const billId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const bill = computed(() => billStore.bills.find((item) => item.id === billId.value) ?? null)
const category = computed(() => (bill.value ? categoryStore.getCategoryById(bill.value.categoryId) : null))
const categoryLabel = computed(() =>
  getCategoryDisplayName(category.value, categoryStore.sortedCategories) || '未分类',
)
const displayTitle = computed(() => (bill.value ? getBillDisplayTitle(bill.value, category.value) : '账单详情'))

function openDeleteDialog(): void {
  actionDrawerVisible.value = false
  deleteDialogVisible.value = true
}

async function handleDelete(): Promise<void> {
  if (!bill.value) {
    return
  }

  const billToDelete = bill.value.id
  deleteDialogVisible.value = false
  billStore.deleteBill(billToDelete)
  ElMessage.success('账单已删除')
  await router.replace('/bills')
}
</script>

<template>
  <section v-if="bill" class="screen">
    <BackPageHeader eyebrow="账单详情" :title="displayTitle" @back="router.back()">
      <template #actions>
        <el-button class="back-page-header__action-button" circle :icon="MoreFilled" aria-label="更多操作" @click="actionDrawerVisible = true" />
      </template>
    </BackPageHeader>

    <el-card shadow="never" class="detail-hero">
      <span class="detail-hero__icon" :style="{ background: `${category?.color ?? '#8f96b3'}22` }">
        {{ category?.icon ?? '🧾' }}
      </span>
      <strong>{{ formatCurrency(bill.amount) }}</strong>
      <div class="page-actions">
        <el-tag effect="plain">{{ categoryLabel }}</el-tag>
        <el-tag type="warning" effect="plain">{{ formatTransactionKindLabel(bill.transactionKind) }}</el-tag>
        <el-tag type="info" effect="plain">{{ formatSourceLabel(bill.source) }}</el-tag>
      </div>
    </el-card>

    <el-card shadow="never" class="detail-card">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="账单日期">{{ formatDate(bill.billDate) }}</el-descriptions-item>
        <el-descriptions-item label="交易类型">{{ formatTransactionKindLabel(bill.transactionKind) }}</el-descriptions-item>
        <el-descriptions-item label="账单编号">{{ bill.billNo || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ categoryLabel }}</el-descriptions-item>
        <el-descriptions-item label="补充描述">{{ bill.description || '无' }}</el-descriptions-item>
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
          <el-button type="danger" plain @click="openDeleteDialog">删除账单</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="deleteDialogVisible" width="92%" class="bill-delete-dialog" align-center>
      <div class="action-sheet bill-delete-dialog__content">
        <div class="action-sheet__header">
          <span class="eyebrow">删除账单</span>
          <h3>{{ displayTitle }}</h3>
        </div>
        <p>删除后不可恢复，确定继续吗？</p>
        <div class="bill-delete-dialog__actions">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleDelete">确认删除</el-button>
        </div>
      </div>
    </el-dialog>
  </section>

  <section v-else class="screen">
    <el-empty description="没有找到对应账单。" />
  </section>
</template>
