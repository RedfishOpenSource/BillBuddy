<script setup lang="ts">
import {
  Bell,
  Camera,
  DataAnalysis,
  EditPen,
  HomeFilled,
  Microphone,
  Money,
  Picture,
  Plus,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsPanelContent from '../components/settings/SettingsPanelContent.vue'
import { buildVoiceBillDraft } from '../services/entry/voiceBillDraftService'
import { setPendingNewBillDraft, type PendingNewBillDraft } from '../services/entry/newBillDraftSession'
import { createBillImagesFromFiles, createBillVideosFromFiles } from '../services/native/billImageService'
import {
  captureBillPhoto,
  captureBillVideo,
  isBillEntryAvailable,
  pickBillImages,
  recognizeBillSpeech,
} from '../services/native/entryBridge'
import { useCategoryStore } from '../stores/categoryStore'

type AppTab = {
  label: string
  path: string
  icon: Component
}

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

const tabs: AppTab[] = [
  { label: '总览', path: '/home', icon: HomeFilled },
  { label: '账单', path: '/bills', icon: Money },
  { label: '统计', path: '/stats', icon: DataAnalysis },
  { label: '待确认', path: '/inbox', icon: Bell },
]

const leftTabs = tabs.slice(0, 2)
const rightTabs = tabs.slice(2)

const entryDrawerVisible = ref(false)
const settingsDrawerVisible = ref(false)
const handlingEntry = ref(false)
const handlingSpeech = ref(false)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)

const cameraLongPressDelay = 520
const settingsSwipeThreshold = 56
const settingsSwipeEdge = 24
const swipeVerticalTolerance = 36

let cameraPressStartedAt = 0
let activeCameraPointerId: number | null = null
let shellTouchStartX = 0
let shellTouchStartY = 0
let settingsTouchStartX = 0
let settingsTouchStartY = 0

const activeTabPath = computed(function (): string {
  const matchedTab = tabs.find(function (tab) {
    return route.path.startsWith(tab.path)
  })

  return matchedTab?.path ?? ''
})

const isOverviewRoute = computed(function (): boolean {
  return activeTabPath.value === '/home'
})

const entryBusy = computed(function (): boolean {
  return handlingEntry.value || handlingSpeech.value
})

watch(
  () => route.query.drawer,
  (drawer) => {
    if (drawer !== 'settings') {
      return
    }

    settingsDrawerVisible.value = true
    const nextQuery = { ...route.query }
    delete nextQuery.drawer
    void router.replace({ path: route.path, query: nextQuery })
  },
  { immediate: true },
)

function navigateTo(path: string): void {
  closeSettingsDrawer()
  void router.push(path)
}

function openEntryDrawer(): void {
  entryDrawerVisible.value = true
}

function closeEntryDrawer(): void {
  entryDrawerVisible.value = false
  resetCameraPress()
}

function openSettingsDrawer(): void {
  settingsDrawerVisible.value = true
}

function closeSettingsDrawer(): void {
  settingsDrawerVisible.value = false
}

function handleShellTouchStart(event: TouchEvent): void {
  if (isOverviewRoute.value || !event.touches.length) {
    return
  }

  const touch = event.touches[0]
  shellTouchStartX = touch.clientX
  shellTouchStartY = touch.clientY
}

function handleShellTouchEnd(event: TouchEvent): void {
  if (isOverviewRoute.value || settingsDrawerVisible.value || !event.changedTouches.length) {
    return
  }

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - shellTouchStartX
  const deltaY = Math.abs(touch.clientY - shellTouchStartY)

  if (shellTouchStartX > settingsSwipeEdge) {
    return
  }

  if (deltaX >= settingsSwipeThreshold && deltaY <= swipeVerticalTolerance && deltaX > deltaY) {
    openSettingsDrawer()
  }
}

function handleSettingsTouchStart(event: TouchEvent): void {
  if (!event.touches.length) {
    return
  }

  const touch = event.touches[0]
  settingsTouchStartX = touch.clientX
  settingsTouchStartY = touch.clientY
}

function handleSettingsTouchEnd(event: TouchEvent): void {
  if (!settingsDrawerVisible.value || !event.changedTouches.length) {
    return
  }

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - settingsTouchStartX
  const deltaY = Math.abs(touch.clientY - settingsTouchStartY)

  if (deltaX <= -settingsSwipeThreshold && deltaY <= swipeVerticalTolerance) {
    closeSettingsDrawer()
  }
}

function resetCameraPress(): void {
  cameraPressStartedAt = 0
  activeCameraPointerId = null
}

async function openNewBillWithDraft(draft: PendingNewBillDraft): Promise<void> {
  setPendingNewBillDraft(draft)
  closeEntryDrawer()
  await router.push({
    name: 'bill-new',
    query: { draft: `${Date.now()}` },
  })
}

async function handleWriteText(): Promise<void> {
  await openNewBillWithDraft(createDraft('text'))
}

function createDraft(
  mode: PendingNewBillDraft['mode'],
  overrides: Omit<Partial<PendingNewBillDraft>, 'mode'> = {},
): PendingNewBillDraft {
  return {
    mode,
    source: 'manual',
    images: [],
    videos: [],
    ...overrides,
  }
}

function triggerInput(inputRef: { value: HTMLInputElement | null }): void {
  closeEntryDrawer()
  inputRef.value?.click()
}

async function handleGalleryEntry(): Promise<void> {
  if (handlingEntry.value) {
    return
  }

  handlingEntry.value = true
  try {
    if (isBillEntryAvailable()) {
      const images = await pickBillImages()
      if (!images?.length) {
        return
      }

      await openNewBillWithDraft(createDraft('gallery', { images }))
      return
    }

    triggerInput(galleryInputRef)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '打开相册失败，请稍后重试')
  } finally {
    handlingEntry.value = false
  }
}

async function handlePhotoEntry(): Promise<void> {
  if (handlingEntry.value) {
    return
  }

  handlingEntry.value = true
  try {
    if (isBillEntryAvailable()) {
      const image = await captureBillPhoto()
      if (!image) {
        return
      }

      await openNewBillWithDraft(createDraft('camera', { images: [image] }))
      return
    }

    triggerInput(photoInputRef)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '拍照失败，请稍后重试')
  } finally {
    handlingEntry.value = false
  }
}

async function handleVideoEntry(): Promise<void> {
  if (handlingEntry.value) {
    return
  }

  handlingEntry.value = true
  try {
    if (isBillEntryAvailable()) {
      const video = await captureBillVideo()
      if (!video) {
        return
      }

      await openNewBillWithDraft(createDraft('video', { videos: [video] }))
      return
    }

    triggerInput(videoInputRef)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '录制视频失败，请稍后重试')
  } finally {
    handlingEntry.value = false
  }
}

async function handleAiEntry(): Promise<void> {
  if (handlingSpeech.value) {
    return
  }

  if (!isBillEntryAvailable()) {
    ElMessage.warning('当前设备暂不支持 AI 语音录入')
    return
  }

  handlingSpeech.value = true
  try {
    const text = await recognizeBillSpeech('请说出账单内容，例如午餐 36 元 今天支付')
    if (!text) {
      return
    }

    await openNewBillWithDraft(buildVoiceBillDraft(text, categoryStore.sortedCategories))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '语音识别失败，请稍后重试')
  } finally {
    handlingSpeech.value = false
  }
}

function handleCameraPressStart(event: PointerEvent): void {
  if (entryBusy.value) {
    return
  }

  activeCameraPointerId = event.pointerId
  cameraPressStartedAt = Date.now()
}

async function handleCameraPressEnd(event: PointerEvent): Promise<void> {
  if (activeCameraPointerId !== event.pointerId || !cameraPressStartedAt) {
    return
  }

  const pressDuration = Date.now() - cameraPressStartedAt
  resetCameraPress()

  if (pressDuration >= cameraLongPressDelay) {
    await handleVideoEntry()
    return
  }

  await handlePhotoEntry()
}

function handleCameraPressCancel(): void {
  resetCameraPress()
}

async function handleGalleryInputChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) {
    return
  }

  handlingEntry.value = true
  try {
    const images = await createBillImagesFromFiles(files)
    if (!images.length) {
      return
    }

    await openNewBillWithDraft(createDraft('gallery', { images }))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '读取图片失败，请稍后重试')
  } finally {
    input.value = ''
    handlingEntry.value = false
  }
}

async function handlePhotoInputChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) {
    return
  }

  handlingEntry.value = true
  try {
    const images = await createBillImagesFromFiles(files)
    if (!images.length) {
      return
    }

    await openNewBillWithDraft(createDraft('camera', { images: [images[0]] }))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '拍照失败，请稍后重试')
  } finally {
    input.value = ''
    handlingEntry.value = false
  }
}

async function handleVideoInputChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) {
    return
  }

  handlingEntry.value = true
  try {
    const videos = await createBillVideosFromFiles(files)
    if (!videos.length) {
      return
    }

    await openNewBillWithDraft(createDraft('video', { videos: [videos[0]] }))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '读取视频失败，请稍后重试')
  } finally {
    input.value = ''
    handlingEntry.value = false
  }
}
</script>

<template>
  <div class="app-shell" @touchstart.passive="handleShellTouchStart" @touchend.passive="handleShellTouchEnd">
    <main class="app-shell__body" :class="{ 'app-shell__body--locked': isOverviewRoute }">
      <router-view />
    </main>

    <el-drawer
      v-model="settingsDrawerVisible"
      class="settings-drawer-panel"
      direction="ltr"
      size="88%"
      append-to-body
      :with-header="false"
      :show-close="false"
      :close-on-click-modal="true"
      @closed="closeSettingsDrawer"
    >
      <div class="settings-drawer" @touchstart.passive="handleSettingsTouchStart" @touchend.passive="handleSettingsTouchEnd">
        <SettingsPanelContent />
      </div>
    </el-drawer>

    <el-card shadow="never" class="tabbar">
      <div class="tabbar__grid" aria-label="主导航">
        <div class="tabbar__group tabbar__group--left">
          <el-button
            v-for="tab in leftTabs"
            :key="tab.path"
            class="tabbar__item"
            :class="{ 'is-active': activeTabPath === tab.path }"
            text
            :aria-current="activeTabPath === tab.path ? 'page' : undefined"
            @click="navigateTo(tab.path)"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </el-button>
        </div>

        <el-button class="tabbar__add" type="primary" circle aria-label="新增账单" @click="openEntryDrawer">
          <el-icon><Plus /></el-icon>
        </el-button>

        <div class="tabbar__group tabbar__group--right">
          <el-button
            v-for="tab in rightTabs"
            :key="tab.path"
            class="tabbar__item"
            :class="{ 'is-active': activeTabPath === tab.path }"
            text
            :aria-current="activeTabPath === tab.path ? 'page' : undefined"
            @click="navigateTo(tab.path)"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </el-button>
        </div>
      </div>
    </el-card>

    <input ref="galleryInputRef" style="display: none" type="file" accept="image/*" multiple @change="handleGalleryInputChange" />
    <input ref="photoInputRef" style="display: none" type="file" accept="image/*" capture="environment" @change="handlePhotoInputChange" />
    <input ref="videoInputRef" style="display: none" type="file" accept="video/*" capture="environment" @change="handleVideoInputChange" />

    <el-drawer v-model="entryDrawerVisible" direction="btt" size="auto" :with-header="false" append-to-body>
      <div class="action-sheet entry-sheet">
        <div class="action-sheet__header">
          <span class="eyebrow">新增方式</span>
          <h3>选择录入入口</h3>
        </div>
        <div class="entry-sheet__grid">
          <button type="button" class="entry-sheet__button" :disabled="entryBusy" @click="handleGalleryEntry">
            <span class="entry-sheet__icon"><el-icon><Picture /></el-icon></span>
            <strong>从相册选择</strong>
            <span>把选中的图片直接带入商品照片字段</span>
          </button>

          <button
            type="button"
            class="entry-sheet__button"
            :disabled="entryBusy"
            @pointerdown.prevent="handleCameraPressStart"
            @pointerup.prevent="handleCameraPressEnd"
            @pointercancel.prevent="handleCameraPressCancel"
            @pointerleave.prevent="handleCameraPressCancel"
            @keydown.enter.prevent="handlePhotoEntry"
            @keydown.space.prevent="handlePhotoEntry"
          >
            <span class="entry-sheet__icon"><el-icon><Camera /></el-icon></span>
            <strong>相机</strong>
            <small>短按拍照，长按摄像，直接带入表单</small>
          </button>

          <button type="button" class="entry-sheet__button" :disabled="entryBusy" @click="handleWriteText">
            <span class="entry-sheet__icon"><el-icon><EditPen /></el-icon></span>
            <strong>写文字</strong>
            <span>直接打开新建表单手动填写</span>
          </button>

          <button type="button" class="entry-sheet__button" :disabled="entryBusy" @click="handleAiEntry">
            <span class="entry-sheet__icon"><el-icon><Microphone /></el-icon></span>
            <strong>AI 录入</strong>
            <span>本地语音转文字后离线回填账单字段</span>
          </button>
        </div>
        <el-button class="share-target-sheet__cancel" @click="closeEntryDrawer">取消</el-button>
      </div>
    </el-drawer>
  </div>
</template>
