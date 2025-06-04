import { Buffer } from 'buffer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { ConnectKitProvider } from 'connectkit'
import { ApolloProvider } from '@apollo/client'

import App from './App.tsx'
import { config } from './wagmi.ts'
import { apolloClient } from './lib/apolloClient.ts'

import './index.css'

// 使用类型断言
(globalThis as any).Buffer = Buffer

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>
            <App />
          </ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ApolloProvider>
  </React.StrictMode>,
)
