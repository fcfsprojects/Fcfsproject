'use client'

import { styles, TASK_TYPES } from '@/lib/constants'

interface CampaignCardProps {
  id: number
  taskTypeIndex: number
  onClaim: (id: number) => void
}

export function CampaignCard({ id, taskTypeIndex, onClaim }: CampaignCardProps) {
  return (
    <div className={styles.card}>
      <div className="flex justify-between items-start">
        <div>
          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
            {TASK_TYPES[taskTypeIndex]}
          </span>
          <p className="text-sm text-gray-400 mt-1">Campaign #{id}</p>
        </div>
        <button onClick={() => onClaim(id)} className={styles.buttonPrimary}>
          Claim Reward
        </button>
      </div>
    </div>
  )
}
