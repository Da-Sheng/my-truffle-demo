import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Code Inspector - 开发环境下点击元素可跳转到代码
    codeInspectorPlugin({
      bundler: 'vite',
      // 只在开发环境启用
    }),
  ],
})
