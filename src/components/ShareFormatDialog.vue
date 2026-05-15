<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ShareFormat } from '../services/analytics/shareReportService'

const formatOptions: Array<{ value: ShareFormat; label: string; description: string }> = [
  { value: 'pdf', label: '版式文档', description: '推荐给微信分享，版式稳定，手机上更容易查看。' },
  { value: 'html', label: '网页文件', description: '保留排版与图片，适合在浏览器中查看或继续转存。' },
  { value: 'markdown', label: '结构化文本', description: '文字结构清晰，适合继续编辑、粘贴或留档。' },
  { value: 'excel', label: '表格文件', description: '适合继续筛选、统计和表格分析。' },
]

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    submitting?: boolean
    confirmText?: string
    defaultFormat?: ShareFormat
  }>(),
  {
    submitting: false,
    confirmText: '继续分享',
    defaultFormat: 'pdf',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [format: ShareFormat]
}>()

const selectedFormat = ref<ShareFormat>(props.defaultFormat)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      selectedFormat.value = props.defaultFormat
    }
  },
)

function closeDialog(): void {
  emit('update:modelValue', false)
}

function submitDialog(): void {
  emit('submit', selectedFormat.value)
}
</script>

<template>
  <el-dialog :model-value="modelValue" width="92%" :close-on-click-modal="!submitting" @close="closeDialog">
    <template #header>
      <div class="section-title-row">
        <div>
          <span class="eyebrow">分享格式</span>
          <h3>{{ title }}</h3>
        </div>
      </div>
    </template>

    <el-radio-group v-model="selectedFormat" class="share-format-list">
      <label v-for="option in formatOptions" :key="option.value" class="share-format-card">
        <el-radio :value="option.value" size="large">{{ option.label }}</el-radio>
        <p>{{ option.description }}</p>
      </label>
    </el-radio-group>

    <template #footer>
      <el-button :disabled="submitting" @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitDialog">{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>
