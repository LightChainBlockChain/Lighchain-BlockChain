const VeriTokenMarketplace = require('../index');
const { VerifiableCredential, MarketplaceCredentials } = require('../credentials/verifiable-credential');
const LightGovernanceToken = require('../tokenomics/governance-token');

/**
 * Ecogov_Lightchain Sideline_Pinas Marketplace with Governance
 * Extends the existing VeriToken Marketplace with social features and governance
 */
class SidelinePinasMarketplace extends VeriTokenMarketplace {
  constructor() {
    super();
    
    // Initialize Light Governance Token
    this.governanceToken = new LightGovernanceToken('EcoGov Light', 'LGT', 18, 1000000);
    
    // Sideline_Pinas-style features
    this.creators = new Map();
    this.content = new Map();
    this.affiliations = new Map();
    this.follows = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.challenges = new Map();
    this.trends = new Map();
    
    // Affiliation program data
    this.affiliatePrograms = new Map();
    this.commissionRules = new Map();
    this.payouts = new Map();
    
    // Governance features
    this.governanceProposals = new Map();
    this.votingPools = new Map();
    
    console.log('🎵 Ecogov_Lightchain Sideline_Pinas marketplace initialized!');
    console.log('💰 Affiliation program ready!');
    console.log('🏛️ Light Governance Token system active!');
  }

  /**
   * Create a content creator profile
   */
  async createCreator(personalInfo, contentCategories = []) {
    const creator = await this.createEntity('customer', {
      profile: {
        kycLevel: 'creator',
        isContentCreator: true,
        contentCategories: contentCategories,
        creatorStats: {
          followers: 0,
          totalViews: 0,
          totalLikes: 0,
          contentCount: 0,
          verificationLevel: 'pending'
        },
        personalInfo: personalInfo
      }
    });

    // Allocate initial creator tokens
    const initialTokens = this.allocateTokens(creator.id, 100);
    
    this.creators.set(creator.id, {
      did: creator.id,
      profile: creator,
      stats: creator.profile.creatorStats,
      content: [],
      affiliations: []
    });

    console.log(`🎭 Creator profile created: ${creator.id}`);
    console.log(`💰 Initial tokens allocated: ${this.veriToken.formatTokens(initialTokens)} VERI`);
    
    return creator;
  }

  /**
   * Create short-form content (Sideline_Pinas-style)
   */
  async createContent(creatorDID, contentData) {
    const creator = this.creators.get(creatorDID);
    if (!creator) {
      throw new Error('Creator not found');
    }

    const content = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorDID: creatorDID,
      type: contentData.type || 'video', // video, image, carousel
      title: contentData.title,
      description: contentData.description,
      tags: contentData.tags || [],
      duration: contentData.duration || 0, // in seconds
      thumbnail: contentData.thumbnail,
      mediaUrl: contentData.mediaUrl,
      category: contentData.category,
      isSponsored: contentData.isSponsored || false,
      sponsoredProducts: contentData.sponsoredProducts || [],
      affiliateLinks: contentData.affiliateLinks || [],
      timestamp: Date.now(),
      stats: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        saves: 0,
        clickThroughs: 0
      },
      visibility: contentData.visibility || 'public', // public, followers, private
      challenges: contentData.challenges || [],
      trends: contentData.trends || []
    };

    this.content.set(content.id, content);
    creator.content.push(content.id);
    creator.stats.contentCount++;

    // Reward creator with tokens for content creation
    const contentReward = BigInt(10) * BigInt(10 ** this.veriToken.decimals);
    this.veriToken.mint(creatorDID, contentReward, 'content_creation');

    console.log(`🎬 Content created: ${content.id}`);
    console.log(`💰 Creator reward: ${this.veriToken.formatTokens(contentReward)} VERI`);

    // Process any affiliate links
    if (content.affiliateLinks.length > 0) {
      await this.processAffiliateContent(content.id);
    }

    return content;
  }

  /**
   * Create affiliate program for merchants
   */
  async createAffiliateProgram(merchantDID, programData) {
    const merchant = this.getEntity(merchantDID);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const program = {
      id: `affiliate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      merchantDID: merchantDID,
      name: programData.name,
      description: programData.description,
      products: programData.products || [], // Array of product DIDs
      commissionRates: {
        base: programData.commissionRate || 0.05, // 5% default
        tiers: programData.tiers || [
          { minSales: 0, rate: 0.05 },
          { minSales: 10, rate: 0.07 },
          { minSales: 50, rate: 0.10 },
          { minSales: 100, rate: 0.15 }
        ]
      },
      requirements: {
        minFollowers: programData.minFollowers || 1000,
        categories: programData.allowedCategories || [],
        kycLevel: programData.requiredKYC || 'basic'
      },
      payoutSchedule: programData.payoutSchedule || 'monthly', // weekly, monthly, quarterly
      isActive: true,
      stats: {
        totalAffiliates: 0,
        totalSales: 0,
        totalCommissionPaid: 0,
        conversionRate: 0
      },
      createdAt: Date.now()
    };

    this.affiliatePrograms.set(program.id, program);

    // Create commission rules
    const commissionRule = {
      programId: program.id,
      merchantDID: merchantDID,
      rules: program.commissionRates,
      trackingEnabled: true
    };
    this.commissionRules.set(program.id, commissionRule);

    console.log(`💼 Affiliate program created: ${program.id}`);
    console.log(`💰 Base commission rate: ${program.commissionRates.base * 100}%`);

    return program;
  }

  /**
   * Join affiliate program as a creator
   */
  async joinAffiliateProgram(creatorDID, programId, applicationData = {}) {
    const creator = this.creators.get(creatorDID);
    const program = this.affiliatePrograms.get(programId);

    if (!creator) throw new Error('Creator not found');
    if (!program) throw new Error('Affiliate program not found');

    // Check requirements
    if (creator.stats.followers < program.requirements.minFollowers) {
      throw new Error(`Insufficient followers. Required: ${program.requirements.minFollowers}`);
    }

    const affiliation = {
      id: `affiliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorDID: creatorDID,
      programId: programId,
      merchantDID: program.merchantDID,
      status: 'approved', // For demo purposes, auto-approve
      joinedAt: Date.now(),
      stats: {
        clicks: 0,
        conversions: 0,
        sales: 0,
        commissionsEarned: 0,
        currentTier: 0
      },
      personalizedLinks: this.generateAffiliateLinks(creatorDID, programId),
      application: applicationData
    };

    this.affiliations.set(affiliation.id, affiliation);
    creator.affiliations.push(affiliation.id);
    program.stats.totalAffiliates++;

    // Issue affiliate credential
    const affiliateCredential = await this.issueCredential(
      program.merchantDID,
      creatorDID,
      'affiliate',
      {
        programId: programId,
        programName: program.name,
        commissionRate: program.commissionRates.base,
        status: 'approved'
      }
    );

    console.log(`🤝 Joined affiliate program: ${programId}`);
    console.log(`🎫 Affiliate credential issued: ${affiliateCredential.id}`);

    return { affiliation, credential: affiliateCredential };
  }

  /**
   * Generate personalized affiliate links
   */
  generateAffiliateLinks(creatorDID, programId) {
    const program = this.affiliatePrograms.get(programId);
    const baseLinks = {};

    program.products.forEach(productDID => {
      const trackingId = `${creatorDID.split(':').pop().substr(0, 8)}_${productDID.split(':').pop().substr(0, 8)}`;
      baseLinks[productDID] = {
        shortUrl: `https://sideline.ph/p/${trackingId}`,
        trackingId: trackingId,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://sideline.ph/p/${trackingId}`
      };
    });

    return baseLinks;
  }

  /**
   * Track affiliate click and conversion
   */
  async trackAffiliateActivity(trackingId, activityType, metadata = {}) {
    // Find the affiliation by tracking ID
    let targetAffiliation = null;
    let targetProgram = null;

    for (const [affiliationId, affiliation] of this.affiliations) {
      for (const [productDID, linkData] of Object.entries(affiliation.personalizedLinks)) {
        if (linkData.trackingId === trackingId) {
          targetAffiliation = affiliation;
          targetProgram = this.affiliatePrograms.get(affiliation.programId);
          break;
        }
      }
      if (targetAffiliation) break;
    }

    if (!targetAffiliation) {
      throw new Error('Tracking ID not found');
    }

    const creator = this.creators.get(targetAffiliation.creatorDID);
    
    switch (activityType) {
      case 'click':
        targetAffiliation.stats.clicks++;
        // Reward small amount for click
        const clickReward = BigInt(1) * BigInt(10 ** (this.veriToken.decimals - 1)); // 0.1 VERI
        this.veriToken.mint(targetAffiliation.creatorDID, clickReward, 'affiliate_click');
        break;

      case 'conversion':
        targetAffiliation.stats.conversions++;
        targetAffiliation.stats.sales += metadata.amount || 0;
        
        // Calculate commission
        const saleAmount = metadata.amount || 0;
        const currentTier = this.getCurrentCommissionTier(targetAffiliation);
        const commissionRate = currentTier.rate;
        const commissionAmount = saleAmount * commissionRate;
        
        targetAffiliation.stats.commissionsEarned += commissionAmount;
        targetProgram.stats.totalSales += saleAmount;
        targetProgram.stats.totalCommissionPaid += commissionAmount;
        
        // Mint commission tokens
        const commissionTokens = BigInt(Math.floor(commissionAmount * 100)) * BigInt(10 ** (this.veriToken.decimals - 2));
        this.veriToken.mint(targetAffiliation.creatorDID, commissionTokens, 'affiliate_commission');
        
        console.log(`💰 Commission earned: $${commissionAmount.toFixed(2)} (${commissionRate * 100}%)`);
        console.log(`🪙 Commission tokens: ${this.veriToken.formatTokens(commissionTokens)} VERI`);
        
        // Create payout record
        await this.createPayoutRecord(targetAffiliation, commissionAmount, metadata);
        break;
    }

    console.log(`📊 Tracked ${activityType} for creator: ${creator.did.split(':').pop().substr(0, 8)}`);
    
    return {
      affiliation: targetAffiliation,
      activity: activityType,
      metadata: metadata
    };
  }

  /**
   * Get current commission tier for affiliate
   */
  getCurrentCommissionTier(affiliation) {
    const program = this.affiliatePrograms.get(affiliation.programId);
    const tiers = program.commissionRates.tiers;
    
    // Find the highest tier the affiliate qualifies for
    let currentTier = tiers[0];
    for (const tier of tiers) {
      if (affiliation.stats.conversions >= tier.minSales) {
        currentTier = tier;
      } else {
        break;
      }
    }
    
    return currentTier;
  }

  /**
   * Create payout record
   */
  async createPayoutRecord(affiliation, amount, metadata) {
    const payout = {
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      affiliationId: affiliation.id,
      creatorDID: affiliation.creatorDID,
      programId: affiliation.programId,
      amount: amount,
      currency: metadata.currency || 'USD',
      status: 'pending',
      createdAt: Date.now(),
      scheduledPayoutDate: this.calculateNextPayoutDate(affiliation.programId),
      transactionDetails: metadata
    };

    this.payouts.set(payout.id, payout);
    console.log(`💳 Payout scheduled: ${payout.id} - $${amount.toFixed(2)}`);
    
    return payout;
  }

  /**
   * Calculate next payout date based on program schedule
   */
  calculateNextPayoutDate(programId) {
    const program = this.affiliatePrograms.get(programId);
    const now = new Date();
    let nextPayout;

    switch (program.payoutSchedule) {
      case 'weekly':
        nextPayout = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextPayout = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'quarterly':
        nextPayout = new Date(now.getFullYear(), now.getMonth() + 3, 1);
        break;
      default:
        nextPayout = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return nextPayout.getTime();
  }

  /**
   * Process affiliate content for tracking
   */
  async processAffiliateContent(contentId) {
    const content = this.content.get(contentId);
    if (!content) return;

    // Add affiliate tracking to content
    content.affiliateData = {
      trackingEnabled: true,
      programs: [],
      estimatedEarnings: 0
    };

    // Link to affiliate programs
    for (const link of content.affiliateLinks) {
      const affiliation = Array.from(this.affiliations.values())
        .find(a => a.creatorDID === content.creatorDID);
      
      if (affiliation) {
        content.affiliateData.programs.push({
          programId: affiliation.programId,
          trackingId: link.trackingId || this.generateTrackingId(),
          productDID: link.productDID
        });
      }
    }

    console.log(`🔗 Affiliate tracking enabled for content: ${contentId}`);
  }

  /**
   * Follow a creator
   */
  async followCreator(followerDID, creatorDID) {
    const creator = this.creators.get(creatorDID);
    if (!creator) throw new Error('Creator not found');

    const followId = `${followerDID}_follows_${creatorDID}`;
    
    if (!this.follows.has(followId)) {
      this.follows.set(followId, {
        followerDID,
        creatorDID,
        timestamp: Date.now()
      });
      
      creator.stats.followers++;
      
      // Reward creator for gaining followers
      const followerReward = BigInt(5) * BigInt(10 ** (this.veriToken.decimals - 1)); // 0.5 VERI
      this.veriToken.mint(creatorDID, followerReward, 'follower_reward');
      
      console.log(`👥 New follower: ${followerDID} → ${creatorDID}`);
      console.log(`💰 Follower reward: ${this.veriToken.formatTokens(followerReward)} VERI`);
    }

    return this.follows.get(followId);
  }

  /**
   * Like content
   */
  async likeContent(userDID, contentId) {
    const content = this.content.get(contentId);
    if (!content) throw new Error('Content not found');

    const likeId = `${userDID}_likes_${contentId}`;
    
    if (!this.likes.has(likeId)) {
      this.likes.set(likeId, {
        userDID,
        contentId,
        timestamp: Date.now()
      });
      
      content.stats.likes++;
      
      const creator = this.creators.get(content.creatorDID);
      if (creator) {
        creator.stats.totalLikes++;
        
        // Reward creator for likes
        const likeReward = BigInt(1) * BigInt(10 ** (this.veriToken.decimals - 2)); // 0.01 VERI
        this.veriToken.mint(content.creatorDID, likeReward, 'content_like');
      }
      
      console.log(`❤️ Content liked: ${contentId}`);
    }

    return this.likes.get(likeId);
  }

  /**
   * Create a challenge
   */
  async createChallenge(creatorDID, challengeData) {
    const challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorDID: creatorDID,
      title: challengeData.title,
      description: challengeData.description,
      hashtag: challengeData.hashtag,
      rules: challengeData.rules || [],
      prizes: challengeData.prizes || [],
      startDate: challengeData.startDate || Date.now(),
      endDate: challengeData.endDate,
      isSponsored: challengeData.isSponsored || false,
      sponsorDID: challengeData.sponsorDID,
      participants: [],
      stats: {
        totalParticipants: 0,
        totalViews: 0,
        totalSubmissions: 0
      }
    };

    this.challenges.set(challenge.id, challenge);
    console.log(`🏆 Challenge created: ${challenge.title} (#${challenge.hashtag})`);
    
    return challenge;
  }

  /**
   * Get trending content
   */
  getTrendingContent(limit = 10) {
    const contents = Array.from(this.content.values())
      .sort((a, b) => {
        // Trending algorithm: likes + shares + comments - age penalty
        const scoreA = a.stats.likes * 2 + a.stats.shares * 3 + a.stats.comments * 1.5 
          - (Date.now() - a.timestamp) / (1000 * 60 * 60); // Hour penalty
        const scoreB = b.stats.likes * 2 + b.stats.shares * 3 + b.stats.comments * 1.5 
          - (Date.now() - b.timestamp) / (1000 * 60 * 60);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return contents;
  }

  /**
   * Get marketplace analytics
   */
  getAnalytics() {
    const baseStats = this.getStatistics();
    
    const sidelinePinasStats = {
      creators: this.creators.size,
      totalContent: this.content.size,
      totalFollows: this.follows.size,
      totalLikes: this.likes.size,
      affiliatePrograms: this.affiliatePrograms.size,
      activeAffiliations: Array.from(this.affiliations.values()).filter(a => a.status === 'approved').length,
      totalCommissionsPaid: Array.from(this.affiliatePrograms.values())
        .reduce((sum, p) => sum + p.stats.totalCommissionPaid, 0),
      challenges: this.challenges.size,
      topCreators: Array.from(this.creators.values())
        .sort((a, b) => b.stats.followers - a.stats.followers)
        .slice(0, 5)
        .map(c => ({
          did: c.did.split(':').pop().substr(0, 8),
          followers: c.stats.followers,
          content: c.stats.contentCount
        }))
    };

    return {
      ...baseStats,
      sidelinePinasMarketplace: sidelinePinasStats
    };
  }

  /**
   * Generate unique tracking ID
   */
  generateTrackingId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Create governance proposal
   */
  async createGovernanceProposal(creatorDID, proposalData) {
    const creator = this.creators.get(creatorDID);
    if (!creator) throw new Error('Creator not found');

    // Check if creator has minimum governance tokens to create proposal
    const balance = this.governanceToken.balanceOf(creatorDID);
    const minimumTokens = BigInt(1000) * BigInt(10 ** this.governanceToken.decimals);
    
    if (balance < minimumTokens) {
      throw new Error('Insufficient governance tokens to create proposal');
    }

    const proposal = await this.governanceToken.createProposal(
      creatorDID,
      proposalData.title,
      proposalData.description,
      proposalData.category || 'general',
      proposalData.executionData
    );

    this.governanceProposals.set(proposal.id, {
      ...proposal,
      marketplaceContext: {
        creatorProfile: creator.did.split(':').pop().substr(0, 8),
        proposalType: proposalData.type || 'community',
        affectedFeatures: proposalData.affectedFeatures || [],
        impact: proposalData.impact || 'low'
      }
    });

    console.log(`🏛️ Governance proposal created: ${proposal.title}`);
    console.log(`📝 Proposal ID: ${proposal.id}`);
    console.log(`⏰ Voting ends: ${new Date(proposal.votingDeadline).toLocaleString()}`);

    return this.governanceProposals.get(proposal.id);
  }

  /**
   * Vote on governance proposal
   */
  async voteOnProposal(voterDID, proposalId, support, reason = '') {
    const proposal = this.governanceProposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const vote = await this.governanceToken.vote(voterDID, proposalId, support, reason);

    console.log(`🗳️ Vote cast on proposal ${proposalId}`);
    console.log(`👤 Voter: ${voterDID.split(':').pop().substr(0, 8)}`);
    console.log(`✅ Support: ${support ? 'Yes' : 'No'}`);
    console.log(`💪 Voting power: ${this.governanceToken.formatTokens(vote.votingPower)} LGT`);

    // Update marketplace proposal tracking
    this.governanceProposals.set(proposalId, {
      ...proposal,
      lastActivity: Date.now()
    });

    return vote;
  }

  /**
   * Stake tokens for governance participation
   */
  async stakeGovernanceTokens(userDID, amount) {
    const stakeResult = await this.governanceToken.stake(userDID, amount);
    
    console.log(`🔒 Staked governance tokens`);
    console.log(`👤 User: ${userDID.split(':').pop().substr(0, 8)}`);
    console.log(`💰 Amount: ${this.governanceToken.formatTokens(amount)} LGT`);
    console.log(`⏰ Lock period: 30 days`);

    return stakeResult;
  }

  /**
   * Unstake governance tokens
   */
  async unstakeGovernanceTokens(userDID, amount) {
    const unstakeResult = await this.governanceToken.unstake(userDID, amount);
    
    console.log(`🔓 Unstaked governance tokens`);
    console.log(`👤 User: ${userDID.split(':').pop().substr(0, 8)}`);
    console.log(`💰 Amount: ${this.governanceToken.formatTokens(amount)} LGT`);

    return unstakeResult;
  }

  /**
   * Get governance statistics
   */
  getGovernanceStats() {
    const stats = this.governanceToken.getStatistics();
    const proposals = Array.from(this.governanceProposals.values());
    
    return {
      ...stats,
      marketplace: {
        totalProposals: proposals.length,
        activeProposals: proposals.filter(p => p.status === 'active').length,
        passedProposals: proposals.filter(p => p.status === 'executed').length,
        failedProposals: proposals.filter(p => p.status === 'defeated').length,
        averageVotingParticipation: this.calculateAverageParticipation(proposals)
      }
    };
  }

  /**
   * Calculate average voting participation
   */
  calculateAverageParticipation(proposals) {
    if (proposals.length === 0) return 0;
    
    const totalVotes = proposals.reduce((sum, p) => {
      const proposalVotes = (p.forVotes || 0) + (p.againstVotes || 0);
      return sum + proposalVotes;
    }, 0);
    
    return totalVotes / proposals.length;
  }

  /**
   * Reward creators with governance tokens for engagement
   */
  async rewardCreatorGovernance(creatorDID, activityType, multiplier = 1) {
    const baseReward = BigInt(10) * BigInt(10 ** this.governanceToken.decimals); // 10 LGT base
    const rewardAmount = baseReward * BigInt(Math.floor(multiplier));
    
    await this.governanceToken.mint(creatorDID, rewardAmount, `creator_${activityType}`);
    
    console.log(`🏛️ Governance reward: ${this.governanceToken.formatTokens(rewardAmount)} LGT`);
    console.log(`📈 Activity: ${activityType} (${multiplier}x multiplier)`);
    
    return rewardAmount;
  }

  /**
   * Enhanced analytics including governance metrics
   */
  getEnhancedAnalytics() {
    const baseAnalytics = this.getAnalytics();
    const governanceStats = this.getGovernanceStats();
    
    return {
      ...baseAnalytics,
      governance: governanceStats,
      tokenomics: {
        veriToken: {
          totalSupply: this.veriToken.formatTokens(this.veriToken.totalSupply),
          holders: this.veriToken.getHolders().length
        },
        governanceToken: {
          totalSupply: this.governanceToken.formatTokens(this.governanceToken.totalSupply),
          holders: this.governanceToken.getHolders().length,
          stakedTokens: this.governanceToken.formatTokens(this.governanceToken.getTotalStaked())
        }
      }
    };
  }
}

module.exports = SidelinePinasMarketplace;
