# FCFS - First Come First Serve Campaigns

Web3 micro-bounty platform untuk social engagement (Like/Retweet/Comment) dengan reward USDC.

## Konsep

- **Creator** submit tweet URL + pilih task type (like/retweet/comment) + deposit USDC
- **Worker** ngerjain task di X/Twitter lalu claim reward on-chain
- **Protocol Fee** 10% per campaign
- **One Task = One Campaign** — kalau mau like+retweet+comment = 3 campaign terpisah

## Fee Structure

| Jumlah Task | Reward Pool | Protocol Fee (10%) | Total Bayar |
|------------|------------|-------------------|------------|
| 1 Campaign | $10 | $1 | **$11** |
| 3 Campaigns (Like+RT+Comment) | $30 | $3 | **$33** |

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + RainbowKit
- **Smart Contract**: Solidity 0.8.20 + OpenZeppelin + Hardhat
- **Network**: Base (L2 Ethereum)

## File Structure

```
fcfs-complete/
├── contracts/
│   ├── FCFSCampaign.sol      # Smart contract utama
│   ├── deploy.js             # Script deploy
│   ├── hardhat.config.js     # Config hardhat
│   └── package.json          # Dependencies contract
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # Main UI
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── globals.css   # Styles
│   │   │   └── providers.tsx # Wagmi + RainbowKit provider
│   │   └── lib/
│   │       └── contract.ts   # ABI + Contract address
│   └── package.json          # Dependencies frontend
└── README.md
```

## Deploy Smart Contract (Hardhat)

```bash
cd contracts
npm install
npx hardhat compile

# Deploy ke Base Sepolia (testnet)
npx hardhat run deploy.js --network baseSepolia

# Deploy ke Base Mainnet
npx hardhat run deploy.js --network base
```

## Setup Frontend

```bash
cd frontend
npm install

# Copy .env.local
cp .env.example .env.local
# Edit NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

npm run dev
```

## Deploy ke Vercel

```bash
cd frontend
npm i -g vercel
vercel --prod
```

## Cara Push ke GitHub

```bash
# Buat repo baru di GitHub
# Lalu:
git init
git add .
git commit -m "Initial: FCFS Campaign Platform"
git remote add origin https://github.com/USERNAME/fcfsproject.git
git push -u origin main
```

## Smart Contract Functions

| Function | Description |
|----------|-------------|
| `createCampaign(url, taskType, reward, max)` | Buat campaign baru + deposit USDC |
| `claimReward(campaignId)` | Worker claim reward |
| `withdrawRemaining(campaignId)` | Creator tarik sisa dana |
| `cancelCampaign(campaignId)` | Cancel sebelum ada participant |
| `withdrawFees()` | Owner tarik protocol fee |

## Base USDC Addresses

- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f152dD7`
- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## License

MIT
