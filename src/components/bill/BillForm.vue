<script setup lang="ts">
import { Camera, Delete, Picture, Plus, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { createBillImagesFromFiles, createBillVideosFromFiles } from '../../services/native/billImageService'
import type { BillFormPayload } from '../../stores/billStore'
import type { BillSource, BillVideo } from '../../types/bill'
import type { Category } from '../../types/category'
import { resolveBillImageSrc, resolveBillVideoSrc } from '../../utils/billPresentation'
import { createTopLevelCategoryGroups, getCategoryDisplayName } from '../../utils/category'

const imageLimit = 6
const videoLimit = 1

function createFormState(value: BillFormPayload): BillFormPayload {
  return {
    ...value,
    images: [...(value.images ?? [])],
    videos: [...(value.videos ?? [])],
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
const cameraInputRef = ref<HTMLInputElement | null>(null)
const galleryInputRef = ref<HTMLInputElement | null>(null)
const videoInputRef = ref<HTMLInputElement | null>(null)
const pickerVisible = ref(false)
const pickingImages = ref(false)
const pickingVideos = ref(false)
const selectedTopCategoryId = ref('')
const form = reactive<BillFormPayload>(createFormState(props.initialValue))

const topCategoryGroups = computed(() => createTopLevelCategoryGroups(props.categories))
const selectedTopCategory = computed(
  () => topCategoryGroups.value.find((group) => group.category.id === selectedTopCategoryId.value) ?? null,
)
const categoryOptions = computed(() => {
  if (!selectedTopCategory.value) {
    return []
  }

  return [selectedTopCategory.value.category, ...selectedTopCategory.value.children]
})
const sourceOptions: Array<{ label: string; value: BillSource }> = [
  { label: '手动', value: 'manual' },
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
]

watch(
  () => props.initialValue,
  (value) => {
    Object.assign(form, createFormState(value))
    syncSelectedTopCategory(value.categoryId)
  },
  { deep: true, immediate: true },
)

watch(
  () => props.categories,
  () => {
    syncSelectedTopCategory(form.categoryId)
  },
  { deep: true, immediate: true },
)

watch(selectedTopCategoryId, (topCategoryId) => {
  if (!topCategoryId) {
    return
  }

  const group = topCategoryGroups.value.find((item) => item.category.id === topCategoryId)
  if (!group) {
    return
  }

  const current = props.categories.find((category) => category.id === form.categoryId)
  const belongsToGroup = current
    ? current.id === group.category.id || current.parentId === group.category.id
    : false

  if (!belongsToGroup) {
    form.categoryId = group.category.id
  }
})

const rules: FormRules<BillFormPayload> = {
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  billDate: [{ required: true, message: '请选择账单日期', trigger: 'change' }],
}

const imagePreviewList = computed(() => form.images.map((image) => resolveBillImageSrc(image)))
const remainingImageCount = computed(() => Math.max(imageLimit - form.images.length, 0))
const remainingVideoCount = computed(() => Math.max(videoLimit - (form.videos?.length ?? 0), 0))

function syncSelectedTopCategory(categoryId: string): void {
  const current = props.categories.find((category) => category.id === categoryId)
  const topCategoryId = current?.parentId ?? current?.id ?? topCategoryGroups.value[0]?.category.id ?? ''
  selectedTopCategoryId.value = topCategoryId
}

function removeImage(imageId: string): void {
  const index = form.images.findIndex((image) => image.id === imageId)
  if (index >= 0) {
    form.images.splice(index, 1)
  }
}

function removeVideo(videoId: string): void {
  if (!form.videos?.length) {
    return
  }

  const index = form.videos.findIndex((video) => video.id === videoId)
  if (index >= 0) {
    form.videos.splice(index, 1)
  }
}

function appendImages(images: BillFormPayload['images']): void {
  if (!images.length) {
    return
  }

  if (!remainingImageCount.value) {
    ElMessage.warning(`最多上传 ${imageLimit} 张图片`)
    return
  }

  const acceptedImages = images.slice(0, remainingImageCount.value)
  form.images.push(...acceptedImages)

  if (acceptedImages.length < images.length) {
    ElMessage.warning(`最多上传 ${imageLimit} 张图片，已自动保留前 ${acceptedImages.length} 张`)
  }
}

function appendVideos(videos: BillVideo[]): void {
  if (!videos.length) {
    return
  }

  if (!remainingVideoCount.value) {
    ElMessage.warning(`最多上传 ${videoLimit} 段视频`)
    return
  }

  const acceptedVideos = videos.slice(0, remainingVideoCount.value)
  form.videos = [...(form.videos ?? []), ...acceptedVideos]

  if (acceptedVideos.length < videos.length) {
    ElMessage.warning(`最多上传 ${videoLimit} 段视频，已自动保留前 ${acceptedVideos.length} 段`)
  }
}

function openPicker(inputRef: { value: HTMLInputElement | null }): void {
  pickerVisible.value = false
  inputRef.value?.click()
}

function openCameraPicker(): void {
  openPicker(cameraInputRef)
}

function openGalleryPicker(): void {
  openPicker(galleryInputRef)
}

function openVideoPicker(): void {
  videoInputRef.value?.click()
}

function selectTopCategory(categoryId: string): void {
  selectedTopCategoryId.value = categoryId
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) {
    return
  }

  pickingImages.value = true
  try {
    const images = await createBillImagesFromFiles(files)
    appendImages(images)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '读取图片失败，请稍后重试')
  } finally {
    input.value = ''
    pickingImages.value = false
  }
}

async function handleVideoChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) {
    return
  }

  pickingVideos.value = true
  try {
    const videos = await createBillVideosFromFiles(files)
    appendVideos(videos)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '读取视频失败，请稍后重试')
  } finally {
    input.value = ''
    pickingVideos.value = false
  }
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  emit('submit', {
    ...form,
    images: [...form.images],
    videos: [...(form.videos ?? [])],
    amount: Number(form.amount),
  })
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" class="bill-form">
    <div class="bill-form__grid">
      <el-form-item label="来源">
        <el-segmented v-model="form.source" :options="sourceOptions" />
      </el-form-item>

      <el-form-item label="分类" prop="categoryId">
        <div class="bill-form__category-picker">
          <div class="bill-form__category-tabs">
            <el-button
              v-for="group in topCategoryGroups"
              :key="group.category.id"
              plain
              :class="{ 'is-active': selectedTopCategoryId === group.category.id }"
              @click="selectTopCategory(group.category.id)"
            >
              {{ group.category.icon }} {{ group.category.name }}
            </el-button>
          </div>
          <el-select v-model="form.categoryId" placeholder="选择分类" filterable>
            <el-option
              v-for="option in categoryOptions"
              :key="option.id"
              :label="getCategoryDisplayName(option, props.categories)"
              :value="option.id"
            />
          </el-select>
        </div>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" />
      </el-form-item>

      <el-form-item label="账单编号">
        <el-input v-model="form.billNo" placeholder="可留空" />
      </el-form-item>

      <el-form-item label="账单日期" prop="billDate">
        <el-date-picker v-model="form.billDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
      </el-form-item>

      <el-form-item label="补充描述" class="is-span-2">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="可写入门店、场景、备注等信息" />
      </el-form-item>

      <el-form-item label="票据图片" class="is-span-2">
        <div class="bill-form__image-panel">
          <div class="bill-form__image-toolbar">
            <el-button type="primary" plain :icon="Plus" @click="pickerVisible = true">添加图片</el-button>
            <span class="bill-form__image-hint">已添加 {{ form.images.length }} / {{ imageLimit }} 张</span>
          </div>

          <div v-if="form.images.length" class="bill-form__image-grid">
            <div v-for="(image, index) in form.images" :key="image.id" class="bill-form__image-card">
              <el-image
                :src="resolveBillImageSrc(image)"
                :preview-src-list="imagePreviewList"
                :initial-index="index"
                fit="cover"
                class="bill-form__image"
                preview-teleported
              />
              <button type="button" class="bill-form__image-remove" @click="removeImage(image.id)">
                <el-icon><Delete /></el-icon>
              </button>
              <span class="bill-form__image-name">{{ image.name }}</span>
            </div>
          </div>

          <div v-else class="bill-form__image-empty">
            <el-icon><Picture /></el-icon>
            <span>可添加发票、订单截图、收据照片等多张图片</span>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="商品视频" class="is-span-2">
        <div class="bill-form__image-panel bill-form__video-panel">
          <div class="bill-form__image-toolbar bill-form__video-toolbar">
            <div class="bill-form__video-meta">
              <el-button plain :icon="VideoCamera" :loading="pickingVideos" @click="openVideoPicker">添加视频</el-button>
              <span class="bill-form__image-hint">已添加 {{ form.videos?.length ?? 0 }} / {{ videoLimit }} 段</span>
            </div>
            <span class="bill-form__video-badge">支持短视频预览</span>
          </div>

          <div v-if="form.videos?.length" class="bill-form__video-grid">
            <div v-for="video in form.videos" :key="video.id" class="bill-form__video-card">
              <video :src="resolveBillVideoSrc(video)" controls preload="metadata" class="bill-form__video" />
              <button type="button" class="bill-form__image-remove" @click="removeVideo(video.id)">
                <el-icon><Delete /></el-icon>
              </button>
              <span class="bill-form__image-name">{{ video.name }}</span>
            </div>
          </div>

          <div v-else class="bill-form__image-empty bill-form__video-empty">
            <el-icon><VideoCamera /></el-icon>
            <strong>添加商品视频</strong>
            <span>可添加开箱、收录屏等短视频</span>
          </div>
        </div>
      </el-form-item>
    </div>

    <input ref="cameraInputRef" style="display: none" type="file" accept="image/*" capture="environment" @change="handleFileChange" />
    <input ref="galleryInputRef" style="display: none" type="file" accept="image/*" multiple @change="handleFileChange" />
    <input ref="videoInputRef" style="display: none" type="file" accept="video/*" capture="environment" @change="handleVideoChange" />

    <el-button type="primary" class="bill-form__submit" @click="handleSubmit">
      {{ submitLabel ?? '保存账单' }}
    </el-button>
  </el-form>

  <el-drawer v-model="pickerVisible" direction="btt" size="auto" :with-header="false" append-to-body>
    <div class="action-sheet">
      <div class="action-sheet__header">
        <span class="eyebrow">图片来源</span>
        <h3>选择添加方式</h3>
      </div>
      <div class="action-sheet__actions">
        <el-button :icon="Camera" :loading="pickingImages" @click="openCameraPicker">拍照</el-button>
        <el-button :icon="Picture" :loading="pickingImages" @click="openGalleryPicker">从相册中选择</el-button>
      </div>
    </div>
  </el-drawer>
</template>
