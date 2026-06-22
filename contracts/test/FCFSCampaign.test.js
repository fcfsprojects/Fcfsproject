const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FCFSCampaign", function () {
  let campaign;
  let mockUSDC;
  let owner, creator, worker1, worker2, worker3;

  const REWARD_PER_USER = ethers.parseUnits("1", 6); // 1 USDC
  const MAX_PARTICIPANTS = 3n;
  const TWEET_URL = "https://x.com/user/status/123456";
  const TASK_LIKE = 0;
  const TASK_RETWEET = 1;
  const TASK_COMMENT = 2;

  const PROTOCOL_FEE_PERCENT = 10n;
  const MAX_CAMPAIGN_DURATION = 30n * 24n * 60n * 60n; // 30 days in seconds

  async function deployFixture() {
    [owner, creator, worker1, worker2, worker3] = await ethers.getSigners();

    // Deploy a mock ERC20 token to act as USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy FCFSCampaign
    const FCFSCampaign = await ethers.getContractFactory("FCFSCampaign");
    campaign = await FCFSCampaign.deploy(await mockUSDC.getAddress());
    await campaign.waitForDeployment();

    // Mint USDC to creator and approve campaign contract
    const mintAmount = ethers.parseUnits("10000", 6);
    await mockUSDC.mint(creator.address, mintAmount);
    await mockUSDC.connect(creator).approve(await campaign.getAddress(), mintAmount);

    return { campaign, mockUSDC, owner, creator, worker1, worker2, worker3 };
  }

  beforeEach(async function () {
    ({ campaign, mockUSDC, owner, creator, worker1, worker2, worker3 } =
      await deployFixture());
  });

  // ---------- Deployment ----------

  describe("Deployment", function () {
    it("should set the correct USDC address", async function () {
      expect(await campaign.usdc()).to.equal(await mockUSDC.getAddress());
    });

    it("should set the deployer as owner", async function () {
      expect(await campaign.owner()).to.equal(owner.address);
    });

    it("should start with zero campaigns", async function () {
      expect(await campaign.campaignCounter()).to.equal(0n);
    });

    it("should have correct protocol fee constant", async function () {
      expect(await campaign.PROTOCOL_FEE_PERCENT()).to.equal(10n);
    });

    it("should have correct max campaign duration constant", async function () {
      expect(await campaign.MAX_CAMPAIGN_DURATION()).to.equal(MAX_CAMPAIGN_DURATION);
    });
  });

  // ---------- createCampaign ----------

  describe("createCampaign", function () {
    it("should create a campaign with correct parameters", async function () {
      const tx = await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );

      const c = await campaign.getCampaign(0);
      expect(c.id).to.equal(0n);
      expect(c.creator).to.equal(creator.address);
      expect(c.tweetUrl).to.equal(TWEET_URL);
      expect(c.taskType).to.equal(TASK_LIKE);
      expect(c.rewardPerUser).to.equal(REWARD_PER_USER);
      expect(c.maxParticipants).to.equal(MAX_PARTICIPANTS);
      expect(c.participants).to.equal(0n);
      expect(c.status).to.equal(0); // ACTIVE
      expect(c.withdrawn).to.equal(false);
    });

    it("should calculate totalReward and protocolFee correctly", async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );

      const c = await campaign.getCampaign(0);
      const expectedTotalReward = REWARD_PER_USER * MAX_PARTICIPANTS;
      const expectedFee = (expectedTotalReward * PROTOCOL_FEE_PERCENT) / 100n;

      expect(c.totalReward).to.equal(expectedTotalReward);
      expect(c.protocolFee).to.equal(expectedFee);
    });

    it("should transfer the correct USDC amount from creator", async function () {
      const totalReward = REWARD_PER_USER * MAX_PARTICIPANTS;
      const fee = (totalReward * PROTOCOL_FEE_PERCENT) / 100n;
      const totalAmount = totalReward + fee;

      const balBefore = await mockUSDC.balanceOf(creator.address);
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      const balAfter = await mockUSDC.balanceOf(creator.address);

      expect(balBefore - balAfter).to.equal(totalAmount);
    });

    it("should increment campaignCounter", async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      expect(await campaign.campaignCounter()).to.equal(1n);

      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_RETWEET, REWARD_PER_USER, 2n
      );
      expect(await campaign.campaignCounter()).to.equal(2n);
    });

    it("should return the campaign ID", async function () {
      const id = await campaign.connect(creator).createCampaign.staticCall(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      expect(id).to.equal(0n);
    });

    it("should emit CampaignCreated event", async function () {
      const totalReward = REWARD_PER_USER * MAX_PARTICIPANTS;
      const fee = (totalReward * PROTOCOL_FEE_PERCENT) / 100n;
      const totalAmount = totalReward + fee;

      await expect(
        campaign.connect(creator).createCampaign(
          TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
        )
      )
        .to.emit(campaign, "CampaignCreated")
        .withArgs(0n, creator.address, TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS, totalAmount);
    });

    it("should set expiresAt to 30 days from creation", async function () {
      const tx = await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const c = await campaign.getCampaign(0);
      expect(c.createdAt).to.equal(BigInt(block.timestamp));
      expect(c.expiresAt).to.equal(BigInt(block.timestamp) + MAX_CAMPAIGN_DURATION);
    });

    it("should support all task types", async function () {
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, 1n);
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_RETWEET, REWARD_PER_USER, 1n);
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_COMMENT, REWARD_PER_USER, 1n);

      expect((await campaign.getCampaign(0)).taskType).to.equal(TASK_LIKE);
      expect((await campaign.getCampaign(1)).taskType).to.equal(TASK_RETWEET);
      expect((await campaign.getCampaign(2)).taskType).to.equal(TASK_COMMENT);
    });

    // Validation tests
    it("should revert with empty tweet URL", async function () {
      await expect(
        campaign.connect(creator).createCampaign("", TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS)
      ).to.be.revertedWith("Empty URL");
    });

    it("should revert with zero reward", async function () {
      await expect(
        campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, 0n, MAX_PARTICIPANTS)
      ).to.be.revertedWith("Zero reward");
    });

    it("should revert with zero participants", async function () {
      await expect(
        campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, 0n)
      ).to.be.revertedWith("Zero participants");
    });

    it("should revert with too many participants (>10000)", async function () {
      await expect(
        campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, 10001n)
      ).to.be.revertedWith("Too many participants");
    });

    it("should allow exactly 10000 participants", async function () {
      const bigMint = ethers.parseUnits("100000", 6);
      await mockUSDC.mint(creator.address, bigMint);
      await mockUSDC.connect(creator).approve(await campaign.getAddress(), bigMint);

      await expect(
        campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, 10000n)
      ).to.not.be.reverted;
    });

    it("should revert if creator has insufficient USDC approval", async function () {
      await mockUSDC.connect(creator).approve(await campaign.getAddress(), 0n);

      await expect(
        campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS)
      ).to.be.reverted;
    });
  });

  // ---------- claimReward ----------

  describe("claimReward", function () {
    beforeEach(async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
    });

    it("should allow a worker to claim reward", async function () {
      const balBefore = await mockUSDC.balanceOf(worker1.address);
      await campaign.connect(worker1).claimReward(0);
      const balAfter = await mockUSDC.balanceOf(worker1.address);

      expect(balAfter - balBefore).to.equal(REWARD_PER_USER);
    });

    it("should mark worker as having claimed", async function () {
      expect(await campaign.hasUserClaimed(0, worker1.address)).to.be.false;
      await campaign.connect(worker1).claimReward(0);
      expect(await campaign.hasUserClaimed(0, worker1.address)).to.be.true;
    });

    it("should add worker to participants list", async function () {
      await campaign.connect(worker1).claimReward(0);
      const participants = await campaign.getParticipants(0);
      expect(participants).to.include(worker1.address);
      expect(participants.length).to.equal(1);
    });

    it("should increment participant count", async function () {
      await campaign.connect(worker1).claimReward(0);
      const c = await campaign.getCampaign(0);
      expect(c.participants).to.equal(1n);
    });

    it("should emit RewardClaimed event", async function () {
      await expect(campaign.connect(worker1).claimReward(0))
        .to.emit(campaign, "RewardClaimed")
        .withArgs(0n, worker1.address, REWARD_PER_USER);
    });

    it("should auto-complete campaign when all slots filled", async function () {
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);

      await expect(campaign.connect(worker3).claimReward(0))
        .to.emit(campaign, "CampaignCompleted")
        .withArgs(0n);

      const c = await campaign.getCampaign(0);
      expect(c.status).to.equal(1); // COMPLETED
    });

    it("should not auto-complete before all slots filled", async function () {
      await campaign.connect(worker1).claimReward(0);
      const c = await campaign.getCampaign(0);
      expect(c.status).to.equal(0); // Still ACTIVE
    });

    it("should revert if worker already claimed", async function () {
      await campaign.connect(worker1).claimReward(0);
      await expect(
        campaign.connect(worker1).claimReward(0)
      ).to.be.revertedWith("Already claimed");
    });

    it("should revert if campaign is full", async function () {
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);
      await campaign.connect(worker3).claimReward(0);

      const [, , , , , extra] = await ethers.getSigners();
      await expect(
        campaign.connect(extra).claimReward(0)
      ).to.be.revertedWith("Not active");
    });

    it("should revert if campaign is expired", async function () {
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);
      await expect(
        campaign.connect(worker1).claimReward(0)
      ).to.be.revertedWith("Campaign expired");
    });

    it("should revert if creator tries to claim own campaign", async function () {
      await expect(
        campaign.connect(creator).claimReward(0)
      ).to.be.revertedWith("Creator cannot claim");
    });

    it("should revert for invalid campaign ID", async function () {
      await expect(
        campaign.connect(worker1).claimReward(999)
      ).to.be.revertedWith("Invalid campaign");
    });

    it("should revert if campaign is cancelled", async function () {
      await campaign.connect(creator).cancelCampaign(0);
      await expect(
        campaign.connect(worker1).claimReward(0)
      ).to.be.revertedWith("Not active");
    });
  });

  // ---------- withdrawRemaining ----------

  describe("withdrawRemaining", function () {
    beforeEach(async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
    });

    it("should allow creator to withdraw remaining after campaign completed", async function () {
      // Only 1 out of 3 claims, then fill the rest to complete
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);
      await campaign.connect(worker3).claimReward(0);

      // Campaign is completed, no remaining since all claimed
      const balBefore = await mockUSDC.balanceOf(creator.address);
      await campaign.connect(creator).withdrawRemaining(0);
      const balAfter = await mockUSDC.balanceOf(creator.address);

      // All participants claimed, so remaining = 0
      expect(balAfter - balBefore).to.equal(0n);
    });

    it("should return unclaimed USDC after expiry", async function () {
      // Only 1 claim
      await campaign.connect(worker1).claimReward(0);

      // Fast-forward past expiry
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);

      const remaining = REWARD_PER_USER * (MAX_PARTICIPANTS - 1n);
      const balBefore = await mockUSDC.balanceOf(creator.address);
      await campaign.connect(creator).withdrawRemaining(0);
      const balAfter = await mockUSDC.balanceOf(creator.address);

      expect(balAfter - balBefore).to.equal(remaining);
    });

    it("should mark campaign as withdrawn", async function () {
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);
      await campaign.connect(creator).withdrawRemaining(0);

      const c = await campaign.getCampaign(0);
      expect(c.withdrawn).to.be.true;
    });

    it("should set status to COMPLETED if not already", async function () {
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);
      await campaign.connect(creator).withdrawRemaining(0);

      const c = await campaign.getCampaign(0);
      expect(c.status).to.equal(1); // COMPLETED
    });

    it("should revert if already withdrawn", async function () {
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);
      await campaign.connect(creator).withdrawRemaining(0);

      await expect(
        campaign.connect(creator).withdrawRemaining(0)
      ).to.be.revertedWith("Already withdrawn");
    });

    it("should revert if campaign still active and not expired", async function () {
      await expect(
        campaign.connect(creator).withdrawRemaining(0)
      ).to.be.revertedWith("Campaign active");
    });

    it("should revert if called by non-creator", async function () {
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);
      await expect(
        campaign.connect(worker1).withdrawRemaining(0)
      ).to.be.revertedWith("Not creator");
    });

    it("should handle the case where no one claimed", async function () {
      await time.increase(MAX_CAMPAIGN_DURATION + 1n);

      const totalReward = REWARD_PER_USER * MAX_PARTICIPANTS;
      const balBefore = await mockUSDC.balanceOf(creator.address);
      await campaign.connect(creator).withdrawRemaining(0);
      const balAfter = await mockUSDC.balanceOf(creator.address);

      expect(balAfter - balBefore).to.equal(totalReward);
    });
  });

  // ---------- cancelCampaign ----------

  describe("cancelCampaign", function () {
    beforeEach(async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
    });

    it("should cancel and refund full amount (reward + fee)", async function () {
      const totalReward = REWARD_PER_USER * MAX_PARTICIPANTS;
      const fee = (totalReward * PROTOCOL_FEE_PERCENT) / 100n;
      const totalAmount = totalReward + fee;

      const balBefore = await mockUSDC.balanceOf(creator.address);
      await campaign.connect(creator).cancelCampaign(0);
      const balAfter = await mockUSDC.balanceOf(creator.address);

      expect(balAfter - balBefore).to.equal(totalAmount);
    });

    it("should set status to CANCELLED", async function () {
      await campaign.connect(creator).cancelCampaign(0);
      const c = await campaign.getCampaign(0);
      expect(c.status).to.equal(2); // CANCELLED
    });

    it("should mark as withdrawn", async function () {
      await campaign.connect(creator).cancelCampaign(0);
      const c = await campaign.getCampaign(0);
      expect(c.withdrawn).to.be.true;
    });

    it("should emit CampaignCancelled event", async function () {
      await expect(campaign.connect(creator).cancelCampaign(0))
        .to.emit(campaign, "CampaignCancelled")
        .withArgs(0n);
    });

    it("should revert if someone already claimed", async function () {
      await campaign.connect(worker1).claimReward(0);
      await expect(
        campaign.connect(creator).cancelCampaign(0)
      ).to.be.revertedWith("Already has participants");
    });

    it("should revert if campaign not active", async function () {
      await campaign.connect(creator).cancelCampaign(0);
      await expect(
        campaign.connect(creator).cancelCampaign(0)
      ).to.be.revertedWith("Not active");
    });

    it("should revert if called by non-creator", async function () {
      await expect(
        campaign.connect(worker1).cancelCampaign(0)
      ).to.be.revertedWith("Not creator");
    });
  });

  // ---------- withdrawFees ----------

  describe("withdrawFees", function () {
    it("should allow owner to withdraw accumulated fees", async function () {
      // Create campaign and fill all slots so fee becomes available
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);
      await campaign.connect(worker3).claimReward(0);

      // Campaign is COMPLETED now; fee should be withdrawable
      const expectedFee = (REWARD_PER_USER * MAX_PARTICIPANTS * PROTOCOL_FEE_PERCENT) / 100n;

      const balBefore = await mockUSDC.balanceOf(owner.address);
      await campaign.connect(owner).withdrawFees();
      const balAfter = await mockUSDC.balanceOf(owner.address);

      expect(balAfter - balBefore).to.equal(expectedFee);
    });

    it("should emit FeesWithdrawn event", async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);
      await campaign.connect(worker3).claimReward(0);

      const expectedFee = (REWARD_PER_USER * MAX_PARTICIPANTS * PROTOCOL_FEE_PERCENT) / 100n;

      await expect(campaign.connect(owner).withdrawFees())
        .to.emit(campaign, "FeesWithdrawn")
        .withArgs(owner.address, expectedFee);
    });

    it("should update totalFeesCollected", async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);
      await campaign.connect(worker3).claimReward(0);

      const expectedFee = (REWARD_PER_USER * MAX_PARTICIPANTS * PROTOCOL_FEE_PERCENT) / 100n;

      await campaign.connect(owner).withdrawFees();
      expect(await campaign.totalFeesCollected()).to.equal(expectedFee);
    });

    it("should revert if no fees available", async function () {
      await expect(
        campaign.connect(owner).withdrawFees()
      ).to.be.revertedWith("No fees available");
    });

    it("should revert if called by non-owner", async function () {
      await expect(
        campaign.connect(creator).withdrawFees()
      ).to.be.reverted;
    });

    it("should not withdraw funds locked in active campaigns", async function () {
      // Create campaign but don't fill all slots
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
      await campaign.connect(worker1).claimReward(0);

      // There are still locked funds for unclaimed rewards + active fee
      await expect(
        campaign.connect(owner).withdrawFees()
      ).to.be.revertedWith("No fees available");
    });
  });

  // ---------- View functions ----------

  describe("View functions", function () {
    beforeEach(async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, MAX_PARTICIPANTS
      );
    });

    it("getCampaign should return full campaign struct", async function () {
      const c = await campaign.getCampaign(0);
      expect(c.id).to.equal(0n);
      expect(c.creator).to.equal(creator.address);
      expect(c.tweetUrl).to.equal(TWEET_URL);
    });

    it("getCampaignCount should return total number of campaigns", async function () {
      expect(await campaign.getCampaignCount()).to.equal(1n);
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_RETWEET, REWARD_PER_USER, 1n);
      expect(await campaign.getCampaignCount()).to.equal(2n);
    });

    it("hasUserClaimed should return false for non-claimers", async function () {
      expect(await campaign.hasUserClaimed(0, worker1.address)).to.be.false;
    });

    it("hasUserClaimed should return true after claiming", async function () {
      await campaign.connect(worker1).claimReward(0);
      expect(await campaign.hasUserClaimed(0, worker1.address)).to.be.true;
    });

    it("getParticipants should return empty array initially", async function () {
      const p = await campaign.getParticipants(0);
      expect(p.length).to.equal(0);
    });

    it("getParticipants should return all claimers", async function () {
      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker2).claimReward(0);

      const p = await campaign.getParticipants(0);
      expect(p.length).to.equal(2);
      expect(p).to.include(worker1.address);
      expect(p).to.include(worker2.address);
    });
  });

  // ---------- Edge cases ----------

  describe("Edge cases", function () {
    it("should handle single-participant campaign", async function () {
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, REWARD_PER_USER, 1n
      );

      await expect(campaign.connect(worker1).claimReward(0))
        .to.emit(campaign, "CampaignCompleted");

      const c = await campaign.getCampaign(0);
      expect(c.participants).to.equal(1n);
      expect(c.status).to.equal(1); // COMPLETED
    });

    it("should handle multiple campaigns independently", async function () {
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, 2n);
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_RETWEET, REWARD_PER_USER, 2n);

      // Claim on campaign 0
      await campaign.connect(worker1).claimReward(0);

      // Campaign 1 should be unaffected
      const c1 = await campaign.getCampaign(1);
      expect(c1.participants).to.equal(0n);

      // worker1 can also claim on campaign 1
      await campaign.connect(worker1).claimReward(1);
      const c1After = await campaign.getCampaign(1);
      expect(c1After.participants).to.equal(1n);
    });

    it("should handle very small reward amounts", async function () {
      const smallReward = 1n; // 0.000001 USDC (smallest unit)
      await campaign.connect(creator).createCampaign(
        TWEET_URL, TASK_LIKE, smallReward, 1n
      );

      const balBefore = await mockUSDC.balanceOf(worker1.address);
      await campaign.connect(worker1).claimReward(0);
      const balAfter = await mockUSDC.balanceOf(worker1.address);
      expect(balAfter - balBefore).to.equal(smallReward);
    });

    it("should correctly track fees across multiple completed campaigns", async function () {
      // Create and complete two campaigns
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_LIKE, REWARD_PER_USER, 1n);
      await campaign.connect(creator).createCampaign(TWEET_URL, TASK_RETWEET, REWARD_PER_USER, 1n);

      await campaign.connect(worker1).claimReward(0);
      await campaign.connect(worker1).claimReward(1);

      // Both are COMPLETED; two fees should be available
      const feePerCampaign = (REWARD_PER_USER * 1n * PROTOCOL_FEE_PERCENT) / 100n;
      const expectedTotal = feePerCampaign * 2n;

      const balBefore = await mockUSDC.balanceOf(owner.address);
      await campaign.connect(owner).withdrawFees();
      const balAfter = await mockUSDC.balanceOf(owner.address);

      expect(balAfter - balBefore).to.equal(expectedTotal);
    });
  });
});
