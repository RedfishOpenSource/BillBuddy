<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { onMounted } from 'vue'
import { storageKeys } from './services/db/keys'
import { initializeStorage } from './services/db/storage'
import { useBillStore } from './stores/billStore'
import { useCategoryStore } from './stores/categoryStore'
import { useIngestStore } from './stores/ingestStore'

const categoryStore = useCategoryStore()
const billStore = useBillStore()
const ingestStore = useIngestStore()

onMounted(async () => {
  await initializeStorage(Object.values(storageKeys))
  categoryStore.hydrate()
  billStore.hydrate()
  ingestStore.hydrate()
  await ingestStore.bindNotificationBridge()
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
