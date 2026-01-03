import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 为Electron环境添加配置
  build: {
    rollupOptions: {
      external: [], // 如果有需要排除的模块可以在这里添加
    },
    outDir: 'dist', // 确保构建输出到正确的目录
    emptyOutDir: true // 确保清理输出目录
  },
  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
  },
  // 配置静态资源处理
  publicDir: 'public',
  // 确保公共路径设置正确
  base: './'
})