import { contractABI, contractAddress } from "@/lib/contract";

describe("contract exports", () => {
  describe("contractAddress", () => {
    it("should be a hex string starting with 0x", () => {
      expect(contractAddress).toMatch(/^0x[0-9a-fA-F]*$/);
    });

    it("should default to zero address when env var is not set", () => {
      expect(contractAddress).toBe(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  describe("contractABI", () => {
    it("should be a non-empty array", () => {
      expect(Array.isArray(contractABI)).toBe(true);
      expect(contractABI.length).toBeGreaterThan(0);
    });

    it("should include createCampaign function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "createCampaign"
      );
      expect(fn).toBeDefined();
      expect(fn).toHaveProperty("type", "function");
    });

    it("should include claimReward function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "claimReward"
      );
      expect(fn).toBeDefined();
      expect(fn).toHaveProperty("type", "function");
    });

    it("should include withdrawRemaining function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "withdrawRemaining"
      );
      expect(fn).toBeDefined();
    });

    it("should include cancelCampaign function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "cancelCampaign"
      );
      expect(fn).toBeDefined();
    });

    it("should include withdrawFees function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "withdrawFees"
      );
      expect(fn).toBeDefined();
    });

    it("should include campaignCounter view function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "campaignCounter"
      );
      expect(fn).toBeDefined();
      expect(fn).toHaveProperty("stateMutability", "view");
    });

    it("should include hasUserClaimed view function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "hasUserClaimed"
      );
      expect(fn).toBeDefined();
      expect(fn).toHaveProperty("stateMutability", "view");
    });

    it("should include getParticipants view function", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "getParticipants"
      );
      expect(fn).toBeDefined();
    });

    it("should include CampaignCreated event", () => {
      const evt = contractABI.find(
        (item) => "name" in item && item.name === "CampaignCreated"
      );
      expect(evt).toBeDefined();
      expect(evt).toHaveProperty("type", "event");
    });

    it("should include RewardClaimed event", () => {
      const evt = contractABI.find(
        (item) => "name" in item && item.name === "RewardClaimed"
      );
      expect(evt).toBeDefined();
      expect(evt).toHaveProperty("type", "event");
    });

    it("should include constructor with _usdc address input", () => {
      const ctor = contractABI.find((item) => item.type === "constructor");
      expect(ctor).toBeDefined();
      if (ctor && "inputs" in ctor) {
        expect(ctor.inputs).toHaveLength(1);
        expect(ctor.inputs[0]).toHaveProperty("name", "_usdc");
        expect(ctor.inputs[0]).toHaveProperty("type", "address");
      }
    });

    it("createCampaign should have 4 inputs", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "createCampaign"
      );
      if (fn && "inputs" in fn) {
        expect(fn.inputs).toHaveLength(4);
        const names = fn.inputs.map((i: { name: string }) => i.name);
        expect(names).toEqual([
          "_tweetUrl",
          "_taskType",
          "_rewardPerUser",
          "_maxParticipants",
        ]);
      }
    });

    it("campaigns should return 13 output fields", () => {
      const fn = contractABI.find(
        (item) => "name" in item && item.name === "campaigns"
      );
      if (fn && "outputs" in fn) {
        expect(fn.outputs).toHaveLength(13);
      }
    });
  });
});
