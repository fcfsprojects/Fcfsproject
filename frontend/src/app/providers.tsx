'use client'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { useState } from 'react'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

if (!walletConnectProjectId) {
  console.warn(
    '[FCFS] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
    'Wallet connections will fail. Get a project ID at https://cloud.walletconnect.com'
  )
}

const config = getDefaultConfig({
  appName: 'FCFS Campaigns',
  projectId: walletConnectProjectId,
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
