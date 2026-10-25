import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 数据源：content/ 目录（scripts/gen-content.mjs）+ AyeezBlog 后端混合。
// dev 时 /api 代理到本机 8081 后端；生产用 VITE_API_BASE 指定后端完整地址，后端不可用自动回退静态。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
