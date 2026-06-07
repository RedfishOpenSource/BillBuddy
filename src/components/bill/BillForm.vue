<script setup lang="ts">
import { type FormInstance, type FormRules } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import type { BillSource, TransactionKind } from '../../types/bill'
import type { Category } from '../../types/category'
import type { BillFormPayload } from '../../stores/billStore'
import { createTopLevelCategoryGroups } from '../../utils/category'

function createFormState(value: BillFormPayload): BillFormPayload {
  return {
    ...value,
  }
}

const props = defineProps<{
  initialValue: BillFormPayload
  categories: Category[]
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [value: BillFormPayload]
}>()

const formRef = ref<FormInstance>()
const selectedTopCategoryId = ref('')
const form = reactive<BillFormPayload>(createFormState(props.initialValue))

const sourceOptions: Array<{ label: string; value: BillSource }> = [
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '银行卡', value: 'bankCard' },
]

const transactionKindOptions: Array<{ label: string; value: TransactionKind }> = [
  { label: '支出', value: 'expense' },
  { label: '负债消费', value: 'debt_expense' },
  { label: '收入', value: 'income' },
  { label: '还债', value: 'repayment' },
]

const scopedCategories = computed(() => {
  if (form.transactionKind === 'income') {
    return props.categories.filter((category) => category.type === 'income')
  }

  if (form.transactionKind === 'repayment') {
    return props.categories.filter((category) => category.parentId === 'finance')
  }

  return props.categories.filter((category) => category.type === 'expense' && category.id !== 'finance')
})

const topCategoryGroups = computed(() => {
  if (form.transactionKind === 'repayment') {
    const repaymentChildren = scopedCategories.value

    if (!repaymentChildren.length) {
      return []
    }

    return [{
      category: {
        id: 'finance',
        name: '债务还债',
        type: 'expense',
        icon: '💳',
        color: '#7e8ca7',
        sortOrder: 1000,
      },
      children: repaymentChildren,
    }]
  }

  return createTopLevelCategoryGroups(scopedCategories.value)
})
const selectedTopCategory = computed(
  () => topCategoryGroups.value.find((group) => group.category.id === selectedTopCategoryId.value) ?? null,
)
const childCategoryOptions = computed(() => selectedTopCategory.value?.children ?? [])
const showCategoryPicker = computed(() => topCategoryGroups.value.length > 0)
const showRepaymentHint = computed(() => form.transactionKind === 'repayment')
const showLiabilityHint = computed(() => form.transactionKind === 'debt_expense')
const categoryLabel = computed(() => {
  if (form.transactionKind === 'income') return '收入分类'
  if (form.transactionKind === 'repayment') return '债务还债'
  return '支出分类'
})

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(form, createFormState(value))
    syncSelectedTopCategory(value.categoryId)
  },
  { deep: true, immediate: true },
)

watch(
  () => [props.categories, form.transactionKind],
  () => {
    syncSelectedTopCategory(form.categoryId)
  },
  { deep: true, immediate: true },
)

watch(
  () => form.transactionKind,
  () => {
    const current = scopedCategories.value.find((category) => category.id === form.categoryId)
    const isChildSelection = current ? Boolean(current.parentId) : false

    if (!isChildSelection) {
      const firstChild = topCategoryGroups.value[0]?.children[0]
      form.categoryId = firstChild?.id ?? ''
    }

    syncSelectedTopCategory(form.categoryId)
  },
  { immediate: true },
)

watch(selectedTopCategoryId, (topCategoryId) => {
  if (!topCategoryId) {
    return
  }

  const group = topCategoryGroups.value.find((item) => item.category.id === topCategoryId)
  if (!group) {
    return
  }

  const current = scopedCategories.value.find((category) => category.id === form.categoryId)
  const belongsToGroup = current
    ? current.parentId === group.category.id
    : false

  if (!belongsToGroup) {
    form.categoryId = group.children[0]?.id ?? ''
  }
})

const rules: FormRules<BillFormPayload> = {
  transactionKind: [{ required: true, message: '请选择交易类型', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  billDate: [{ required: true, message: '请选择账单日期', trigger: 'change' }],
}

function syncSelectedTopCategory(categoryId: string): void {
  const current = scopedCategories.value.find((category) => category.id === categoryId)
  const topCategoryId = current?.parentId ?? current?.id ?? topCategoryGroups.value[0]?.category.id ?? ''
  selectedTopCategoryId.value = topCategoryId
}

function selectTopCategory(categoryId: string): void {
  selectedTopCategoryId.value = categoryId
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  emit('submit', {
    ...form,
    amount: Number(form.amount),
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" class="bill-form">
    <div class="bill-form__grid">
      <el-form-item label="交易类型" prop="transactionKind">
        <el-segmented v-model="form.transactionKind" :options="transactionKindOptions" />
      </el-form-item>

      <el-form-item label="收支方式">
        <div class="bill-form__field-with-clear">
          <el-segmented v-model="form.source" :options="sourceOptions" />
        </div>
      </el-form-item>

      <el-alert v-if="showRepaymentHint" type="info" :closable="false" show-icon>
        债务还债分类仅在“交易类型”为还债时展示。
      </el-alert>

      <el-alert v-if="showLiabilityHint" type="warning" :closable="false" show-icon>
        负债消费用于记录债务形成，不计入总支出。
      </el-alert>

      <el-form-item v-if="showCategoryPicker" :label="categoryLabel" prop="categoryId" class="is-span-2">
        <div class="bill-form__category-picker">
          <div class="category-scroll-row">
            <button
              v-for="group in topCategoryGroups"
              :key="group.category.id"
              type="button"
              class="category-pill"
              :class="{ 'is-active': selectedTopCategoryId === group.category.id, 'is-selected': form.categoryId === group.category.id }"
              @click="selectTopCategory(group.category.id)"
            >
              <span class="category-pill__icon">{{ group.category.icon }}</span>
              <span>{{ group.category.name }}</span>
            </button>
          </div>
          <div class="category-scroll-row category-scroll-row--secondary">
            <button
              v-for="child in childCategoryOptions"
              :key="child.id"
              type="button"
              class="category-pill category-pill--secondary"
              :class="{ 'is-active': form.categoryId === child.id }"
              @click="form.categoryId = child.id"
            >
              <span class="category-pill__icon">{{ child.icon }}</span>
              <span>{{ child.name }}</span>
            </button>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="form.amount" :min="0" :controls="false" clearable placeholder="请输入金额" />
      </el-form-item>

      <el-form-item label="账单日期" prop="billDate">
        <el-date-picker
          v-model="form.billDate"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm"
          format="YYYY-MM-DD HH:mm"
          placeholder="选择日期时间"
          clearable
        />
      </el-form-item>

      <el-form-item label="补充描述" class="is-span-2">
        <el-input v-model="form.description" type="textarea" :rows="4" clearable placeholder="可写入门店、场景、备注等信息" />
      </el-form-item>

      <el-form-item label="账单编号">
        <el-input v-model="form.billNo" clearable placeholder="可留空" />
      </el-form-item>
    </div>

    <el-button type="primary" class="bill-form__submit" @click="handleSubmit">
      {{ submitLabel ?? '保存账单' }}
    </el-button>
  </el-form>
</template>
