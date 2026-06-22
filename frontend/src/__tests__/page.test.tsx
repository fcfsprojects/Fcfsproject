import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock wagmi hooks
const mockWriteContract = jest.fn();
jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({ address: undefined, isConnected: false })),
  useWriteContract: jest.fn(() => ({ writeContract: mockWriteContract })),
  useReadContract: jest.fn(() => ({ data: undefined })),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock RainbowKit
jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: () => <button data-testid="connect-button">Connect Wallet</button>,
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  getDefaultConfig: jest.fn(() => ({})),
}));

// Mock viem
jest.mock("viem", () => ({
  parseUnits: jest.fn((value: string, decimals: number) => BigInt(Math.round(parseFloat(value) * 10 ** decimals))),
  formatUnits: jest.fn((value: bigint, decimals: number) => (Number(value) / 10 ** decimals).toString()),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Home from "@/app/page";
import { useAccount } from "wagmi";

const mockUseAccount = useAccount as jest.Mock;

describe("Home page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false });
  });

  it("renders the FCFS header", () => {
    render(<Home />);
    expect(screen.getByText("FCFS")).toBeInTheDocument();
  });

  it("renders navigation tabs", () => {
    render(<Home />);
    expect(screen.getByText("Browse")).toBeInTheDocument();
    expect(screen.getByText("Create Campaign")).toBeInTheDocument();
    expect(screen.getByText("My Campaigns")).toBeInTheDocument();
  });

  it("renders ConnectButton", () => {
    render(<Home />);
    expect(screen.getByTestId("connect-button")).toBeInTheDocument();
  });

  it("shows Browse tab by default with Active Campaigns heading", () => {
    render(<Home />);
    expect(screen.getByText("Active Campaigns")).toBeInTheDocument();
  });

  it("displays campaign count as 0 when no data", () => {
    render(<Home />);
    expect(screen.getByText(/Total campaigns: 0/)).toBeInTheDocument();
  });

  it("renders mock campaign cards in browse view", () => {
    render(<Home />);
    expect(screen.getByText("Campaign #1")).toBeInTheDocument();
    expect(screen.getByText("Campaign #2")).toBeInTheDocument();
    expect(screen.getByText("Campaign #3")).toBeInTheDocument();
  });

  it("renders Claim Reward buttons for each campaign", () => {
    render(<Home />);
    const claimButtons = screen.getAllByText("Claim Reward");
    expect(claimButtons).toHaveLength(3);
  });

  it("switches to Create Campaign tab", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("Create Campaign"));
    expect(screen.getByText("Tweet URL")).toBeInTheDocument();
    expect(screen.getByText("Task Type")).toBeInTheDocument();
    expect(screen.getByText("Reward (USDC)")).toBeInTheDocument();
    expect(screen.getByText("Max Participants")).toBeInTheDocument();
  });

  it("shows Connect Wallet on create button when not connected", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("Create Campaign"));
    expect(screen.getByText("Connect Wallet", { selector: "button.w-full" })).toBeInTheDocument();
  });

  it("shows Create & Deposit USDC when connected", () => {
    mockUseAccount.mockReturnValue({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      isConnected: true,
    });
    render(<Home />);
    fireEvent.click(screen.getByText("Create Campaign"));
    expect(screen.getByText("Create & Deposit USDC")).toBeInTheDocument();
  });

  it("switches to My Campaigns tab and shows connect message when disconnected", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("My Campaigns"));
    expect(
      screen.getByText("Connect wallet to view your campaigns")
    ).toBeInTheDocument();
  });

  it("switches to My Campaigns tab and shows empty state when connected", () => {
    mockUseAccount.mockReturnValue({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      isConnected: true,
    });
    render(<Home />);
    fireEvent.click(screen.getByText("My Campaigns"));
    expect(
      screen.getByText("No campaigns yet. Create your first one!")
    ).toBeInTheDocument();
  });

  it("renders task type selector buttons in create view", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("Create Campaign"));
    expect(screen.getByText("👍 Like")).toBeInTheDocument();
    expect(screen.getByText("🔄 Retweet")).toBeInTheDocument();
    expect(screen.getByText("💬 Comment")).toBeInTheDocument();
  });

  it("calls writeContract when claim button is clicked", () => {
    render(<Home />);
    const claimButtons = screen.getAllByText("Claim Reward");
    fireEvent.click(claimButtons[0]);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "claimReward",
      })
    );
  });

  it("displays cost summary when reward and participants are filled", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("Create Campaign"));

    const rewardInput = screen.getByPlaceholderText("0.10");
    const participantsInput = screen.getByPlaceholderText("100");

    fireEvent.change(rewardInput, { target: { value: "1" } });
    fireEvent.change(participantsInput, { target: { value: "10" } });

    expect(screen.getByText("Reward Pool")).toBeInTheDocument();
    expect(screen.getByText("Protocol Fee (10%)")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("10.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("1.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("11.00 USDC")).toBeInTheDocument();
  });
});
