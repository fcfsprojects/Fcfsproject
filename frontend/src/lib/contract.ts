// Base Sepolia / Base Mainnet Contract Address
export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000'

export const contractABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdc", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_tweetUrl", "type": "string"},
      {"internalType": "uint8", "name": "_taskType", "type": "uint8"},
      {"internalType": "uint256", "name": "_rewardPerUser", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxParticipants", "type": "uint256"}
    ],
    "name": "createCampaign",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_campaignId", "type": "uint256"},
      {"internalType": "bytes", "name": "_signature", "type": "bytes"}
    ],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "campaignCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "campaigns",
    "outputs": [
      {"internalType": "uint256", "name": "id", "type": "uint256"},
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "string", "name": "tweetUrl", "type": "string"},
      {"internalType": "enum FCFSCampaign.TaskType", "name": "taskType", "type": "uint8"},
      {"internalType": "uint256", "name": "rewardPerUser", "type": "uint256"},
      {"internalType": "uint256", "name": "maxParticipants", "type": "uint256"},
      {"internalType": "uint256", "name": "participants", "type": "uint256"},
      {"internalType": "uint256", "name": "totalReward", "type": "uint256"},
      {"internalType": "uint256", "name": "protocolFee", "type": "uint256"},
      {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
      {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
      {"internalType": "enum FCFSCampaign.CampaignStatus", "name": "status", "type": "uint8"},
      {"internalType": "bool", "name": "withdrawn", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
    "name": "withdrawRemaining",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
    "name": "cancelCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}, {"internalType": "address", "name": "_user", "type": "address"}],
    "name": "hasUserClaimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_campaignId", "type": "uint256"}],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "tweetUrl", "type": "string"},
      {"indexed": false, "internalType": "enum FCFSCampaign.TaskType", "name": "taskType", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "rewardPerUser", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "maxParticipants", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalAmount", "type": "uint256"}
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "campaignId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "worker", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "RewardClaimed",
    "type": "event"
  }
] as const
