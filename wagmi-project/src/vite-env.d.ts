/// <reference types="vite/client" />

// 扩展全局 globalThis 接口
declare global {
  var Buffer: typeof import('buffer').Buffer;
}
