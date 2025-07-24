const crypto = require('crypto');

/**
 * Ecogov_Lightchain Governance Token (LIGHT)
 * A governance token for the Ecogov_Lightchain ecosystem
 */
class LightGovernanceToken {
  constructor() {
    // Token Properties
    this.name = 'LIGHT';
    this.fullName = 'Ecogov_Lightchain Governance Token';
    this.symbol = 'LIGHT';
    this.decimals = 18;
    this.network = 'ecogov-lightchain';
    
    // Governance Settings
    this.totalSupply = BigInt(0);
    this.maxSupply = BigInt(1000000000) * BigInt(10 ** this.decimals); // 1 billion LIGHT
    this.circulatingSupply = BigInt(0);
    
    // Token Distribution
    this.balances = new Map();
    this.allowances = new Map();
    this.stakedBalances = new Map();
    
    // Governance Features
    this.proposals = new Map();
    this.votes = new Map();
    this.delegations = new Map();
    
    // Minting Controls
    this.mintingEnabled = true;
    this.mintingAuthority = 'ecogov-lightchain-dao';
    this.mintingHistory = [];
    
    // Economics
    this.stakingRewardRate = 0.08; // 8% annual staking reward
    this.governanceThreshold = BigInt(1000) * BigInt(10 ** this.decimals); // 1000 LIGHT to create proposal
    this.votingQuorum = 0.1; // 10% of total supply needed for quorum
    
    // Metrics
    this.totalHolders = 0;
    this.totalTransactions = 0;
    this.totalStakers = 0;
    
    console.log(`🌟 ${this.fullName} (${this.symbol}) initialized on ${this.network}`);
    console.log(`💎 Max Supply: ${this.formatTokens(this.maxSupply)} ${this.symbol}`);
  }

  /**
   * Mint new governance tokens
   */
  mint(to, amount, reason = 'governance_mint') {
    if (!this.mintingEnabled) {
      throw new Error('Minting is disabled');
    }

    const mintAmount = BigInt(amount);
    
    if (this.totalSupply + mintAmount > this.maxSupply) {
      throw new Error(`Minting would exceed max supply of ${this.formatTokens(this.maxSupply)} ${this.symbol}`);
    }

    // Update balances
    const currentBalance = this.balances.get(to) || BigInt(0);
    this.balances.set(to, currentBalance + mintAmount);
    
    // Update supplies
    this.totalSupply += mintAmount;
    this.circulatingSupply += mintAmount;
    
    // Track new holder
    if (currentBalance === BigInt(0)) {
      this.totalHolders++;
    }
    
    // Record minting
    const mintRecord = {
      id: crypto.randomUUID(),
      to: to,
      amount: mintAmount,
      reason: reason,
      timestamp: Date.now(),
      blockHeight: this.totalTransactions + 1
    };
    
    this.mintingHistory.push(mintRecord);
    this.totalTransactions++;
    
    console.log(`🪙 Minted ${this.formatTokens(mintAmount)} ${this.symbol} to ${to.substring(0, 20)}...`);
    console.log(`📈 Total Supply: ${this.formatTokens(this.totalSupply)} ${this.symbol}`);
    
    return mintRecord;
  }

  /**
   * Burn tokens (reduce supply)
   */
  burn(from, amount, reason = 'token_burn') {
    const burnAmount = BigInt(amount);
    const currentBalance = this.balances.get(from) || BigInt(0);
    
    if (currentBalance < burnAmount) {
      throw new Error('Insufficient balance to burn');
    }
    
    // Update balances
    this.balances.set(from, currentBalance - burnAmount);
    
    // Update supplies
    this.totalSupply -= burnAmount;
    this.circulatingSupply -= burnAmount;
    
    // Track if holder balance becomes zero
    if (this.balances.get(from) === BigInt(0)) {
      this.totalHolders--;
      this.balances.delete(from);
    }
    
    const burnRecord = {
      id: crypto.randomUUID(),
      from: from,
      amount: burnAmount,
      reason: reason,
      timestamp: Date.now()
    };
    
    this.totalTransactions++;
    
    console.log(`🔥 Burned ${this.formatTokens(burnAmount)} ${this.symbol} from ${from.substring(0, 20)}...`);
    console.log(`📉 Total Supply: ${this.formatTokens(this.totalSupply)} ${this.symbol}`);
    
    return burnRecord;
  }

  /**
   * Stake tokens for governance participation
   */
  stake(staker, amount) {
    const stakeAmount = BigInt(amount);
    const currentBalance = this.balances.get(staker) || BigInt(0);
    
    if (currentBalance < stakeAmount) {
      throw new Error('Insufficient balance to stake');
    }
    
    // Move tokens from balance to staked
    this.balances.set(staker, currentBalance - stakeAmount);
    
    const currentStaked = this.stakedBalances.get(staker) || BigInt(0);
    this.stakedBalances.set(staker, currentStaked + stakeAmount);
    
    if (currentStaked === BigInt(0)) {
      this.totalStakers++;
    }
    
    const stakeRecord = {
      id: crypto.randomUUID(),
      staker: staker,
      amount: stakeAmount,
      timestamp: Date.now(),
      apy: this.stakingRewardRate
    };
    
    console.log(`🔒 Staked ${this.formatTokens(stakeAmount)} ${this.symbol} from ${staker.substring(0, 20)}...`);
    
    return stakeRecord;
  }

  /**
   * Unstake tokens
   */
  unstake(staker, amount) {
    const unstakeAmount = BigInt(amount);
    const currentStaked = this.stakedBalances.get(staker) || BigInt(0);
    
    if (currentStaked < unstakeAmount) {
      throw new Error('Insufficient staked balance');
    }
    
    // Calculate staking rewards (simplified)
    const stakingTime = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const rewardAmount = (unstakeAmount * BigInt(Math.floor(this.stakingRewardRate * 1000))) / BigInt(1000);
    
    // Move tokens back to balance with rewards
    const currentBalance = this.balances.get(staker) || BigInt(0);
    this.balances.set(staker, currentBalance + unstakeAmount + rewardAmount);
    
    // Update staked balance
    this.stakedBalances.set(staker, currentStaked - unstakeAmount);
    
    if (this.stakedBalances.get(staker) === BigInt(0)) {
      this.totalStakers--;
      this.stakedBalances.delete(staker);
    }
    
    // Mint reward tokens
    this.mint(staker, rewardAmount, 'staking_reward');
    
    console.log(`🔓 Unstaked ${this.formatTokens(unstakeAmount)} ${this.symbol} + ${this.formatTokens(rewardAmount)} reward`);
    
    return { unstakeAmount, rewardAmount };
  }

  /**
   * Create a governance proposal
   */
  createProposal(proposer, proposalData) {
    const proposerBalance = this.balances.get(proposer) || BigInt(0);
    const proposerStaked = this.stakedBalances.get(proposer) || BigInt(0);
    const totalVotingPower = proposerBalance + proposerStaked;
    
    if (totalVotingPower < this.governanceThreshold) {
      throw new Error(`Insufficient voting power. Need ${this.formatTokens(this.governanceThreshold)} ${this.symbol}`);
    }
    
    const proposal = {
      id: crypto.randomUUID(),
      proposer: proposer,
      title: proposalData.title,
      description: proposalData.description,
      category: proposalData.category || 'general',
      type: proposalData.type || 'proposal', // proposal, amendment, treasury
      votingPeriod: proposalData.votingPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
      endTime: Date.now() + (proposalData.votingPeriod || 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      votes: {
        for: BigInt(0),
        against: BigInt(0),
        abstain: BigInt(0)
      },
      voters: new Set(),
      requiredQuorum: BigInt(Math.floor(Number(this.totalSupply) * this.votingQuorum))
    };
    
    this.proposals.set(proposal.id, proposal);
    
    console.log(`📋 Proposal created: ${proposal.title}`);
    console.log(`🗳️ Voting ends: ${new Date(proposal.endTime).toISOString()}`);
    
    return proposal;
  }

  /**
   * Vote on a proposal
   */
  vote(voter, proposalId, voteType, weight = null) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    if (proposal.status !== 'active' || Date.now() > proposal.endTime) {
      throw new Error('Voting period has ended');
    }
    
    if (proposal.voters.has(voter)) {
      throw new Error('Already voted on this proposal');
    }
    
    // Calculate voting power (balance + staked tokens)
    const balance = this.balances.get(voter) || BigInt(0);
    const staked = this.stakedBalances.get(voter) || BigInt(0);
    const votingPower = weight ? BigInt(weight) : balance + staked;
    
    if (votingPower === BigInt(0)) {
      throw new Error('No voting power');
    }
    
    // Record vote
    const voteRecord = {
      id: crypto.randomUUID(),
      voter: voter,
      proposalId: proposalId,
      voteType: voteType, // 'for', 'against', 'abstain'
      votingPower: votingPower,
      timestamp: Date.now()
    };
    
    // Update proposal votes
    proposal.votes[voteType] += votingPower;
    proposal.voters.add(voter);
    
    this.votes.set(voteRecord.id, voteRecord);
    
    console.log(`🗳️ Vote cast: ${voteType} with ${this.formatTokens(votingPower)} ${this.symbol} voting power`);
    
    // Check if proposal reaches quorum
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    if (totalVotes >= proposal.requiredQuorum) {
      console.log(`✅ Proposal ${proposalId} has reached quorum!`);
    }
    
    return voteRecord;
  }

  /**
   * Finalize a proposal
   */
  finalizeProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    if (Date.now() < proposal.endTime) {
      throw new Error('Voting period not yet ended');
    }
    
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    const passed = proposal.votes.for > proposal.votes.against && totalVotes >= proposal.requiredQuorum;
    
    proposal.status = passed ? 'passed' : 'failed';
    proposal.finalizedAt = Date.now();
    
    console.log(`📊 Proposal ${passed ? 'PASSED' : 'FAILED'}: ${proposal.title}`);
    console.log(`   For: ${this.formatTokens(proposal.votes.for)} ${this.symbol}`);
    console.log(`   Against: ${this.formatTokens(proposal.votes.against)} ${this.symbol}`);
    console.log(`   Abstain: ${this.formatTokens(proposal.votes.abstain)} ${this.symbol}`);
    
    return { proposalId, passed, totalVotes, proposal };
  }

  /**
   * Get token balance
   */
  balanceOf(address) {
    return this.balances.get(address) || BigInt(0);
  }

  /**
   * Get staked balance
   */
  stakedBalanceOf(address) {
    return this.stakedBalances.get(address) || BigInt(0);
  }

  /**
   * Get total voting power (balance + staked)
   */
  votingPowerOf(address) {
    return this.balanceOf(address) + this.stakedBalanceOf(address);
  }

  /**
   * Format token amounts for display
   */
  formatTokens(amount) {
    const divisor = BigInt(10 ** this.decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    
    if (fraction === BigInt(0)) {
      return whole.toString();
    }
    
    const fractionStr = fraction.toString().padStart(this.decimals, '0');
    const trimmed = fractionStr.replace(/0+$/, '');
    
    return trimmed ? `${whole}.${trimmed}` : whole.toString();
  }

  /**
   * Get comprehensive governance statistics
   */
  getGovernanceStats() {
    const activeProposals = Array.from(this.proposals.values()).filter(p => p.status === 'active').length;
    const totalProposals = this.proposals.size;
    const totalVotes = this.votes.size;
    
    return {
      // Token Economics
      tokenInfo: {
        name: this.fullName,
        symbol: this.symbol,
        decimals: this.decimals,
        network: this.network
      },
      
      // Supply Metrics
      supply: {
        total: this.totalSupply,
        circulating: this.circulatingSupply,
        max: this.maxSupply,
        utilization: Number(this.totalSupply * BigInt(100) / this.maxSupply)
      },
      
      // Staking Metrics
      staking: {
        totalStaked: Array.from(this.stakedBalances.values()).reduce((a, b) => a + b, BigInt(0)),
        totalStakers: this.totalStakers,
        stakingRate: this.stakingRewardRate,
        stakingRatio: this.totalStakers > 0 ? 
          Number(Array.from(this.stakedBalances.values()).reduce((a, b) => a + b, BigInt(0)) * BigInt(100) / this.totalSupply) : 0
      },
      
      // Governance Metrics
      governance: {
        activeProposals: activeProposals,
        totalProposals: totalProposals,
        totalVotes: totalVotes,
        governanceThreshold: this.governanceThreshold,
        votingQuorum: this.votingQuorum,
        participationRate: totalProposals > 0 ? (totalVotes / totalProposals) : 0
      },
      
      // Network Metrics
      network: {
        totalHolders: this.totalHolders,
        totalTransactions: this.totalTransactions,
        mintingEnabled: this.mintingEnabled,
        mintingHistory: this.mintingHistory.length
      }
    };
  }
}

module.exports = LightGovernanceToken;
