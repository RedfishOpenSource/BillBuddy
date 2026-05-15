<script setup lang="ts">
import { Bell, DataAnalysis, HomeFilled, Money, Plus, Setting } from '@element-plus/icons-vue'
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

type AppTab = {
  label: string
  path: string
  icon: Component
}

const tabs: AppTab[] = [
  { label: '总览', path: '/home', icon: HomeFilled },
  { label: '账单', path: '/bills', icon: Money },
  { label: '统计', path: '/stats', icon: DataAnalysis },
  { label: '待确认', path: '/inbox', icon: Bell },
  { label: '设置', path: '/settings', icon: Setting },
]

const floatingAddPaths = ['/home', '/bills', '/stats']

const currentPath = computed(function (): string {
  return route.path
})

const activeTabPath = computed(function (): string {
  const matchedTab = tabs.find(function (tab) {
    return currentPath.value.startsWith(tab.path)
  })

  return matchedTab?.path ?? ''
})

const showFloatingAdd = computed(function (): boolean {
  return floatingAddPaths.includes(currentPath.value)
})

const bodyClass = computed(function (): Record<string, boolean> {
  return {
    'app-shell__body': true,
    'app-shell__body--tight': currentPath.value === '/home',
  }
})

function navigateTo(path: string): void {
  void router.push(path)
}
</script>

<template>
  <div class="app-shell">
    <main :class="bodyClass">
      <router-view />
    </main>

    <el-button
      v-if="showFloatingAdd"
      class="floating-add"
      type="primary"
      circle
      aria-label="新增账单"
      @click="navigateTo('/bill/new')"
    >
      <el-icon><Plus /></el-icon>
    </el-button>

    <el-card shadow="never" class="tabbar">
      <div class="tabbar__grid" aria-label="主导航">
        <el-button
          v-for="tab in tabs"
          :key="tab.path"
          class="tabbar__item"
          :class="{ 'is-active': activeTabPath === tab.path }"
          :type="activeTabPath === tab.path ? 'primary' : undefined"
          text
          :bg="activeTabPath === tab.path"
          :aria-current="activeTabPath === tab.path ? 'page' : undefined"
          @click="navigateTo(tab.path)"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </el-button>
      </div>
    </el-card>
  </div>
</template>
