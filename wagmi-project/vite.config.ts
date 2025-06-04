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
  server: {
    proxy: {
      // 代理RPC请求以解决CORS问题
      '/api/sepolia': {
        target: 'https://eth-sepolia.g.alchemy.com/v2/X9Acz_FoF-9tKQ1_S7uPxzKqN0s-x2ND',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sepolia/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
