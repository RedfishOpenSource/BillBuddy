<script setup lang="ts">
import { useRouter } from 'vue-router'
import BackPageHeader from '../components/BackPageHeader.vue'
import SettingsPanelContent from '../components/settings/SettingsPanelContent.vue'

const router = useRouter()
</script>

<template>
  <section class="screen screen--static screen--scrollable">
    <BackPageHeader title="设置" @back="router.back()" />
    <SettingsPanelContent />
  </section>
</template>
