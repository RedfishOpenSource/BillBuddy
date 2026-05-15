<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

defineProps<{
  title: string
  eyebrow?: string
}>()

const emit = defineEmits<{
  back: []
}>()
</script>

<template>
  <header class="page-heading back-page-header">
    <div class="back-page-header__main">
      <el-button class="back-page-header__back" text circle :icon="ArrowLeft" aria-label="返回" @click="emit('back')" />
      <div class="back-page-header__titles">
        <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
        <h2>{{ title }}</h2>
      </div>
    </div>
    <div v-if="$slots.actions" class="back-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>
