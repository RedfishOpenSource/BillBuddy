<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackPageHeader from '../components/BackPageHeader.vue'
import BillForm from '../components/bill/BillForm.vue'
import { consumePendingNewBillDraft, type PendingNewBillDraft } from '../services/entry/newBillDraftSession'
import type { BillFormPayload } from '../stores/billStore'
import { useBillStore } from '../stores/billStore'
import { useCategoryStore } from '../stores/categoryStore'
import { useIngestStore } from '../stores/ingestStore'

const route = useRoute()
const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const ingestStore = useIngestStore()

const entryDraft = ref<PendingNewBillDraft | null>(null)

const billId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const ingestId = computed(() => (typeof route.query.ingest === 'string' ? route.query.ingest : ''))
const draftToken = computed(() => (typeof route.query.draft === 'string' ? route.query.draft : ''))

const editingBill = computed(() => billStore.bills.find((bill) => bill.id === billId.value) ?? null)
const ingestRecord = computed(() => ingestStore.records.find((record) => record.id === ingestId.value) ?? null)
const pageTitle = computed(() => {
  if (editingBill.value) {
    return '编辑账单'
  }

  if (ingestRecord.value) {
    return '确认通知账单'
  }

  return '新增账单'
})

const submitLabel = computed(() => (editingBill.value ? '更新账单' : '确认并保存'))

watch(
  draftToken,
  () => {
    if (billId.value || ingestId.value) {
      entryDraft.value = null
      return
    }

    entryDraft.value = consumePendingNewBillDraft()
  },
  { immediate: true },
)

function getTodayValue(): string {
  return dayjs().format('YYYY-MM-DD HH:mm')
}

const initialValue = computed<BillFormPayload>(() => {
  if (editingBill.value) {
    return {
      id: editingBill.value.id,
      source: editingBill.value.source,
      transactionKind: editingBill.value.transactionKind,
      categoryId: editingBill.value.categoryId,
      amount: editingBill.value.amount,
      purpose: editingBill.value.purpose,
      billNo: editingBill.value.billNo,
      description: editingBill.value.description,
      billDate: editingBill.value.billDate,
      rawText: editingBill.value.rawText,
      status: editingBill.value.status,
    }
  }

  if (ingestRecord.value?.draft) {
    return {
      source: ingestRecord.value.draft.source,
      transactionKind: ingestRecord.value.draft.transactionKind ?? 'expense',
      categoryId: ingestRecord.value.draft.categoryId ?? 'daily',
      amount: ingestRecord.value.draft.amount,
      purpose: ingestRecord.value.draft.purpose,
      billNo: ingestRecord.value.draft.billNo ?? '',
      description: ingestRecord.value.draft.description ?? '通知草稿账单',
      billDate: ingestRecord.value.draft.billDate ?? getTodayValue(),
      rawText: ingestRecord.value.draft.rawText ?? '',
      status: 'draft',
    }
  }

  if (entryDraft.value) {
    return {
      source: entryDraft.value.source ?? 'bankCard',
      transactionKind: entryDraft.value.transactionKind ?? 'expense',
      categoryId: entryDraft.value.categoryId ?? 'daily',
      amount: entryDraft.value.amount,
      purpose: entryDraft.value.purpose,
      billNo: entryDraft.value.billNo ?? '',
      description: entryDraft.value.description ?? '',
      billDate: entryDraft.value.billDate ?? getTodayValue(),
      rawText: entryDraft.value.rawText ?? '',
      status: 'draft',
    }
  }

  return {
    source: 'bankCard',
    transactionKind: 'expense',
    categoryId: 'daily',
    amount: undefined,
    billNo: '',
    description: '',
    billDate: getTodayValue(),
  }
})

function handleSubmit(payload: BillFormPayload): void {
  const bill = billStore.saveBill({
    ...payload,
    status: ingestId.value ? 'confirmed' : payload.status ?? 'confirmed',
  })

  if (ingestId.value) {
    ingestStore.confirmRecord(ingestId.value, bill.id)
  }

  ElMessage.success(editingBill.value ? '账单已更新' : '账单已保存')
  void router.replace(`/bill/${bill.id}`)
}
</script>

<template>
  <section class="screen screen--scrollable screen--standalone-form">
    <BackPageHeader :title="pageTitle" @back="router.back()" />

    <el-alert v-if="ingestRecord" title="原始通知" type="info" :closable="false" show-icon>
      {{ ingestRecord.notificationTitle }} · {{ ingestRecord.notificationText }}
    </el-alert>

    <el-card shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">账单信息</span>
            <h3>填写或确认账单内容</h3>
          </div>
        </div>
      </template>

      <BillForm
        :initial-value="initialValue"
        :categories="categoryStore.sortedCategories"
        :submit-label="submitLabel"
        @submit="handleSubmit"
      />
    </el-card>
  </section>
</template>
