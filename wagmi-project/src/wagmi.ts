import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from "connectkit";

// 定义本地开发网络
const localDevelopment = {
  id: 1337,
  name: 'Local Development',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:7545'],
    },
  },
} as const

export const config = createConfig(
  
  getDefaultConfig({
    // Your dApps chains - 使用本地开发网络
    chains: [localDevelopment, mainnet, sepolia],
    transports: {
      // RPC URL for each chain
      [localDevelopment.id]: http('http://127.0.0.1:7545'),
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: import.meta.env.VITE_WC_PROJECT_ID,

    // Required App Info
    appName: "Web3红包",

    // Optional App Info
    appDescription: "基于区块链的去中心化红包系统",
    // appUrl: "https://family.co", // your app's url
    // appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }))

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
