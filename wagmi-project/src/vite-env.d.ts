/// <reference types="vite/client" />

// 扩展 Vite 环境变量类型
interface ImportMetaEnv {
  readonly VITE_WC_PROJECT_ID: string
  // 可以添加更多环境变量
  // readonly VITE_API_URL: string
  // readonly VITE_OTHER_VAR: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 扩展全局 globalThis 接口
declare global {
  var Buffer: typeof import('buffer').Buffer;
}
