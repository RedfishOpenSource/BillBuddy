<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { downloadTextFile } from '../../services/analytics/shareReportService'
import { applyBackupPayload, createBackupPayload, parseBackupPayload } from '../../services/db/backupService'
import { shareFile } from '../../services/native/shareBridge'
import { useBillStore } from '../../stores/billStore'
import { useCategoryStore } from '../../stores/categoryStore'
import { useIngestStore } from '../../stores/ingestStore'
import { createTopLevelCategoryGroups } from '../../utils/category'

const router = useRouter()
const billStore = useBillStore()
const categoryStore = useCategoryStore()
const ingestStore = useIngestStore()

const backupInputRef = ref<HTMLInputElement | null>(null)
const selectedTopCategoryId = ref('')

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

const topCategoryGroups = computed(() => createTopLevelCategoryGroups(categoryStore.sortedCategories))
const selectedTopCategoryGroup = computed(
  () => topCategoryGroups.value.find((group) => group.category.id === selectedTopCategoryId.value) ?? topCategoryGroups.value[0] ?? null,
)
const selectedChildren = computed(() => selectedTopCategoryGroup.value?.children ?? [])

function ensureSelectedTopCategory(): void {
  const groups = topCategoryGroups.value

  if (!groups.length) {
    selectedTopCategoryId.value = ''
    return
  }

  if (!groups.some((group) => group.category.id === selectedTopCategoryId.value)) {
    selectedTopCategoryId.value = groups[0].category.id
  }
}

function selectTopCategory(categoryId: string): void {
  selectedTopCategoryId.value = categoryId
}

function openCategoryEditor(categoryId: string): void {
  void router.push(`/settings/category/${categoryId}`)
}

function openCreateTopCategory(): void {
  void router.push('/settings/category/new')
}

function openCreateChildCategory(): void {
  const topCategory = selectedTopCategoryGroup.value?.category

  if (!topCategory) {
    ElMessage.warning('请先选择一级分类')
    return
  }

  void router.push({
    path: '/settings/category/new',
    query: {
      type: topCategory.type,
      parentId: topCategory.id,
    },
  })
}

watch(
  () => categoryStore.sortedCategories,
  () => {
    ensureSelectedTopCategory()
  },
  { deep: true, immediate: true },
)

function buildBackupFileName(): string {
  return `BillBuddy-备份-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
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
  let shared = null

  try {
    shared = await shareFile({
      fileName,
      textContent: content,
      mimeType: 'application/json',
      title: '导出 BillBuddy 备份',
    })
  } catch (error) {
    downloadTextFile(fileName, content, 'application/json')
    ElMessage.warning(error instanceof Error ? `${error.message}，已导出备份文件` : '系统分享失败，已导出备份文件')
    return
  }

  if (shared) {
    ElMessage.success('已打开系统分享，可保存或发送备份文件')
    return
  }

  downloadTextFile(fileName, content, 'application/json')
  ElMessage.success('当前环境不支持系统分享，已导出备份文件')
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
            <h3>两行分类管理</h3>
          </div>
        </div>
      </template>

      <div class="settings-category-manager">
        <section class="settings-category-row">
          <div class="section-title-row">
            <div>
              <span class="eyebrow">一级分类</span>
              <h3>全部一级分类</h3>
            </div>
            <el-button plain :icon="Plus" @click="openCreateTopCategory">新增</el-button>
          </div>

          <div class="category-scroll-row">
            <button
              v-for="group in topCategoryGroups"
              :key="group.category.id"
              type="button"
              class="category-pill"
              :class="{ 'is-active': selectedTopCategoryGroup?.category.id === group.category.id }"
              @click="selectTopCategory(group.category.id)"
              @dblclick="openCategoryEditor(group.category.id)"
            >
              <span class="category-pill__icon">{{ group.category.icon }}</span>
              <span>{{ group.category.name }}</span>
            </button>
          </div>
          <p class="bill-form__image-hint">双击分类即可进入编辑。</p>
        </section>

        <section class="settings-category-row">
          <div class="section-title-row">
            <div>
              <span class="eyebrow">二级分类</span>
              <h3>{{ selectedTopCategoryGroup ? `${selectedTopCategoryGroup.category.name} 的二级分类` : '选择一级分类后查看' }}</h3>
            </div>
            <el-button plain type="primary" :icon="Plus" :disabled="!selectedTopCategoryGroup" @click="openCreateChildCategory">
              新增
            </el-button>
          </div>

          <div class="category-scroll-row category-scroll-row--secondary">
            <button
              v-for="child in selectedChildren"
              :key="child.id"
              type="button"
              class="category-pill category-pill--secondary"
              @dblclick="openCategoryEditor(child.id)"
            >
              <span class="category-pill__icon">{{ child.icon }}</span>
              <span>{{ child.name }}</span>
            </button>
            <span v-if="selectedTopCategoryGroup && !selectedChildren.length" class="bill-toolbar-meta__count">
              当前一级分类下还没有二级分类
            </span>
          </div>
        </section>
      </div>
    </el-card>
  </div>
</template>
