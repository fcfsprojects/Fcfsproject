const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();

  if (signers.length === 0) {
    throw new Error(
      "No deployer account found. Set PRIVATE_KEY in your environment or hardhat.config.js."
    );
  }

  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  if (balance === 0n) {
    throw new Error(
      `Deployer account ${deployer.address} has zero balance. Fund it before deploying.`
    );
  }

  // Base Sepolia USDC (or mock for testing)
  // For Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f152dD7"; // Base Sepolia USDC

  if (!hre.ethers.isAddress(USDC_ADDRESS)) {
    throw new Error(`Invalid USDC address: "${USDC_ADDRESS}". Provide a valid EVM address.`);
  }

  if (USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("USDC_ADDRESS is the zero address. Provide a valid USDC token address.");
  }

  console.log("Using USDC address:", USDC_ADDRESS);

  const FCFSCampaign = await hre.ethers.getContractFactory("FCFSCampaign");
  const campaign = await FCFSCampaign.deploy(USDC_ADDRESS);

  await campaign.waitForDeployment();

  const address = await campaign.getAddress();
  console.log("FCFSCampaign deployed to:", address);
  console.log("USDC used:", USDC_ADDRESS);
  console.log("\nNext steps:");
  console.log(`  1. Set NEXT_PUBLIC_CONTRACT_ADDRESS=${address} in frontend/.env.local`);
  console.log(`  2. Verify: npx hardhat verify --network <network> ${address} ${USDC_ADDRESS}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error.message || error);
  process.exitCode = 1;
});
