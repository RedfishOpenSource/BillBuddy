<script setup lang="ts">
import {
  DataAnalysis,
  EditPen,
  HomeFilled,
  Money,
  Plus,
  Setting,
} from '@element-plus/icons-vue'
import { computed, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { setPendingNewBillDraft, type PendingNewBillDraft } from '../services/entry/newBillDraftSession'

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
  { label: '设置', path: '/settings', icon: Setting },
]

const leftTabs = tabs.slice(0, 2)
const rightTabs = tabs.slice(2)

const entryDrawerVisible = ref(false)

const activeTabPath = computed(() => {
  const matchedTab = tabs.find((tab) => route.path.startsWith(tab.path))
  return matchedTab?.path ?? ''
})

const isOverviewRoute = computed(() => activeTabPath.value === '/home')

function navigateTo(path: string): void {
  void router.push(path)
}

function openEntryDrawer(): void {
  entryDrawerVisible.value = true
}

function closeEntryDrawer(): void {
  entryDrawerVisible.value = false
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
  await openNewBillWithDraft({
    mode: 'text',
    source: 'bankCard',
  })
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

    <el-drawer v-model="entryDrawerVisible" direction="btt" size="auto" :with-header="false" append-to-body>
      <div class="action-sheet entry-sheet">
        <div class="action-sheet__header">
          <span class="eyebrow">新增方式</span>
          <h3>选择录入入口</h3>
        </div>
        <div class="entry-sheet__grid">
          <button type="button" class="entry-sheet__button" @click="handleWriteText">
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
