<script setup lang="ts">
import { useRouter } from 'vue-router'
import BackPageHeader from '../components/BackPageHeader.vue'
import SettingsPanelContent from '../components/settings/SettingsPanelContent.vue'

const router = useRouter()

function goBack(): void {
  void router.back()
}
</script>

<template>
  <section class="screen screen--scrollable">
    <BackPageHeader eyebrow="应用设置" title="设置" @back="goBack" />
    <SettingsPanelContent />
  </section>
</template>
