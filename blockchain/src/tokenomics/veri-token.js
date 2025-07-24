const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * VeriToken (VERI) - ERC-20 Compatible Token with Marketplace Tokenomics
 * Implements burning and minting mechanisms for healthy token economy
 */
class VeriToken extends EventEmitter {
  constructor() {
    super();
    
    // Token properties
    this.name = 'VeriToken';
    this.symbol = 'VERI';
    this.decimals = 18;
    this.totalSupply = BigInt(1000000000) * BigInt(10 ** this.decimals); // 1 billion tokens
    this.maxSupply = BigInt(5000000000) * BigInt(10 ** this.decimals); // 5 billion max
    this.minSupply = BigInt(100000000) * BigInt(10 ** this.decimals); // 100 million min
    
    // Balances and allowances
    this.balances = new Map();
    this.allowances = new Map();
    
    // Tokenomics parameters
    this.tokenomics = {
      // Burning mechanisms
      transactionBurnRate: 0.001, // 0.1% burned per transaction
      verificationBurnRate: 0.0005, // 0.05% burned per verification
      stakingBurnRate: 0.0001, // 0.01% burned from staking rewards
      
      // Minting mechanisms
      validatorRewardRate: 0.0002, // 0.02% minted for validators
      loyaltyRewardRate: 0.0001, // 0.01% minted for loyal users
      developmentFundRate: 0.0001, // 0.01% minted for development
      
      // Economic controls
      maxBurnPerBlock: BigInt(1000000) * BigInt(10 ** this.decimals), // 1M tokens max burn per block
      maxMintPerBlock: BigInt(500000) * BigInt(10 ** this.decimals), // 500K tokens max mint per block
      burnToMintRatio: 2.0, // 2:1 burn to mint ratio for healthy deflation
      
      // Staking parameters
      stakingAPY: 0.05, // 5% annual percentage yield
      minStakingAmount: BigInt(1000) * BigInt(10 ** this.decimals), // 1000 VERI minimum
      stakingLockPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      
      // Governance parameters
      proposalCost: BigInt(10000) * BigInt(10 ** this.decimals), // 10,000 VERI to create proposal
      votingPower: BigInt(100) * BigInt(10 ** this.decimals), // 100 VERI = 1 vote
    };
    
    // Statistics tracking
    this.stats = {
      totalBurned: BigInt(0),
      totalMinted: BigInt(0),
      totalStaked: BigInt(0),
      totalTransactions: 0,
      totalVerifications: 0,
      activeStakers: 0,
      blockNumber: 0,
      burnEvents: [],
      mintEvents: [],
      stakingEvents: []
    };
    
    // Staking pools
    this.stakingPools = new Map();
    this.userStakes = new Map();
    
    // Governance
    this.proposals = new Map();
    this.votes = new Map();
    
    // Initialize with founder allocation
    this.initializeFounderAllocation();
  }

  /**
   * Initialize founder allocation (20% of total supply)
   */
  initializeFounderAllocation() {
    const founderAddress = 'veri_founder_address';
    const founderAllocation = this.totalSupply / BigInt(5); // 20%
    
    this.balances.set(founderAddress, founderAllocation);
    
    console.log(`📊 VeriToken initialized:`);
    console.log(`   Total Supply: ${this.formatTokens(this.totalSupply)} VERI`);
    console.log(`   Founder Allocation: ${this.formatTokens(founderAllocation)} VERI`);
    
    this.emit('Transfer', null, founderAddress, founderAllocation);
  }

  /**
   * Get token balance
   */
  balanceOf(address) {
    return this.balances.get(address) || BigInt(0);
  }

  /**
   * Transfer tokens
   */
  transfer(from, to, amount) {
    const fromBalance = this.balanceOf(from);
    const transferAmount = BigInt(amount);
    
    if (fromBalance < transferAmount) {
      throw new Error('Insufficient balance');
    }
    
    // Calculate burn amount
    const burnAmount = this.calculateTransactionBurn(transferAmount);
    const netTransferAmount = transferAmount - burnAmount;
    
    // Update balances
    this.balances.set(from, fromBalance - transferAmount);
    this.balances.set(to, this.balanceOf(to) + netTransferAmount);
    
    // Burn tokens
    if (burnAmount > 0) {
      this.burn(burnAmount, 'transaction_burn');
    }
    
    // Update statistics
    this.stats.totalTransactions++;
    
    console.log(`💸 Transfer: ${this.formatTokens(netTransferAmount)} VERI from ${from} to ${to}`);
    console.log(`🔥 Burned: ${this.formatTokens(burnAmount)} VERI`);
    
    this.emit('Transfer', from, to, netTransferAmount);
    
    return true;
  }

  /**
   * Approve token allowance
   */
  approve(owner, spender, amount) {
    const allowanceKey = `${owner}_${spender}`;
    this.allowances.set(allowanceKey, BigInt(amount));
    
    this.emit('Approval', owner, spender, BigInt(amount));
    return true;
  }

  /**
   * Get allowance
   */
  allowance(owner, spender) {
    const allowanceKey = `${owner}_${spender}`;
    return this.allowances.get(allowanceKey) || BigInt(0);
  }

  /**
   * Transfer from allowance
   */
  transferFrom(spender, from, to, amount) {
    const allowanceAmount = this.allowance(from, spender);
    const transferAmount = BigInt(amount);
    
    if (allowanceAmount < transferAmount) {
      throw new Error('Insufficient allowance');
    }
    
    // Execute transfer
    this.transfer(from, to, transferAmount);
    
    // Update allowance
    const allowanceKey = `${from}_${spender}`;
    this.allowances.set(allowanceKey, allowanceAmount - transferAmount);
    
    return true;
  }

  /**
   * Burn tokens (deflationary mechanism)
   */
  burn(amount, reason = 'manual_burn') {
    const burnAmount = BigInt(amount);
    
    if (this.totalSupply - burnAmount < this.minSupply) {
      throw new Error('Cannot burn below minimum supply');
    }
    
    // Check daily burn limit
    const dailyBurnLimit = this.tokenomics.maxBurnPerBlock * BigInt(24 * 60); // Assuming 1 block per minute
    if (burnAmount > dailyBurnLimit) {
      throw new Error('Burn amount exceeds daily limit');
    }
    
    // Burn tokens
    this.totalSupply -= burnAmount;
    this.stats.totalBurned += burnAmount;
    
    // Record burn event
    const burnEvent = {
      amount: burnAmount,
      reason: reason,
      timestamp: new Date().toISOString(),
      blockNumber: this.stats.blockNumber,
      totalSupplyAfter: this.totalSupply
    };
    
    this.stats.burnEvents.push(burnEvent);
    
    console.log(`🔥 Burned ${this.formatTokens(burnAmount)} VERI (${reason})`);
    console.log(`📊 Total Supply: ${this.formatTokens(this.totalSupply)} VERI`);
    
    this.emit('Burn', burnAmount, reason);
    
    return burnEvent;
  }

  /**
   * Mint tokens (controlled inflation)
   */
  mint(to, amount, reason = 'manual_mint') {
    const mintAmount = BigInt(amount);
    
    if (this.totalSupply + mintAmount > this.maxSupply) {
      throw new Error('Cannot mint above maximum supply');
    }
    
    // Check burn-to-mint ratio (skip for initial distribution and marketplace allocation)
    if (reason !== 'initial_distribution' && reason !== 'marketplace_allocation') {
      const totalBurnedRecent = this.getRecentBurnAmount();
      const maxMintAllowed = totalBurnedRecent / BigInt(Math.floor(this.tokenomics.burnToMintRatio * 100)) * BigInt(100);
      
      if (mintAmount > maxMintAllowed && totalBurnedRecent > 0) {
        throw new Error('Mint amount exceeds burn-to-mint ratio');
      }
    }
    
    // Mint tokens
    this.totalSupply += mintAmount;
    this.balances.set(to, this.balanceOf(to) + mintAmount);
    this.stats.totalMinted += mintAmount;
    
    // Record mint event
    const mintEvent = {
      to: to,
      amount: mintAmount,
      reason: reason,
      timestamp: new Date().toISOString(),
      blockNumber: this.stats.blockNumber,
      totalSupplyAfter: this.totalSupply
    };
    
    this.stats.mintEvents.push(mintEvent);
    
    console.log(`💰 Minted ${this.formatTokens(mintAmount)} VERI to ${to} (${reason})`);
    console.log(`📊 Total Supply: ${this.formatTokens(this.totalSupply)} VERI`);
    
    this.emit('Mint', to, mintAmount, reason);
    this.emit('Transfer', null, to, mintAmount);
    
    return mintEvent;
  }

  /**
   * Stake tokens for rewards
   */
  stake(staker, amount, duration = this.tokenomics.stakingLockPeriod) {
    const stakeAmount = BigInt(amount);
    
    if (stakeAmount < this.tokenomics.minStakingAmount) {
      throw new Error('Stake amount below minimum');
    }
    
    if (this.balanceOf(staker) < stakeAmount) {
      throw new Error('Insufficient balance for staking');
    }
    
    // Create stake
    const stakeId = crypto.randomUUID();
    const stake = {
      id: stakeId,
      staker: staker,
      amount: stakeAmount,
      duration: duration,
      startTime: Date.now(),
      endTime: Date.now() + duration,
      apy: this.tokenomics.stakingAPY,
      status: 'active'
    };
    
    // Update balances
    this.balances.set(staker, this.balanceOf(staker) - stakeAmount);
    this.stats.totalStaked += stakeAmount;
    
    // Store stake
    this.userStakes.set(stakeId, stake);
    
    if (!this.stakingPools.has(staker)) {
      this.stakingPools.set(staker, []);
      this.stats.activeStakers++;
    }
    this.stakingPools.get(staker).push(stakeId);
    
    console.log(`🔒 Staked ${this.formatTokens(stakeAmount)} VERI for ${duration / (24 * 60 * 60 * 1000)} days`);
    
    this.emit('Stake', staker, stakeAmount, duration);
    
    return stake;
  }

  /**
   * Unstake tokens and claim rewards
   */
  unstake(stakeId) {
    const stake = this.userStakes.get(stakeId);
    if (!stake) {
      throw new Error('Stake not found');
    }
    
    if (stake.status !== 'active') {
      throw new Error('Stake is not active');
    }
    
    const currentTime = Date.now();
    const isLockPeriodOver = currentTime >= stake.endTime;
    
    // Calculate rewards
    const stakingDuration = Math.min(currentTime - stake.startTime, stake.duration);
    const rewardAmount = this.calculateStakingReward(stake.amount, stakingDuration, stake.apy);
    
    // Apply penalty if unstaking early
    let penaltyAmount = BigInt(0);
    if (!isLockPeriodOver) {
      penaltyAmount = stake.amount / BigInt(20); // 5% penalty
      console.log(`⚠️ Early unstaking penalty: ${this.formatTokens(penaltyAmount)} VERI`);
    }
    
    // Calculate final amounts
    const finalStakeAmount = stake.amount - penaltyAmount;
    const finalRewardAmount = rewardAmount;
    
    // Update balances
    this.balances.set(stake.staker, this.balanceOf(stake.staker) + finalStakeAmount);
    this.stats.totalStaked -= stake.amount;
    
    // Mint rewards
    if (finalRewardAmount > 0) {
      this.mint(stake.staker, finalRewardAmount, 'staking_reward');
    }
    
    // Burn penalty
    if (penaltyAmount > 0) {
      this.burn(penaltyAmount, 'early_unstaking_penalty');
    }
    
    // Update stake status
    stake.status = 'completed';
    stake.completedAt = currentTime;
    stake.rewardAmount = finalRewardAmount;
    stake.penaltyAmount = penaltyAmount;
    
    console.log(`🔓 Unstaked ${this.formatTokens(finalStakeAmount)} VERI + ${this.formatTokens(finalRewardAmount)} VERI reward`);
    
    this.emit('Unstake', stake.staker, finalStakeAmount, finalRewardAmount, penaltyAmount);
    
    return stake;
  }

  /**
   * Process identity verification (burns tokens)
   */
  processVerification(verifier, subject, credentialType) {
    const verificationCost = this.getVerificationCost(credentialType);
    
    if (this.balanceOf(verifier) < verificationCost) {
      throw new Error('Insufficient balance for verification');
    }
    
    // Burn verification cost
    this.balances.set(verifier, this.balanceOf(verifier) - verificationCost);
    this.burn(verificationCost, 'verification_burn');
    
    // Mint validator reward
    const validatorReward = this.calculateValidatorReward(verificationCost);
    this.mint(verifier, validatorReward, 'validator_reward');
    
    this.stats.totalVerifications++;
    
    console.log(`✅ Verification processed: ${credentialType}`);
    console.log(`💰 Validator reward: ${this.formatTokens(validatorReward)} VERI`);
    
    this.emit('Verification', verifier, subject, credentialType, verificationCost, validatorReward);
    
    return {
      verificationCost,
      validatorReward,
      credentialType
    };
  }

  /**
   * Calculate transaction burn amount
   */
  calculateTransactionBurn(amount) {
    return BigInt(Math.floor(Number(amount) * this.tokenomics.transactionBurnRate));
  }

  /**
   * Calculate staking reward
   */
  calculateStakingReward(stakedAmount, duration, apy) {
    const annualReward = Number(stakedAmount) * apy;
    const durationInYears = duration / (365 * 24 * 60 * 60 * 1000);
    const rewardAmount = annualReward * durationInYears;
    
    return BigInt(Math.floor(rewardAmount));
  }

  /**
   * Calculate validator reward
   */
  calculateValidatorReward(verificationCost) {
    return BigInt(Math.floor(Number(verificationCost) * this.tokenomics.validatorRewardRate));
  }

  /**
   * Get verification cost based on credential type
   */
  getVerificationCost(credentialType) {
    const costs = {
      'basic_identity': BigInt(100) * BigInt(10 ** this.decimals),
      'kyc_level_1': BigInt(500) * BigInt(10 ** this.decimals),
      'kyc_level_2': BigInt(1000) * BigInt(10 ** this.decimals),
      'kyc_level_3': BigInt(2000) * BigInt(10 ** this.decimals),
      'business_verification': BigInt(1500) * BigInt(10 ** this.decimals),
      'product_authenticity': BigInt(300) * BigInt(10 ** this.decimals),
      'zkp_verification': BigInt(200) * BigInt(10 ** this.decimals)
    };
    
    return costs[credentialType] || BigInt(100) * BigInt(10 ** this.decimals);
  }

  /**
   * Get recent burn amount for burn-to-mint ratio calculation
   */
  getRecentBurnAmount() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentBurns = this.stats.burnEvents.filter(event => 
      new Date(event.timestamp).getTime() > oneDayAgo
    );
    
    return recentBurns.reduce((total, event) => total + event.amount, BigInt(0));
  }

  /**
   * Get tokenomics health metrics
   */
  getHealthMetrics() {
    const burnRate = Number(this.stats.totalBurned) / Number(this.stats.totalMinted || 1);
    const stakingRatio = Number(this.stats.totalStaked) / Number(this.totalSupply);
    const circulatingSupply = this.totalSupply - this.stats.totalStaked;
    
    return {
      totalSupply: this.totalSupply,
      circulatingSupply: circulatingSupply,
      totalBurned: this.stats.totalBurned,
      totalMinted: this.stats.totalMinted,
      totalStaked: this.stats.totalStaked,
      burnToMintRatio: burnRate,
      stakingRatio: stakingRatio,
      healthScore: this.calculateHealthScore(),
      priceStability: this.calculatePriceStability(),
      inflationRate: this.calculateInflationRate()
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore() {
    const burnToMintRatio = Number(this.stats.totalBurned) / Number(this.stats.totalMinted || 1);
    const stakingRatio = Number(this.stats.totalStaked) / Number(this.totalSupply);
    const supplyRatio = Number(this.totalSupply) / Number(this.maxSupply);
    
    // Ideal ranges
    const idealBurnToMint = 1.5; // Slightly deflationary
    const idealStakingRatio = 0.3; // 30% staked
    const idealSupplyRatio = 0.5; // 50% of max supply
    
    // Calculate component scores
    const burnScore = Math.max(0, 100 - Math.abs(burnToMintRatio - idealBurnToMint) * 50);
    const stakingScore = Math.max(0, 100 - Math.abs(stakingRatio - idealStakingRatio) * 200);
    const supplyScore = Math.max(0, 100 - Math.abs(supplyRatio - idealSupplyRatio) * 100);
    
    // Weighted average
    const healthScore = (burnScore * 0.4 + stakingScore * 0.3 + supplyScore * 0.3);
    
    return Math.round(healthScore);
  }

  /**
   * Calculate price stability metric
   */
  calculatePriceStability() {
    // Simplified price stability based on burn/mint balance
    const recentBurns = this.getRecentBurnAmount();
    const recentMints = this.stats.mintEvents
      .filter(event => new Date(event.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000)
      .reduce((total, event) => total + event.amount, BigInt(0));
    
    const stability = Number(recentBurns) / (Number(recentMints) + Number(recentBurns) + 1);
    return Math.round(stability * 100);
  }

  /**
   * Calculate inflation rate
   */
  calculateInflationRate() {
    const netMinted = this.stats.totalMinted - this.stats.totalBurned;
    const inflationRate = Number(netMinted) / Number(this.totalSupply);
    return Math.round(inflationRate * 10000) / 100; // Percentage with 2 decimal places
  }

  /**
   * Format tokens for display
   */
  formatTokens(amount) {
    const divisor = BigInt(10 ** this.decimals);
    const tokens = Number(amount) / Number(divisor);
    return tokens.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Get comprehensive token statistics
   */
  getStatistics() {
    return {
      tokenInfo: {
        name: this.name,
        symbol: this.symbol,
        decimals: this.decimals,
        totalSupply: this.totalSupply,
        maxSupply: this.maxSupply,
        minSupply: this.minSupply
      },
      metrics: this.getHealthMetrics(),
      stats: this.stats,
      tokenomics: this.tokenomics
    };
  }

  /**
   * Process daily rewards and maintenance
   */
  processDailyMaintenance() {
    console.log('🔄 Processing daily maintenance...');
    
    // Process staking rewards
    this.processStakingRewards();
    
    // Process loyalty rewards
    this.processLoyaltyRewards();
    
    // Update block number
    this.stats.blockNumber += 1440; // Assuming 1440 blocks per day
    
    console.log('✅ Daily maintenance completed');
  }

  /**
   * Process staking rewards
   */
  processStakingRewards() {
    let totalRewards = BigInt(0);
    
    this.userStakes.forEach(stake => {
      if (stake.status === 'active') {
        const dailyReward = this.calculateDailyStakingReward(stake.amount, stake.apy);
        if (dailyReward > 0) {
          this.mint(stake.staker, dailyReward, 'daily_staking_reward');
          totalRewards += dailyReward;
        }
      }
    });
    
    console.log(`💰 Total staking rewards: ${this.formatTokens(totalRewards)} VERI`);
  }

  /**
   * Process loyalty rewards
   */
  processLoyaltyRewards() {
    // This would be implemented based on user activity metrics
    console.log('🎁 Processing loyalty rewards...');
  }

  /**
   * Calculate daily staking reward
   */
  calculateDailyStakingReward(stakedAmount, apy) {
    const dailyRate = apy / 365;
    const dailyReward = Number(stakedAmount) * dailyRate;
    return BigInt(Math.floor(dailyReward));
  }
}

module.exports = VeriToken;
