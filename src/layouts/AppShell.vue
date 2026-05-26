<script setup lang="ts">
import {
  Bell,
  Camera,
  DataAnalysis,
  EditPen,
  HomeFilled,
  Money,
  Picture,
  Plus,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setPendingNewBillDraft, type PendingNewBillDraft } from '../services/entry/newBillDraftSession'
import { createBillImagesFromFiles, createBillVideosFromFiles } from '../services/native/billImageService'
import {
  captureBillPhoto,
  captureBillVideo,
  isBillEntryAvailable,
  pickBillImages,
} from '../services/native/entryBridge'

type AppTab = {
  label: string
  path: string
  icon: Component
}

const route = useRoute()
const router = useRouter()

const tabs: AppTab[] = [
  { label: '总览', path: '/home', icon: HomeFilled },
  { label: '账单', path: '/bills', icon: Money },
  { label: '统计', path: '/stats', icon: DataAnalysis },
  { label: '待确认', path: '/inbox', icon: Bell },
]

const leftTabs = tabs.slice(0, 2)
const rightTabs = tabs.slice(2)

const entryDrawerVisible = ref(false)
const handlingEntry = ref(false)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)

const cameraLongPressDelay = 520

let cameraPressStartedAt = 0
let activeCameraPointerId: number | null = null

const activeTabPath = computed(() => {
  const matchedTab = tabs.find((tab) => route.path.startsWith(tab.path))
  return matchedTab?.path ?? ''
})

const isOverviewRoute = computed(() => activeTabPath.value === '/home')
const entryBusy = computed(() => handlingEntry.value)

function navigateTo(path: string): void {
  void router.push(path)
}

function openEntryDrawer(): void {
  entryDrawerVisible.value = true
}

function closeEntryDrawer(): void {
  entryDrawerVisible.value = false
  resetCameraPress()
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
  <div class="app-shell">
    <main class="app-shell__body" :class="{ 'app-shell__body--locked': isOverviewRoute }">
      <router-view />
    </main>

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
            <span>把选中的图片直接带入表单</span>
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
            <small>短按拍照，长按录像，直接带入表单</small>
          </button>

          <button type="button" class="entry-sheet__button" :disabled="entryBusy" @click="handleWriteText">
            <span class="entry-sheet__icon"><el-icon><EditPen /></el-icon></span>
            <strong>手动填写</strong>
            <span>直接打开新建表单手动录入</span>
          </button>
        </div>
        <el-button class="share-target-sheet__cancel" @click="closeEntryDrawer">取消</el-button>
      </div>
    </el-drawer>
  </div>
</template>
