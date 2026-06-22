'use client'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { useEffect, useRef, useState } from 'react'

function makeConfig() {
  const projectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

  if (!projectId) {
    console.warn(
      'Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID – wallet connections will fail'
    )
  }

  return getDefaultConfig({
    appName: 'FCFS Campaigns',
    projectId,
    chains: [baseSepolia, base],
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient())
  const configRef = useRef<ReturnType<typeof makeConfig> | null>(null)

  useEffect(() => {
    configRef.current = makeConfig()
    setMounted(true)
  }, [])

  if (!mounted || !configRef.current) {
    return null
  }

  return (
    <WagmiProvider config={configRef.current}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
