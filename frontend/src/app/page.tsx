'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { TASK_TYPES, styles } from '@/lib/constants'
import { useCampaignCount, useCampaignActions } from '@/hooks/useCampaignContract'
import { FormInput } from '@/components/FormInput'
import { CampaignCard } from '@/components/CampaignCard'
import { CostSummary } from '@/components/CostSummary'

export default function Home() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my'>('browse')

  // Form state
  const [tweetUrl, setTweetUrl] = useState('')
  const [taskType, setTaskType] = useState(0)
  const [rewardPerUser, setRewardPerUser] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')

  // Contract hooks
  const { data: campaignCount } = useCampaignCount()
  const { createCampaign, claimReward } = useCampaignActions()

  const handleCreate = () => {
    if (!tweetUrl || !rewardPerUser || !maxParticipants) return
    createCampaign(tweetUrl, taskType, rewardPerUser, maxParticipants)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold">F</div>
            <h1 className="text-xl font-bold">FCFS</h1>
          </div>
          <nav className="flex gap-2">
            {(['browse', 'create', 'my'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'browse' ? 'Browse' : tab === 'create' ? 'Create Campaign' : 'My Campaigns'}
              </button>
            ))}
          </nav>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Browse Campaigns */}
        {activeTab === 'browse' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
            <p className="text-gray-400 mb-4">Total campaigns: {campaignCount?.toString() || '0'}</p>
            
            <div className="grid gap-4">
              {[1, 2, 3].map((id) => (
                <CampaignCard key={id} id={id} taskTypeIndex={id % 3} onClaim={claimReward} />
              ))}
            </div>
          </div>
        )}

        {/* Create Campaign */}
        {activeTab === 'create' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create Campaign</h2>
            <div className={`${styles.card} space-y-6`}>
              <FormInput
                label="Tweet URL"
                type="url"
                value={tweetUrl}
                onChange={setTweetUrl}
                placeholder="https://x.com/username/status/123..."
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Task Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {TASK_TYPES.map((type, i) => (
                    <button
                      key={i}
                      onClick={() => setTaskType(i)}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                        taskType === i ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-gray-700 bg-gray-800 text-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Reward (USDC)"
                  type="number"
                  step="0.01"
                  value={rewardPerUser}
                  onChange={setRewardPerUser}
                  placeholder="0.10"
                />
                <FormInput
                  label="Max Participants"
                  type="number"
                  value={maxParticipants}
                  onChange={setMaxParticipants}
                  placeholder="100"
                />
              </div>
              
              {rewardPerUser && maxParticipants && (
                <CostSummary rewardPerUser={rewardPerUser} maxParticipants={maxParticipants} />
              )}
              
              <button
                onClick={handleCreate}
                disabled={!isConnected}
                className={styles.buttonPrimaryFull}
              >
                {isConnected ? 'Create & Deposit USDC' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        )}

        {/* My Campaigns */}
        {activeTab === 'my' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Campaigns</h2>
            {!isConnected ? (
              <div className="text-center py-12 text-gray-500">
                Connect wallet to view your campaigns
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No campaigns yet. Create your first one!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
