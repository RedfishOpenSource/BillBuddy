import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/AppShell.vue'),
      redirect: '/home',
      children: [
        { path: 'home', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'bills', name: 'bills', component: () => import('../views/BillsView.vue') },
        { path: 'stats', name: 'stats', component: () => import('../views/StatsView.vue') },
        { path: 'settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
        { path: 'settings/category/:id', name: 'category-editor', component: () => import('../views/CategoryEditorView.vue') },
      ],
    },
    { path: '/bill/new', name: 'bill-new', component: () => import('../views/BillFormView.vue') },
    { path: '/bill/:id', name: 'bill-detail', component: () => import('../views/BillDetailView.vue') },
    { path: '/bill/:id/edit', name: 'bill-edit', component: () => import('../views/BillFormView.vue') },
  ],
})

export default router
