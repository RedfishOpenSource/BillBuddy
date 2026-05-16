<script setup lang="ts">
import { EditPen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { downloadTextFile } from '../../services/analytics/shareReportService'
import { createBackupPayload, applyBackupPayload, parseBackupPayload } from '../../services/db/backupService'
import { shareFile } from '../../services/native/shareBridge'
import { useBillStore } from '../../stores/billStore'
import { useCategoryStore } from '../../stores/categoryStore'
import { useIngestStore } from '../../stores/ingestStore'
import type { CategoryType } from '../../types/category'

type EditableCategoryType = Exclude<CategoryType, 'transfer'>

interface CategoryFormState {
  id: string
  name: string
  type: EditableCategoryType
  icon: string
  color: string
}

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const ingestStore = useIngestStore()

const dialogVisible = ref(false)
const backupInputRef = ref<HTMLInputElement | null>(null)
const form = reactive<CategoryFormState>(createDefaultCategoryForm())

function createDefaultCategoryForm(): CategoryFormState {
  return {
    id: '',
    name: '',
    type: 'expense',
    icon: '🧾',
    color: '#8f96b3',
  }
}

function openEditDialog(categoryId: string): void {
  const category = categoryStore.getCategoryById(categoryId)
  if (!category) {
    return
  }

  Object.assign(form, category)
  dialogVisible.value = true
}

function submitCategory(): void {
  if (!form.name.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }

  categoryStore.saveCategory({ ...form, name: form.name.trim() })
  dialogVisible.value = false
  ElMessage.success('分类已保存')
}

function getCategoryTypeLabel(type: CategoryType): string {
  if (type === 'income') return '收入'
  return '支出'
}

function buildBackupFileName(): string {
  return `账单助手备份-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
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
</script>

<template>
  <div class="settings-drawer">
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
            <h3>收入 / 支出分类</h3>
          </div>
        </div>
      </template>
      <div class="category-list">
        <div v-for="category in categoryStore.sortedCategories" :key="category.id" class="category-item">
          <div class="category-item__main">
            <span class="category-item__icon" :style="{ background: `${category.color}22`, color: category.color }">
              {{ category.icon }}
            </span>
            <div>
              <strong>{{ category.name }}</strong>
              <small>{{ getCategoryTypeLabel(category.type) }}</small>
            </div>
          </div>
          <div class="category-item__actions">
            <el-button circle :icon="EditPen" @click="openEditDialog(category.id)" />
            <el-button text type="danger" @click="categoryStore.deleteCategory(category.id)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="分类设置" width="92%">
      <div class="dialog-grid">
        <el-input v-model="form.name" placeholder="分类名称" />
        <el-select v-model="form.type" placeholder="分类类型">
          <el-option label="支出" value="expense" />
          <el-option label="收入" value="income" />
        </el-select>
        <el-input v-model="form.icon" maxlength="2" placeholder="图标，例如 🍜" />
        <el-color-picker v-model="form.color" />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
