'use client'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
if (!projectId) {
  console.warn(
    'Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID — WalletConnect will not work. ' +
    'Get a project ID at https://cloud.walletconnect.com'
  )
}

const config = getDefaultConfig({
  appName: 'FCFS Campaigns',
  projectId: projectId || 'PLACEHOLDER_REPLACE_WITH_REAL_PROJECT_ID',
  chains: [baseSepolia, base],
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
