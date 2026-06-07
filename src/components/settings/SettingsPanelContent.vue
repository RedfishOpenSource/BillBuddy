<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { downloadTextFile } from '../../services/analytics/shareReportService'
import { applyBackupPayload, createBackupPayload, parseBackupPayload } from '../../services/db/backupService'
import { importWechatChatFile } from '../../services/ingest/wechatChatImportService'
import { shareFile } from '../../services/native/shareBridge'
import { useBillStore } from '../../stores/billStore'
import { useCategoryStore } from '../../stores/categoryStore'
import { useIngestStore } from '../../stores/ingestStore'

const billStore = useBillStore()
const categoryStore = useCategoryStore()
const ingestStore = useIngestStore()

const backupInputRef = ref<HTMLInputElement | null>(null)
const wechatChatInputRef = ref<HTMLInputElement | null>(null)

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

function triggerWechatChatImport(): void {
  wechatChatInputRef.value?.click()
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

async function importWechatChat(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    const content = await file.text()
    const result = importWechatChatFile(file.name, content)

    if (!result.bills.length) {
      ElMessage.warning('未识别到可导入的微信账单记录')
      return
    }

    billStore.saveBills(result.bills)
    billStore.hydrate()
    ElMessage.success(`已导入 ${result.bills.length} 条微信账单${result.skippedCount ? `，跳过 ${result.skippedCount} 条重复记录` : ''}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导入失败，请检查微信聊天记录文件')
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
          <el-button type="primary" plain @click="triggerWechatChatImport">导入微信聊天记录</el-button>
        </div>
        <input ref="backupInputRef" style="display: none" type="file" accept="application/json" @change="importBackup" />
        <input
          ref="wechatChatInputRef"
          style="display: none"
          type="file"
          accept=".txt,.csv,.html,.htm,text/plain,text/csv,text/html"
          @change="importWechatChat"
        />
      </div>
    </el-card>
  </div>
</template>
