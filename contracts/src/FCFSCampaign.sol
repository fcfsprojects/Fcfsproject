// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FCFSCampaign
 * @dev First Come First Serve - Micro-bounty platform for social engagement
 * Users create campaigns (like/retweet/comment) and deposit USDC as reward pool.
 * Workers complete tasks off-chain and claim rewards on-chain.
 */
contract FCFSCampaign is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public usdc;
    
    uint256 public constant PROTOCOL_FEE_PERCENT = 10; // 10%
    uint256 public constant MAX_CAMPAIGN_DURATION = 30 days;
    
    uint256 public campaignCounter;
    uint256 public totalFeesCollected;
    
    enum TaskType { LIKE, RETWEET, COMMENT }
    enum CampaignStatus { ACTIVE, COMPLETED, CANCELLED }
    
    struct Campaign {
        uint256 id;
        address creator;
        string tweetUrl;
        TaskType taskType;
        uint256 rewardPerUser;
        uint256 maxParticipants;
        uint256 participants;
        uint256 totalReward;
        uint256 protocolFee;
        uint256 createdAt;
        uint256 expiresAt;
        CampaignStatus status;
        bool withdrawn;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => address[]) public participantsList;
    
    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        string tweetUrl,
        TaskType taskType,
        uint256 rewardPerUser,
        uint256 maxParticipants,
        uint256 totalAmount
    );
    
    event RewardClaimed(
        uint256 indexed campaignId,
        address indexed worker,
        uint256 amount
    );
    
    event CampaignCompleted(uint256 indexed campaignId);
    event CampaignCancelled(uint256 indexed campaignId);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    modifier onlyCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not creator");
        _;
    }
    
    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId < campaignCounter, "Invalid campaign");
        require(campaigns[_campaignId].status == CampaignStatus.ACTIVE, "Not active");
        _;
    }
    
    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }
    
    /**
     * @notice Create a new campaign with USDC deposit
     * @param _tweetUrl URL of the tweet to engage with
     * @param _taskType 0=LIKE, 1=RETWEET, 2=COMMENT
     * @param _rewardPerUser USDC amount per participant
     * @param _maxParticipants Maximum number of eligible participants
     */
    function createCampaign(
        string calldata _tweetUrl,
        TaskType _taskType,
        uint256 _rewardPerUser,
        uint256 _maxParticipants
    ) external nonReentrant returns (uint256) {
        require(bytes(_tweetUrl).length > 0, "Empty URL");
        require(_rewardPerUser > 0, "Zero reward");
        require(_maxParticipants > 0, "Zero participants");
        require(_maxParticipants <= 10000, "Too many participants");
        
        uint256 totalReward = _rewardPerUser * _maxParticipants;
        uint256 protocolFee = (totalReward * PROTOCOL_FEE_PERCENT) / 100;
        uint256 totalAmount = totalReward + protocolFee;
        
        // Transfer USDC from creator
        usdc.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        uint256 campaignId = campaignCounter++;
        
        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            tweetUrl: _tweetUrl,
            taskType: _taskType,
            rewardPerUser: _rewardPerUser,
            maxParticipants: _maxParticipants,
            participants: 0,
            totalReward: totalReward,
            protocolFee: protocolFee,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + MAX_CAMPAIGN_DURATION,
            status: CampaignStatus.ACTIVE,
            withdrawn: false
        });
        
        emit CampaignCreated(
            campaignId,
            msg.sender,
            _tweetUrl,
            _taskType,
            _rewardPerUser,
            _maxParticipants,
            totalAmount
        );
        
        return campaignId;
    }
    
    /**
     * @notice Claim reward for completing a campaign task.
     * In production, this should include verification (oracle/signature).
     */
    function claimReward(uint256 _campaignId) external nonReentrant validCampaign(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(block.timestamp < campaign.expiresAt, "Campaign expired");
        require(campaign.participants < campaign.maxParticipants, "Full");
        require(!hasClaimed[_campaignId][msg.sender], "Already claimed");
        require(msg.sender != campaign.creator, "Creator cannot claim");
        
        hasClaimed[_campaignId][msg.sender] = true;
        participantsList[_campaignId].push(msg.sender);
        campaign.participants++;
        
        // Transfer reward
        usdc.safeTransfer(msg.sender, campaign.rewardPerUser);
        
        emit RewardClaimed(_campaignId, msg.sender, campaign.rewardPerUser);
        
        // Auto-complete if full
        if (campaign.participants >= campaign.maxParticipants) {
            campaign.status = CampaignStatus.COMPLETED;
            emit CampaignCompleted(_campaignId);
        }
    }
    
    /**
     * @notice Creator withdraws remaining funds after campaign ends
     */
    function withdrawRemaining(uint256 _campaignId) external nonReentrant onlyCreator(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.withdrawn, "Already withdrawn");
        require(
            campaign.status == CampaignStatus.COMPLETED || 
            block.timestamp > campaign.expiresAt,
            "Campaign active"
        );
        
        campaign.withdrawn = true;
        
        uint256 remaining = campaign.totalReward - (campaign.participants * campaign.rewardPerUser);
        
        if (remaining > 0) {
            usdc.safeTransfer(campaign.creator, remaining);
        }
        
        if (campaign.status != CampaignStatus.COMPLETED) {
            campaign.status = CampaignStatus.COMPLETED;
        }
    }
    
    /**
     * @notice Cancel campaign before anyone claims (creator only)
     */
    function cancelCampaign(uint256 _campaignId) external nonReentrant onlyCreator(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.status == CampaignStatus.ACTIVE, "Not active");
        require(campaign.participants == 0, "Already has participants");
        
        campaign.status = CampaignStatus.CANCELLED;
        campaign.withdrawn = true;
        
        uint256 totalAmount = campaign.totalReward + campaign.protocolFee;
        usdc.safeTransfer(campaign.creator, totalAmount);
        
        emit CampaignCancelled(_campaignId);
    }
    
    /**
     * @notice Owner withdraws accumulated protocol fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        
        // Calculate total locked in active/completed campaigns
        uint256 locked;
        for (uint256 i = 0; i < campaignCounter; i++) {
            Campaign storage c = campaigns[i];
            if (c.status == CampaignStatus.ACTIVE) {
                locked += c.totalReward - (c.participants * c.rewardPerUser);
                locked += c.protocolFee;
            }
        }
        
        uint256 available = balance > locked ? balance - locked : 0;
        require(available > 0, "No fees available");
        
        usdc.safeTransfer(owner(), available);
        totalFeesCollected += available;
        
        emit FeesWithdrawn(owner(), available);
    }
    
    /**
     * @notice Get campaign details
     */
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }
    
    /**
     * @notice Get all campaign IDs
     */
    function getCampaignCount() external view returns (uint256) {
        return campaignCounter;
    }
    
    /**
     * @notice Check if user has claimed
     */
    function hasUserClaimed(uint256 _campaignId, address _user) external view returns (bool) {
        return hasClaimed[_campaignId][_user];
    }
    
    /**
     * @notice Get participants for a campaign
     */
    function getParticipants(uint256 _campaignId) external view returns (address[] memory) {
        return participantsList[_campaignId];
    }
}
