'use client'

import { useWriteContract, useReadContract } from 'wagmi'
import { contractABI, contractAddress } from '@/lib/contract'
import { calculateCampaignAmounts } from '@/lib/fees'

export function useCampaignCount() {
  return useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'campaignCounter',
  })
}

export function useCampaignActions() {
  const { writeContract } = useWriteContract()

  const createCampaign = (tweetUrl: string, taskType: number, rewardPerUser: string, maxParticipants: string) => {
    const { reward, max } = calculateCampaignAmounts(rewardPerUser, maxParticipants)

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'createCampaign',
      args: [tweetUrl, taskType, reward, max],
    })
  }

  const claimReward = (campaignId: number) => {
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'claimReward',
      args: [BigInt(campaignId)],
    })
  }

  const withdrawRemaining = (campaignId: number) => {
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'withdrawRemaining',
      args: [BigInt(campaignId)],
    })
  }

  const cancelCampaign = (campaignId: number) => {
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'cancelCampaign',
      args: [BigInt(campaignId)],
    })
  }

  return { createCampaign, claimReward, withdrawRemaining, cancelCampaign }
}
