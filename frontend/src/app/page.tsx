'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import { contractABI, contractAddress } from '@/lib/contract'

interface Campaign {
  id: number
  creator: string
  tweetUrl: string
  taskType: number
  rewardPerUser: bigint
  maxParticipants: number
  participants: number
  totalReward: bigint
  protocolFee: bigint
  status: number
}

const TASK_TYPES = ['👍 Like', '🔄 Retweet', '💬 Comment']

const TWEET_URL_PATTERN = /^https:\/\/(x\.com|twitter\.com)\/[a-zA-Z0-9_]+\/status\/\d+/

function isValidTweetUrl(url: string): boolean {
  return TWEET_URL_PATTERN.test(url)
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my'>('browse')

  // Form state
  const [tweetUrl, setTweetUrl] = useState('')
  const [taskType, setTaskType] = useState(0)
  const [rewardPerUser, setRewardPerUser] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [formError, setFormError] = useState('')

  // Contract write
  const { writeContract } = useWriteContract()

  // Campaign count
  const { data: campaignCount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'campaignCounter',
  })

  const handleCreate = () => {
    setFormError('')

    if (!tweetUrl || !rewardPerUser || !maxParticipants) {
      setFormError('All fields are required.')
      return
    }

    if (!isValidTweetUrl(tweetUrl)) {
      setFormError('Invalid tweet URL. Must be a valid x.com or twitter.com status link.')
      return
    }

    const rewardNum = parseFloat(rewardPerUser)
    const maxNum = parseInt(maxParticipants, 10)

    if (isNaN(rewardNum) || rewardNum <= 0) {
      setFormError('Reward must be a positive number.')
      return
    }

    if (isNaN(maxNum) || maxNum <= 0 || maxNum > 10000) {
      setFormError('Max participants must be between 1 and 10,000.')
      return
    }

    const reward = parseUnits(rewardPerUser, 6) // USDC 6 decimals
    const max = BigInt(maxNum)

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'createCampaign',
      args: [tweetUrl, taskType, reward, max],
    })
  }

  const handleClaim = async (campaignId: number) => {
    // In production, fetch the signature from a backend verification service
    // that confirms the user completed the task on Twitter/X
    const response = await fetch(`/api/verify-claim?campaignId=${campaignId}&wallet=${address}`)
    if (!response.ok) {
      alert('Task verification failed. Complete the task first.')
      return
    }
    const { signature } = await response.json()

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'claimReward',
      args: [BigInt(campaignId), signature as `0x${string}`],
    })
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
            
            {/* Mock campaign list - replace with contract fetch */}
            <div className="grid gap-4">
              {[1, 2, 3].map((id) => (
                <div key={id} className="border border-gray-800 rounded-xl p-6 bg-gray-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                        {TASK_TYPES[id % 3]}
                      </span>
                      <p className="text-sm text-gray-400 mt-1">Campaign #{id}</p>
                    </div>
                    <button
                      onClick={() => handleClaim(id)}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400"
                    >
                      Claim Reward
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Campaign */}
        {activeTab === 'create' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create Campaign</h2>
            <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tweet URL</label>
                <input
                  type="url"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/username/status/123..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
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
                <div>
                  <label className="block text-sm font-medium mb-2">Reward (USDC)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rewardPerUser}
                    onChange={(e) => setRewardPerUser(e.target.value)}
                    placeholder="0.10"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Participants</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              
              {rewardPerUser && maxParticipants && (
                <div className="p-4 rounded-lg bg-gray-800/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Reward Pool</span>
                    <span>{(parseFloat(rewardPerUser) * parseInt(maxParticipants)).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Protocol Fee (10%)</span>
                    <span className="text-yellow-400">{(parseFloat(rewardPerUser) * parseInt(maxParticipants) * 0.1).toFixed(2)} USDC</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-bold">
                    <span className="text-gray-400">Total</span>
                    <span className="text-emerald-400">{(parseFloat(rewardPerUser) * parseInt(maxParticipants) * 1.1).toFixed(2)} USDC</span>
                  </div>
                </div>
              )}
              
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={!isConnected}
                className="w-full py-3 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50"
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
