import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vitest/config'

function getManualChunkName(id: string): string | undefined {
  if (id.includes('node_modules/vue-echarts')) {
    return 'charts-vue'
  }

  if (id.includes('node_modules/echarts/core') || id.includes('node_modules/echarts/renderers')) {
    return 'charts-core'
  }

  if (id.includes('node_modules/echarts/charts') || id.includes('node_modules/echarts/components')) {
    return 'charts-parts'
  }

  if (id.includes('node_modules/zrender')) {
    return 'charts-zrender'
  }

  if (id.includes('node_modules/echarts')) {
    return 'charts-runtime'
  }

  if (id.includes('node_modules/element-plus')) {
    return 'element-plus'
  }

  if (id.includes('node_modules')) {
    return 'vendor'
  }

  return undefined
}

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: false,
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: getManualChunkName,
      },
    },
  },
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
