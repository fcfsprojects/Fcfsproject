'use client'

import { PROTOCOL_FEE_PERCENT } from '@/lib/constants'
import { calculateCampaignCost } from '@/lib/fees'

interface CostSummaryProps {
  rewardPerUser: string
  maxParticipants: string
}

export function CostSummary({ rewardPerUser, maxParticipants }: CostSummaryProps) {
  const cost = calculateCampaignCost(rewardPerUser, maxParticipants)
  if (!cost) return null

  return (
    <div className="p-4 rounded-lg bg-gray-800/50 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Reward Pool</span>
        <span>{cost.rewardPool} USDC</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Protocol Fee ({PROTOCOL_FEE_PERCENT}%)</span>
        <span className="text-yellow-400">{cost.protocolFee} USDC</span>
      </div>
      <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-bold">
        <span className="text-gray-400">Total</span>
        <span className="text-emerald-400">{cost.total} USDC</span>
      </div>
    </div>
  )
}
