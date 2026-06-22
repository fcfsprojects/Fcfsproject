import { parseUnits } from 'viem'
import { PROTOCOL_FEE_PERCENT, USDC_DECIMALS } from './constants'

/**
 * Compute campaign cost breakdown from human-readable string inputs.
 * Used for the preview UI (display values).
 */
export function calculateCampaignCost(rewardPerUser: string, maxParticipants: string) {
  const reward = parseFloat(rewardPerUser)
  const participants = parseInt(maxParticipants, 10)

  if (isNaN(reward) || isNaN(participants) || reward <= 0 || participants <= 0) {
    return null
  }

  const rewardPool = reward * participants
  const protocolFee = rewardPool * (PROTOCOL_FEE_PERCENT / 100)
  const total = rewardPool + protocolFee

  return {
    rewardPool: rewardPool.toFixed(2),
    protocolFee: protocolFee.toFixed(2),
    total: total.toFixed(2),
  }
}

/**
 * Compute on-chain BigInt values for the createCampaign transaction.
 */
export function calculateCampaignAmounts(rewardPerUser: string, maxParticipants: string) {
  const reward = parseUnits(rewardPerUser, USDC_DECIMALS)
  const max = BigInt(maxParticipants)
  const totalReward = reward * max
  const protocolFee = (totalReward * BigInt(PROTOCOL_FEE_PERCENT)) / BigInt(100)
  const totalAmount = totalReward + protocolFee

  return { reward, max, totalReward, protocolFee, totalAmount }
}
