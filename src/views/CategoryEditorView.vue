<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackPageHeader from '../components/BackPageHeader.vue'
import { useCategoryStore } from '../stores/categoryStore'
import type { CategoryType } from '../types/category'
import { createTopLevelCategoryGroups, getCategoryDisplayName } from '../utils/category'

interface CategoryFormState {
  id: string
  name: string
  type: CategoryType
  parentId: string
  icon: string
  color: string
}

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

const categoryId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const queryType = computed<CategoryType>(() => (route.query.type === 'income' ? 'income' : 'expense'))
const queryParentId = computed(() => (typeof route.query.parentId === 'string' ? route.query.parentId : ''))
const editingCategory = computed(() => categoryStore.getCategoryById(categoryId.value))
const isEditing = computed(() => Boolean(editingCategory.value))

const form = reactive<CategoryFormState>({
  id: '',
  name: '',
  type: queryType.value,
  parentId: queryParentId.value,
  icon: '🧾',
  color: '#8f96b3',
})

const dialogTitle = computed(() => (isEditing.value ? '编辑分类' : '新增分类'))
const submitLabel = computed(() => (isEditing.value ? '保存修改' : '保存分类'))
const currentParentLabel = computed(() => getCategoryDisplayName(form.parentId, categoryStore.sortedCategories))
const availableParentOptions = computed(() =>
  createTopLevelCategoryGroups(categoryStore.sortedCategories, form.type)
    .map((group) => group.category)
    .filter((category) => category.id !== form.id),
)

function createDefaultCategoryForm(type: CategoryType): CategoryFormState {
  return {
    id: '',
    name: '',
    type,
    parentId: '',
    icon: '🧾',
    color: type === 'income' ? '#34c759' : '#8f96b3',
  }
}

function syncFormFromRoute(): void {
  const category = editingCategory.value

  if (category) {
    Object.assign(form, {
      id: category.id,
      name: category.name,
      type: category.type,
      parentId: category.parentId ?? '',
      icon: category.icon,
      color: category.color,
    })
    return
  }

  const parentCategory = queryParentId.value ? categoryStore.getCategoryById(queryParentId.value) : null
  const defaultType = parentCategory?.type ?? queryType.value
  Object.assign(form, createDefaultCategoryForm(defaultType))
  form.parentId = parentCategory?.id ?? ''
}

watch(
  () => [categoryId.value, queryType.value, queryParentId.value, categoryStore.sortedCategories],
  () => {
    syncFormFromRoute()
  },
  { deep: true, immediate: true },
)

watch(
  () => form.parentId,
  (parentId) => {
    const parent = categoryStore.getCategoryById(parentId)
    if (parent) {
      form.type = parent.type
    }
  },
)

watch(
  () => form.type,
  (type) => {
    const parent = categoryStore.getCategoryById(form.parentId)
    if (parent && parent.type !== type) {
      form.parentId = ''
    }
  },
)

function goBack(): void {
  void router.back()
}

function submitCategory(): void {
  if (!form.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }

  if (form.parentId && !categoryStore.getCategoryById(form.parentId)) {
    ElMessage.warning('请选择有效的一级分类')
    return
  }

  try {
    const savedCategory = categoryStore.saveCategory({
      id: form.id || undefined,
      name: form.name.trim(),
      type: form.type,
      parentId: form.parentId || undefined,
      icon: form.icon.trim() || '🧾',
      color: form.color,
    })
    ElMessage.success('分类已保存')
    void router.replace(`/settings/category/${savedCategory.id}`)
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '分类保存失败')
  }
}

async function removeCategory(): Promise<void> {
  if (!editingCategory.value) {
    return
  }

  const childCount = categoryStore.sortedCategories.filter((item) => item.parentId === editingCategory.value?.id).length
  const message = childCount
    ? `删除后会同时移除 ${childCount} 个二级分类，确定继续吗？`
    : '删除后不可恢复，确定继续吗？'

  const action = await ElMessageBox.confirm(message, '删除分类', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    distinguishCancelAndClose: true,
    closeOnClickModal: false,
  }).catch((reason) => reason)

  if (action !== 'confirm') {
    return
  }

  categoryStore.deleteCategory(editingCategory.value.id)
  ElMessage.success('分类已删除')
  await router.replace('/settings')
}
</script>

<template>
  <section class="screen screen--scrollable">
    <BackPageHeader eyebrow="分类编辑" :title="dialogTitle" @back="goBack" />

    <el-card shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">分类信息</span>
            <h3>编辑或新增分类</h3>
          </div>
        </div>
      </template>

      <div class="dialog-grid">
        <el-input v-model="form.name" placeholder="分类名称" />

        <el-select v-model="form.type" placeholder="分类类型">
          <el-option label="支出" value="expense" />
          <el-option label="收入" value="income" />
        </el-select>

        <el-select
          v-model="form.parentId"
          placeholder="所属一级分类（留空即一级分类）"
          clearable
        >
          <el-option label="作为一级分类" value="" />
          <el-option
            v-for="category in availableParentOptions"
            :key="category.id"
            :label="`${category.icon} ${category.name}`"
            :value="category.id"
          />
        </el-select>

        <el-input v-model="form.icon" maxlength="2" placeholder="图标，例如 🧾" />

        <el-color-picker v-model="form.color" />
      </div>

      <div class="category-dialog__tips">
        <p v-if="form.parentId">当前将保存为二级分类，归属到：{{ currentParentLabel }}</p>
        <p v-else>当前将保存为一级分类。</p>
      </div>

      <template #footer>
        <div class="inline-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button v-if="isEditing" type="danger" plain @click="removeCategory">删除</el-button>
          <el-button type="primary" @click="submitCategory">{{ submitLabel }}</el-button>
        </div>
      </template>
    </el-card>
  </section>
</template>
