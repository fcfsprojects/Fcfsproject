const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Base Sepolia USDC (or mock for testing)
  // For Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f152dD7"; // Base Sepolia USDC

  // Verifier address — the backend signer that authorizes reward claims
  const VERIFIER_ADDRESS = process.env.VERIFIER_ADDRESS;
  if (!VERIFIER_ADDRESS) {
    throw new Error("VERIFIER_ADDRESS env variable is required for deployment");
  }

  const FCFSCampaign = await hre.ethers.getContractFactory("FCFSCampaign");
  const campaign = await FCFSCampaign.deploy(USDC_ADDRESS, VERIFIER_ADDRESS);

  await campaign.waitForDeployment();

  const address = await campaign.getAddress();
  console.log("FCFSCampaign deployed to:", address);
  console.log("USDC used:", USDC_ADDRESS);
  console.log("Verifier:", VERIFIER_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
