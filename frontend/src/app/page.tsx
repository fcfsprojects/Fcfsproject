'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
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

type StatusMessage = {
  type: 'success' | 'error' | 'pending'
  text: string
}

const TASK_TYPES = ['👍 Like', '🔄 Retweet', '💬 Comment']

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('User rejected')) return 'Transaction rejected by user.'
    if (error.message.includes('insufficient funds')) return 'Insufficient funds for transaction.'
    if (error.message.includes('Already claimed')) return 'You have already claimed this reward.'
    if (error.message.includes('Not active')) return 'This campaign is no longer active.'
    if (error.message.includes('Campaign expired')) return 'This campaign has expired.'
    if (error.message.includes('Full')) return 'This campaign has reached its participant limit.'
    if (error.message.includes('Creator cannot claim')) return 'Campaign creators cannot claim their own rewards.'
    if (error.message.includes('ERC20: insufficient allowance')) return 'USDC allowance insufficient. Please approve the contract first.'
    return error.message.length > 200 ? error.message.slice(0, 200) + '...' : error.message
  }
  return 'An unexpected error occurred.'
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my'>('browse')
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)

  // Form state
  const [tweetUrl, setTweetUrl] = useState('')
  const [taskType, setTaskType] = useState(0)
  const [rewardPerUser, setRewardPerUser] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')

  // Contract write
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError, reset: resetWrite } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash: txHash })

  // Surface write errors to the user
  useEffect(() => {
    if (writeError) {
      setStatusMessage({ type: 'error', text: extractErrorMessage(writeError) })
    }
  }, [writeError])

  // Surface confirmation errors to the user
  useEffect(() => {
    if (confirmError) {
      setStatusMessage({ type: 'error', text: `Transaction failed on-chain: ${extractErrorMessage(confirmError)}` })
    }
  }, [confirmError])

  // Surface successful confirmations
  useEffect(() => {
    if (isConfirmed) {
      setStatusMessage({ type: 'success', text: 'Transaction confirmed!' })
    }
  }, [isConfirmed])

  // Show pending state while confirming
  useEffect(() => {
    if (isConfirming) {
      setStatusMessage({ type: 'pending', text: 'Waiting for transaction confirmation...' })
    }
  }, [isConfirming])

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (statusMessage?.type === 'success') {
      const timer = setTimeout(() => setStatusMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage])

  // Campaign count
  const { data: campaignCount, error: campaignCountError } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'campaignCounter',
  })

  const handleCreate = useCallback(() => {
    if (!tweetUrl || !rewardPerUser || !maxParticipants) {
      setStatusMessage({ type: 'error', text: 'Please fill in all fields.' })
      return
    }

    let reward: bigint
    try {
      reward = parseUnits(rewardPerUser, 6)
    } catch {
      setStatusMessage({ type: 'error', text: 'Invalid reward amount. Please enter a valid number.' })
      return
    }

    if (reward <= 0n) {
      setStatusMessage({ type: 'error', text: 'Reward must be greater than zero.' })
      return
    }

    let max: bigint
    try {
      max = BigInt(maxParticipants)
    } catch {
      setStatusMessage({ type: 'error', text: 'Invalid participant count. Please enter a whole number.' })
      return
    }

    if (max <= 0n || max > 10000n) {
      setStatusMessage({ type: 'error', text: 'Participant count must be between 1 and 10,000.' })
      return
    }

    resetWrite()
    setStatusMessage({ type: 'pending', text: 'Please confirm the transaction in your wallet...' })

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'createCampaign',
      args: [tweetUrl, taskType, reward, max],
    })
  }, [tweetUrl, rewardPerUser, maxParticipants, taskType, writeContract, resetWrite])

  const handleClaim = useCallback((campaignId: number) => {
    resetWrite()
    setStatusMessage({ type: 'pending', text: 'Please confirm the transaction in your wallet...' })

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'claimReward',
      args: [BigInt(campaignId)],
    })
  }, [writeContract, resetWrite])

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
        {/* Status Banner */}
        {statusMessage && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
              statusMessage.type === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : statusMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="ml-4 opacity-70 hover:opacity-100">&times;</button>
          </div>
        )}

        {/* Browse Campaigns */}
        {activeTab === 'browse' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
            {campaignCountError ? (
              <p className="text-red-400 mb-4">Failed to load campaign count. Check your network connection.</p>
            ) : (
              <p className="text-gray-400 mb-4">Total campaigns: {campaignCount?.toString() || '0'}</p>
            )}
            
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
                      disabled={isWritePending || isConfirming}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isWritePending || isConfirming ? 'Processing...' : 'Claim Reward'}
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
              
              {rewardPerUser && maxParticipants && !isNaN(parseFloat(rewardPerUser)) && !isNaN(parseInt(maxParticipants)) && (
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
              
              <button
                onClick={handleCreate}
                disabled={!isConnected || isWritePending || isConfirming}
                className="w-full py-3 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isConnected
                  ? 'Connect Wallet'
                  : isWritePending
                  ? 'Confirm in Wallet...'
                  : isConfirming
                  ? 'Confirming Transaction...'
                  : 'Create & Deposit USDC'}
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
