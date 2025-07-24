// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeriTokenV2
 * @dev Enhanced VeriToken (VERI) with Developer Allocation & Marketplace Integration
 * @notice Implements proper tokenomics with developer rewards and commission system
 * @author Ronirei Light - Creator & Lead Developer
 */
contract VeriTokenV2 is ERC20, ERC20Burnable, Ownable, Pausable, ReentrancyGuard {
    
    // Token Properties
    string private constant TOKEN_NAME = "VeriToken";
    string private constant TOKEN_SYMBOL = "VERI";
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion max
    uint256 public constant MIN_SUPPLY = 100_000_000 * 10**18; // 100 million min
    uint256 public constant INITIAL_SUPPLY = 2_000_000_000 * 10**18; // 2 billion initial
    
    // Developer & Team Allocation (Ronirei Light)
    address public constant DEVELOPER_ADDRESS = 0x568b65e3C2572f355d08c284348C492856a95F88;
    uint256 public constant DEVELOPER_ALLOCATION = 400_000_000 * 10**18; // 400M VERI (20%)
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18; // 200M VERI (10%)
    uint256 public constant ECOSYSTEM_ALLOCATION = 600_000_000 * 10**18; // 600M VERI (30%)
    uint256 public constant PUBLIC_ALLOCATION = 400_000_000 * 10**18; // 400M VERI (20%)
    uint256 public constant STAKING_REWARDS = 400_000_000 * 10**18; // 400M VERI (20%)
    
    // Commission & Revenue Sharing
    struct CommissionConfig {
        uint256 developerCommissionRate; // 10% = 1000 (basis points)
        uint256 marketplaceCommissionRate; // 2.5% = 250
        uint256 stakingRewardRate; // 5% = 500
        uint256 burnRate; // 0.1% = 10
        bool commissionActive;
    }
    
    CommissionConfig public commissionConfig;
    
    // Developer Commission Tracking
    struct DeveloperCommission {
        uint256 totalEarned;
        uint256 totalClaimed;
        uint256 pending;
        uint256 lastClaimTime;
        uint256 transactionCount;
    }
    
    DeveloperCommission public developerCommission;
    
    // Tokenomics Parameters
    struct TokenomicsConfig {
        uint256 transactionBurnRate; // 0.1% = 100 (basis points)
        uint256 verificationBurnRate; // 0.05% = 50
        uint256 stakingBurnRate; // 0.01% = 10
        uint256 validatorRewardRate; // 0.02% = 20
        uint256 loyaltyRewardRate; // 0.01% = 10
        uint256 developmentFundRate; // 1% = 100
        uint256 maxBurnPerBlock; // 1M tokens
        uint256 maxMintPerBlock; // 500K tokens
        uint256 burnToMintRatio; // 200 = 2.0 ratio
        uint256 stakingAPY; // 500 = 5%
        uint256 minStakingAmount; // 1000 VERI minimum
        uint256 stakingLockPeriod; // 30 days in seconds
        uint256 proposalCost; // 10,000 VERI to create proposal
        uint256 votingPower; // 100 VERI = 1 vote
    }
    
    TokenomicsConfig public tokenomics;
    
    // Statistics
    struct TokenStats {
        uint256 totalBurned;
        uint256 totalMinted;
        uint256 totalStaked;
        uint256 totalTransactions;
        uint256 totalVerifications;
        uint256 activeStakers;
        uint256 blockNumber;
        uint256 totalCommissionsPaid;
        uint256 totalMarketplaceVolume;
    }
    
    TokenStats public stats;
    
    // Staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 apy;
        bool active;
    }
    
    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public stakedBalances;
    
    // Verification costs
    mapping(string => uint256) public verificationCosts;
    
    // Allocation tracking
    mapping(address => uint256) public allocatedTokens;
    mapping(address => uint256) public claimedTokens;
    mapping(address => bool) public isAllocated;
    
    // Events
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensStaked(address indexed staker, uint256 amount, uint256 duration);
    event TokensUnstaked(address indexed staker, uint256 amount, uint256 rewards, uint256 penalty);
    event VerificationProcessed(address indexed verifier, address indexed subject, string credentialType, uint256 cost, uint256 reward);
    event TokenomicsUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event DeveloperCommissionPaid(address indexed developer, uint256 amount, uint256 transactionVolume);
    event AllocationClaimed(address indexed recipient, uint256 amount, string allocationType);
    event CommissionConfigUpdated(uint256 developerRate, uint256 marketplaceRate, bool active);
    
    constructor() ERC20(TOKEN_NAME, TOKEN_SYMBOL) Ownable(msg.sender) {
        // Initialize tokenomics
        tokenomics = TokenomicsConfig({
            transactionBurnRate: 100, // 0.1%
            verificationBurnRate: 50, // 0.05%
            stakingBurnRate: 10, // 0.01%
            validatorRewardRate: 20, // 0.02%
            loyaltyRewardRate: 10, // 0.01%
            developmentFundRate: 100, // 1%
            maxBurnPerBlock: 1_000_000 * 10**18, // 1M tokens
            maxMintPerBlock: 500_000 * 10**18, // 500K tokens
            burnToMintRatio: 200, // 2.0 ratio
            stakingAPY: 500, // 5%
            minStakingAmount: 1000 * 10**18, // 1000 VERI
            stakingLockPeriod: 30 days,
            proposalCost: 10_000 * 10**18, // 10,000 VERI
            votingPower: 100 * 10**18 // 100 VERI = 1 vote
        });
        
        // Initialize commission configuration
        commissionConfig = CommissionConfig({
            developerCommissionRate: 1000, // 10%
            marketplaceCommissionRate: 250, // 2.5%
            stakingRewardRate: 500, // 5%
            burnRate: 10, // 0.1%
            commissionActive: true
        });
        
        // Initialize verification costs
        verificationCosts["basic_identity"] = 100 * 10**18;
        verificationCosts["kyc_level_1"] = 500 * 10**18;
        verificationCosts["kyc_level_2"] = 1000 * 10**18;
        verificationCosts["kyc_level_3"] = 2000 * 10**18;
        verificationCosts["business_verification"] = 1500 * 10**18;
        verificationCosts["product_authenticity"] = 300 * 10**18;
        verificationCosts["zkp_verification"] = 200 * 10**18;
        
        // Set up allocations
        _setupAllocations();
        
        // Mint initial supply to allocations
        _mintInitialAllocations();
    }
    
    /**
     * @dev Setup token allocations for different stakeholders
     */
    function _setupAllocations() internal {
        // Developer allocation (Ronirei Light)
        allocatedTokens[DEVELOPER_ADDRESS] = DEVELOPER_ALLOCATION;
        isAllocated[DEVELOPER_ADDRESS] = true;
        
        // Team allocation (to be distributed by owner)
        allocatedTokens[owner()] = TEAM_ALLOCATION;
        isAllocated[owner()] = true;
        
        // Ecosystem allocation (for partnerships, grants, etc.)
        allocatedTokens[address(this)] = ECOSYSTEM_ALLOCATION + STAKING_REWARDS;
        isAllocated[address(this)] = true;
    }
    
    /**
     * @dev Mint initial allocations
     */
    function _mintInitialAllocations() internal {
        // Mint developer allocation directly to developer address
        _mint(DEVELOPER_ADDRESS, DEVELOPER_ALLOCATION);
        claimedTokens[DEVELOPER_ADDRESS] = DEVELOPER_ALLOCATION;
        stats.totalMinted += DEVELOPER_ALLOCATION;
        
        // Mint ecosystem and staking rewards to contract
        uint256 contractAllocation = ECOSYSTEM_ALLOCATION + STAKING_REWARDS;
        _mint(address(this), contractAllocation);
        claimedTokens[address(this)] = contractAllocation;
        stats.totalMinted += contractAllocation;
        
        emit TokensMinted(DEVELOPER_ADDRESS, DEVELOPER_ALLOCATION, "developer_allocation");
        emit TokensMinted(address(this), contractAllocation, "ecosystem_and_staking_allocation");
        emit AllocationClaimed(DEVELOPER_ADDRESS, DEVELOPER_ALLOCATION, "DEVELOPER");
    }
    
    /**
     * @dev Process marketplace transaction and pay developer commission
     */
    function processMarketplaceTransaction(
        address buyer,
        address seller,
        uint256 transactionAmount
    ) external onlyOwner whenNotPaused {
        require(commissionConfig.commissionActive, "Commission system inactive");
        require(transactionAmount > 0, "Transaction amount must be positive");
        
        // Calculate developer commission (10%)
        uint256 devCommissionAmount = (transactionAmount * commissionConfig.developerCommissionRate) / 10000;
        
        // Calculate marketplace commission (2.5%)
        uint256 marketplaceCommission = (transactionAmount * commissionConfig.marketplaceCommissionRate) / 10000;
        
        // Calculate burn amount (0.1%)
        uint256 burnAmount = (transactionAmount * commissionConfig.burnRate) / 10000;
        
        // Update developer commission tracking
        developerCommission.totalEarned += devCommissionAmount;
        developerCommission.pending += devCommissionAmount;
        developerCommission.transactionCount++;
        
        // Update statistics
        stats.totalTransactions++;
        stats.totalMarketplaceVolume += transactionAmount;
        stats.totalCommissionsPaid += devCommissionAmount + marketplaceCommission;
        
        // Mint developer commission if supply allows
        if (totalSupply() + devCommissionAmount <= MAX_SUPPLY) {
            _mint(DEVELOPER_ADDRESS, devCommissionAmount);
            stats.totalMinted += devCommissionAmount;
            emit TokensMinted(DEVELOPER_ADDRESS, devCommissionAmount, "developer_commission");
            emit DeveloperCommissionPaid(DEVELOPER_ADDRESS, devCommissionAmount, transactionAmount);
        }
        
        // Mint marketplace commission to contract
        if (totalSupply() + marketplaceCommission <= MAX_SUPPLY) {
            _mint(address(this), marketplaceCommission);
            stats.totalMinted += marketplaceCommission;
            emit TokensMinted(address(this), marketplaceCommission, "marketplace_commission");
        }
        
        // Burn tokens if minimum supply is maintained
        if (burnAmount > 0 && totalSupply() - burnAmount >= MIN_SUPPLY) {
            _burn(address(this), burnAmount);
            stats.totalBurned += burnAmount;
            emit TokensBurned(address(this), burnAmount, "marketplace_transaction_burn");
        }
    }
    
    /**
     * @dev Claim pending developer commission
     */
    function claimDeveloperCommission() external {
        require(msg.sender == DEVELOPER_ADDRESS, "Only developer can claim commission");
        require(developerCommission.pending > 0, "No pending commission");
        
        uint256 claimAmount = developerCommission.pending;
        developerCommission.pending = 0;
        developerCommission.totalClaimed += claimAmount;
        developerCommission.lastClaimTime = block.timestamp;
        
        // Commission already minted during transaction processing
        emit AllocationClaimed(DEVELOPER_ADDRESS, claimAmount, "COMMISSION");
    }
    
    /**
     * @dev Get developer commission info
     */
    function getDeveloperCommissionInfo() external view returns (
        uint256 totalEarned,
        uint256 totalClaimed,
        uint256 pending,
        uint256 lastClaimTime,
        uint256 transactionCount
    ) {
        return (
            developerCommission.totalEarned,
            developerCommission.totalClaimed,
            developerCommission.pending,
            developerCommission.lastClaimTime,
            developerCommission.transactionCount
        );
    }
    
    /**
     * @dev Claim team allocation (owner only)
     */
    function claimTeamAllocation(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(allocatedTokens[owner()] >= amount, "Insufficient team allocation");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        allocatedTokens[owner()] -= amount;
        claimedTokens[recipient] += amount;
        
        _mint(recipient, amount);
        stats.totalMinted += amount;
        
        emit TokensMinted(recipient, amount, "team_allocation");
        emit AllocationClaimed(recipient, amount, "TEAM");
    }
    
    /**
     * @dev Override transfer to include optional burn mechanism
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return _transferWithOptionalBurn(msg.sender, to, amount);
    }
    
    /**
     * @dev Override transferFrom to include optional burn mechanism
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        return _transferWithOptionalBurn(from, to, amount);
    }
    
    /**
     * @dev Internal transfer with optional burn mechanism
     */
    function _transferWithOptionalBurn(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        
        // Skip burn for developer and contract addresses to avoid complications
        if (from == DEVELOPER_ADDRESS || from == address(this) || to == address(this)) {
            _transfer(from, to, amount);
            stats.totalTransactions++;
            return true;
        }
        
        uint256 burnAmount = (amount * tokenomics.transactionBurnRate) / 10000;
        uint256 transferAmount = amount - burnAmount;
        
        // Burn tokens if minimum supply is maintained
        if (burnAmount > 0 && totalSupply() - burnAmount >= MIN_SUPPLY) {
            _burn(from, burnAmount);
            stats.totalBurned += burnAmount;
            emit TokensBurned(from, burnAmount, "transaction_burn");
        } else {
            transferAmount = amount; // No burn if would go below min supply
        }
        
        // Transfer remaining amount
        _transfer(from, to, transferAmount);
        stats.totalTransactions++;
        
        return true;
    }
    
    /**
     * @dev Mint new tokens (controlled inflation)
     */
    function mint(address to, uint256 amount, string memory reason) external onlyOwner whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        require(amount <= tokenomics.maxMintPerBlock, "Exceeds per-block mint limit");
        
        _mint(to, amount);
        stats.totalMinted += amount;
        
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Update commission configuration (owner only)
     */
    function updateCommissionConfig(
        uint256 developerRate,
        uint256 marketplaceRate,
        uint256 stakingRate,
        uint256 burnRate,
        bool active
    ) external onlyOwner {
        require(developerRate <= 2000, "Developer rate too high"); // Max 20%
        require(marketplaceRate <= 1000, "Marketplace rate too high"); // Max 10%
        require(stakingRate <= 1000, "Staking rate too high"); // Max 10%
        require(burnRate <= 100, "Burn rate too high"); // Max 1%
        
        commissionConfig.developerCommissionRate = developerRate;
        commissionConfig.marketplaceCommissionRate = marketplaceRate;
        commissionConfig.stakingRewardRate = stakingRate;
        commissionConfig.burnRate = burnRate;
        commissionConfig.commissionActive = active;
        
        emit CommissionConfigUpdated(developerRate, marketplaceRate, active);
    }
    
    /**
     * @dev Get comprehensive token statistics
     */
    function getTokenStatistics() external view returns (
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _minSupply,
        uint256 _totalBurned,
        uint256 _totalMinted,
        uint256 _totalStaked,
        uint256 _totalTransactions,
        uint256 _totalVerifications,
        uint256 _activeStakers,
        uint256 _totalCommissionsPaid,
        uint256 _totalMarketplaceVolume
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            MIN_SUPPLY,
            stats.totalBurned,
            stats.totalMinted,
            stats.totalStaked,
            stats.totalTransactions,
            stats.totalVerifications,
            stats.activeStakers,
            stats.totalCommissionsPaid,
            stats.totalMarketplaceVolume
        );
    }
    
    /**
     * @dev Get allocation information
     */
    function getAllocationInfo(address account) external view returns (
        uint256 allocated,
        uint256 claimed,
        uint256 remaining,
        bool isEligible
    ) {
        return (
            allocatedTokens[account],
            claimedTokens[account],
            allocatedTokens[account] - claimedTokens[account],
            isAllocated[account]
        );
    }
    
    /**
     * @dev Calculate health score (0-100)
     */
    function calculateHealthScore() external view returns (uint256) {
        if (stats.totalMinted == 0) return 50; // Neutral score for new token
        
        uint256 burnToMintRatio = (stats.totalBurned * 100) / stats.totalMinted;
        uint256 stakingRatio = (stats.totalStaked * 100) / totalSupply();
        uint256 supplyRatio = (totalSupply() * 100) / MAX_SUPPLY;
        uint256 transactionRatio = stats.totalTransactions > 0 ? 100 : 0;
        
        // Scoring based on ideal ranges
        uint256 burnScore = burnToMintRatio > 150 ? 100 : (burnToMintRatio * 100) / 150;
        uint256 stakingScore = stakingRatio > 30 ? 100 : (stakingRatio * 100) / 30;
        uint256 supplyScore = supplyRatio < 50 ? 100 : (100 - supplyRatio);
        uint256 activityScore = transactionRatio;
        
        return (burnScore * 25 + stakingScore * 25 + supplyScore * 25 + activityScore * 25) / 100;
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
