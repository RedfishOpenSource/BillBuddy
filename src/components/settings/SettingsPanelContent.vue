<script setup lang="ts">
import { EditPen, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { downloadTextFile } from '../../services/analytics/shareReportService'
import { applyBackupPayload, createBackupPayload, parseBackupPayload } from '../../services/db/backupService'
import { shareFile } from '../../services/native/shareBridge'
import { useBillStore } from '../../stores/billStore'
import { useCategoryStore } from '../../stores/categoryStore'
import { useIngestStore } from '../../stores/ingestStore'
import type { Category, CategoryType } from '../../types/category'
import { buildCategoryTree, getCategoryDisplayName, getCategoryTypeGroupLabel } from '../../utils/category'

interface CategoryFormState {
  id: string
  name: string
  type: CategoryType
  parentId: string
  icon: string
  color: string
}

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const ingestStore = useIngestStore()

const dialogVisible = ref(false)
const dialogParentRequired = ref(false)
const backupInputRef = ref<HTMLInputElement | null>(null)
const form = reactive<CategoryFormState>(createDefaultCategoryForm())

const listenerStatus = computed(() => {
  if (!ingestStore.listenerAvailable) {
    return {
      className: 'is-warning',
      label: '当前设备不支持',
    }
  }

  return ingestStore.listenerEnabled
    ? {
        className: 'is-success',
        label: '已开启',
      }
    : {
        className: 'is-warning',
        label: '未开启',
      }
})

const listenerActionLabel = computed(() =>
  ingestStore.listenerEnabled ? '重新打开通知访问设置' : '打开通知访问设置',
)

const categorySections = computed(() =>
  (['expense', 'income'] satisfies CategoryType[]).map((type) => ({
    type,
    label: getCategoryTypeGroupLabel(type),
    groups: buildCategoryTree(categoryStore.sortedCategories, type),
  })),
)

const availableParentOptions = computed(() =>
  buildCategoryTree(categoryStore.sortedCategories, form.type)
    .map((item) => item.category)
    .filter((category) => category.id !== form.id),
)

const currentCategoryChildrenCount = computed(() =>
  categoryStore.sortedCategories.filter((category) => category.parentId === form.id).length,
)

const canChooseParent = computed(() => currentCategoryChildrenCount.value === 0)
const dialogTitle = computed(() => {
  if (form.id) {
    return '编辑分类'
  }

  return dialogParentRequired.value ? '新增二级分类' : '新增分类'
})

const currentParentLabel = computed(() =>
  getCategoryDisplayName(form.parentId, categoryStore.sortedCategories),
)

function createDefaultCategoryForm(type: CategoryType = 'expense'): CategoryFormState {
  return {
    id: '',
    name: '',
    type,
    parentId: '',
    icon: '🧾',
    color: type === 'income' ? '#34c759' : '#8f96b3',
  }
}

function resetForm(type: CategoryType = 'expense', requireParent = false): void {
  Object.assign(form, createDefaultCategoryForm(type))
  dialogParentRequired.value = requireParent
}

function openCreateDialog(type: CategoryType, requireParent = false): void {
  resetForm(type, requireParent)
  dialogVisible.value = true
}

function openEditDialog(category: Category): void {
  Object.assign(form, {
    id: category.id,
    name: category.name,
    type: category.type,
    parentId: category.parentId ?? '',
    icon: category.icon,
    color: category.color,
  })
  dialogParentRequired.value = Boolean(category.parentId)
  dialogVisible.value = true
}

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

function getCategoryTypeLabel(type: CategoryType): string {
  return type === 'income' ? '收入' : '支出'
}

function getCategoryLevelLabel(category: Category): string {
  return category.parentId ? '二级分类' : '一级分类'
}

function buildBackupFileName(): string {
  return `账单助手备份-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
}

onMounted(() => {
  void ingestStore.refreshListenerStatus()
})

async function openNotificationListenerSettings(): Promise<void> {
  await ingestStore.openListenerSettings()
}

async function exportBackup(): Promise<void> {
  const payload = await createBackupPayload()
  const fileName = buildBackupFileName()
  const content = JSON.stringify(payload, null, 2)
  const shared = await shareFile({
    fileName,
    textContent: content,
    mimeType: 'application/json',
    title: '导出账单助手备份',
  })

  if (shared) {
    ElMessage.success('已打开系统分享，可保存或发送备份文件')
    return
  }

  downloadTextFile(fileName, content, 'application/json')
  ElMessage.success('备份文件已导出')
}

function triggerImport(): void {
  backupInputRef.value?.click()
}

async function importBackup(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    const content = await file.text()
    const payload = parseBackupPayload(content)
    applyBackupPayload(payload)
    categoryStore.hydrate()
    billStore.hydrate()
    ingestStore.hydrate()
    ElMessage.success('备份已导入')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导入失败，请检查备份文件')
  } finally {
    input.value = ''
  }
}

function submitCategory(): void {
  if (!form.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }

  if (dialogParentRequired.value && !form.parentId) {
    ElMessage.warning('请选择所属一级分类')
    return
  }

  if (form.parentId && !canChooseParent.value && !categoryStore.getCategoryById(form.parentId)?.parentId) {
    ElMessage.warning('当前一级分类下已有二级分类，不能再调整层级')
    return
  }

  try {
    categoryStore.saveCategory({
      id: form.id || undefined,
      name: form.name.trim(),
      type: form.type,
      parentId: form.parentId || undefined,
      icon: form.icon.trim() || '🧾',
      color: form.color,
    })
    dialogVisible.value = false
    ElMessage.success('分类已保存')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '分类保存失败')
  }
}

async function removeCategory(category: Category): Promise<void> {
  const childCount = categoryStore.sortedCategories.filter((item) => item.parentId === category.id).length
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

  categoryStore.deleteCategory(category.id)
  ElMessage.success('分类已删除')
}
</script>

<template>
  <div class="settings-drawer">
    <el-card shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">通知导入</span>
            <h3>支付宝 / 微信通知监听</h3>
          </div>
          <span class="metric-badge" :class="listenerStatus.className">{{ listenerStatus.label }}</span>
        </div>
      </template>
      <div class="settings-card">
        <p>开启后仅监听微信和支付宝中的支付、收款、转账类通知，并把新记录自动导入待确认列表。</p>
        <p>Android 系统设置里通常只会显示 BillBuddy，开启后应用内部会自动识别微信与支付宝的支付账单通知。</p>
        <div class="settings-actions">
          <el-button :disabled="!ingestStore.listenerAvailable" @click="openNotificationListenerSettings">
            {{ listenerActionLabel }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">数据备份</span>
            <h3>导入与导出</h3>
          </div>
        </div>
      </template>
      <div class="settings-card">
        <p>支持导出当前账单、分类和通知记录，也支持从备份文件恢复。</p>
        <div class="settings-actions">
          <el-button @click="exportBackup">导出备份</el-button>
          <el-button @click="triggerImport">导入备份</el-button>
        </div>
        <input ref="backupInputRef" style="display: none" type="file" accept="application/json" @change="importBackup" />
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="section-title-row">
          <div>
            <span class="eyebrow">分类管理</span>
            <h3>一级 / 二级分类</h3>
          </div>
        </div>
      </template>

      <div class="category-settings">
        <section v-for="section in categorySections" :key="section.type" class="category-section">
          <div class="section-title-row">
            <div>
              <span class="eyebrow">{{ section.type === 'income' ? '金额来源' : '金额去向' }}</span>
              <h3>{{ section.label }}</h3>
            </div>
            <div class="category-section__actions">
              <el-button plain :icon="Plus" @click="openCreateDialog(section.type)">新增一级分类</el-button>
              <el-button type="primary" plain :icon="Plus" @click="openCreateDialog(section.type, true)">新增二级分类</el-button>
            </div>
          </div>

          <div class="category-tree">
            <div v-for="group in section.groups" :key="group.category.id" class="category-group">
              <div class="category-item category-item--parent">
                <div class="category-item__main">
                  <span class="category-item__icon" :style="{ background: `${group.category.color}22`, color: group.category.color }">
                    {{ group.category.icon }}
                  </span>
                  <div>
                    <strong>{{ group.category.name }}</strong>
                    <small>{{ getCategoryLevelLabel(group.category) }} · {{ getCategoryTypeLabel(group.category.type) }}</small>
                  </div>
                </div>
                <div class="category-item__actions">
                  <el-button circle :icon="EditPen" @click="openEditDialog(group.category)" />
                  <el-button text type="danger" @click="removeCategory(group.category)">删除</el-button>
                </div>
              </div>

              <div v-if="group.children.length" class="category-children">
                <div v-for="child in group.children" :key="child.id" class="category-item category-item--child">
                  <div class="category-item__main">
                    <span class="category-item__icon" :style="{ background: `${child.color}22`, color: child.color }">
                      {{ child.icon }}
                    </span>
                    <div>
                      <strong>{{ child.name }}</strong>
                      <small>{{ getCategoryLevelLabel(child) }} · {{ getCategoryDisplayName(child.parentId, categoryStore.sortedCategories) }}</small>
                    </div>
                  </div>
                  <div class="category-item__actions">
                    <el-button circle :icon="EditPen" @click="openEditDialog(child)" />
                    <el-button text type="danger" @click="removeCategory(child)">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="92%">
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
          :disabled="!canChooseParent && !form.parentId"
        >
          <el-option label="作为一级分类" value="" />
          <el-option v-for="category in availableParentOptions" :key="category.id" :label="`${category.icon} ${category.name}`" :value="category.id" />
        </el-select>

        <el-input v-model="form.icon" maxlength="2" placeholder="图标，例如 🍜" />

        <el-color-picker v-model="form.color" />
      </div>

      <div class="category-dialog__tips">
        <p v-if="dialogParentRequired && !form.parentId">当前操作会创建二级分类，请先选择所属一级分类。</p>
        <p v-if="form.parentId">当前将保存为二级分类，归属到：{{ currentParentLabel }}</p>
        <p v-if="!canChooseParent && !form.parentId">当前一级分类下已有二级分类，不能再调整为其他一级分类的子类。</p>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
