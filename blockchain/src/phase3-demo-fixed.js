const VeriToken = require('./tokenomics/veri-token');
const VeriTokenMarketplace = require('./index');
const ZKPSystem = require('./crypto/zkp-system');
const MarketplaceWallet = require('./wallet/marketplace-wallet');
const CustomerOnboarding = require('./marketplace/customer-onboarding');
const ProductAuthenticity = require('./marketplace/product-authenticity');

/**
 * Phase 3 Demo: Advanced Features with Tokenomics
 * Demonstrates advanced ZKP, tokenomics, and comprehensive marketplace features
 */
class Phase3Demo {
  constructor() {
    this.veriToken = new VeriToken();
    this.marketplace = new VeriTokenMarketplace();
    this.zkpSystem = new ZKPSystem();
    this.customerOnboarding = new CustomerOnboarding('did:veritoken:mainnet:marketplace-authority');
    this.productAuthenticity = new ProductAuthenticity('did:veritoken:mainnet:marketplace-authority');
    this.wallets = new Map();
    this.users = new Map();
    this.products = new Map();
  }

  /**
   * Run comprehensive Phase 3 demo
   */
  async runDemo() {
    console.log('🚀 VeriToken Marketplace Phase 3 Demo: Advanced Features with Tokenomics\n');
    console.log('=' .repeat(80));
    
    try {
      // 1. Initialize systems
      await this.initializeSystems();
      
      // 2. Tokenomics demo
      await this.demoTokenomics();
      
      // 3. Advanced ZKP demo
      await this.demoAdvancedZKP();
      
      // 4. Staking and rewards demo
      await this.demoStakingRewards();
      
      // 5. Marketplace transactions with tokenomics
      await this.demoMarketplaceWithTokenomics();
      
      // 6. Health metrics and analytics
      await this.demoHealthMetrics();
      
      console.log('\n🎉 Phase 3 Demo completed successfully!');
      console.log('=' .repeat(80));
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all systems
   */
  async initializeSystems() {
    console.log('\n🔧 Initializing Systems');
    console.log('-' .repeat(50));
    
    // Initialize ZKP system
    await this.zkpSystem.initialize();
    
    console.log('✅ All systems initialized successfully');
    console.log('📊 Token Statistics:');
    console.log('   Total Supply:', this.veriToken.formatTokens(this.veriToken.totalSupply), 'VERI');
    console.log('   Founder Balance:', this.veriToken.formatTokens(this.veriToken.balanceOf('veri_founder_address')), 'VERI');
  }

  /**
   * Demo tokenomics features
   */
  async demoTokenomics() {
    console.log('\n💰 Demo 1: VeriToken Tokenomics');
    console.log('-' .repeat(50));
    
    // Create user addresses
    const alice = 'alice_marketplace_user';
    const bob = 'bob_marketplace_user';
    const charlie = 'charlie_validator';
    
    // Initial token distribution
    console.log('1. Initial token distribution...');
    this.veriToken.mint(alice, BigInt(50000) * BigInt(10 ** this.veriToken.decimals), 'initial_distribution');
    this.veriToken.mint(bob, BigInt(30000) * BigInt(10 ** this.veriToken.decimals), 'initial_distribution');
    this.veriToken.mint(charlie, BigInt(20000) * BigInt(10 ** this.veriToken.decimals), 'initial_distribution');
    
    console.log('✅ Initial distribution completed');
    console.log('   Alice balance:', this.veriToken.formatTokens(this.veriToken.balanceOf(alice)), 'VERI');
    console.log('   Bob balance:', this.veriToken.formatTokens(this.veriToken.balanceOf(bob)), 'VERI');
    console.log('   Charlie balance:', this.veriToken.formatTokens(this.veriToken.balanceOf(charlie)), 'VERI');
    
    // Token transfers with burning
    console.log('\n2. Token transfers with automatic burning...');
    this.veriToken.transfer(alice, bob, BigInt(5000) * BigInt(10 ** this.veriToken.decimals));
    this.veriToken.transfer(bob, charlie, BigInt(2000) * BigInt(10 ** this.veriToken.decimals));
    
    console.log('✅ Transfers completed with automatic burning');
    
    // Verification costs
    console.log('\n3. Identity verification with token costs...');
    const verificationResult = this.veriToken.processVerification(charlie, alice, 'kyc_level_1');
    console.log('✅ Verification completed');
    
    // Display current statistics
    console.log('\n📊 Current Token Statistics:');
    const stats = this.veriToken.getStatistics();
    console.log('   Total Supply:', this.veriToken.formatTokens(stats.tokenInfo.totalSupply), 'VERI');
    console.log('   Total Burned:', this.veriToken.formatTokens(stats.metrics.totalBurned), 'VERI');
    console.log('   Total Minted:', this.veriToken.formatTokens(stats.metrics.totalMinted), 'VERI');
    console.log('   Total Transactions:', stats.stats.totalTransactions);
    console.log('   Total Verifications:', stats.stats.totalVerifications);
    
    // Store users for later demos
    this.users.set('alice', alice);
    this.users.set('bob', bob);
    this.users.set('charlie', charlie);
  }

  /**
   * Demo advanced ZKP features
   */
  async demoAdvancedZKP() {
    console.log('\n🔐 Demo 2: Advanced Zero-Knowledge Proofs');
    console.log('-' .repeat(50));
    
    // Age verification proof
    console.log('1. Age verification proof...');
    const ageProof = await this.zkpSystem.generateAgeProof('1990-05-15', 21, {
      purpose: 'marketplace_age_verification',
      requiredBy: 'marketplace_authority'
    });
    
    const ageVerification = await this.zkpSystem.verifyProof(ageProof.proofId);
    console.log('✅ Age proof generated and verified:', ageVerification.isValid);
    
    // Location verification proof
    console.log('\n2. Location verification proof...');
    const locationProof = await this.zkpSystem.generateLocationProof(
      { lat: 40.7128, lng: -74.0060 }, // New York coordinates
      { 
        name: 'United States',
        center: { lat: 39.8283, lng: -98.5795 },
        radius: 2000 // km
      },
      { purpose: 'shipping_verification' }
    );
    
    const locationVerification = await this.zkpSystem.verifyProof(locationProof.proofId);
    console.log('✅ Location proof generated and verified:', locationVerification.isValid);
    
    // Income verification proof
    console.log('\n3. Income verification proof...');
    const incomeProof = await this.zkpSystem.generateIncomeProof(
      75000, // Annual income
      50000, // Required minimum
      'USD',
      { purpose: 'premium_tier_access' }
    );
    
    const incomeVerification = await this.zkpSystem.verifyProof(incomeProof.proofId);
    console.log('✅ Income proof generated and verified:', incomeVerification.isValid);
    
    // Membership verification proof
    console.log('\n4. Membership verification proof...');
    const membershipProof = await this.zkpSystem.generateMembershipProof(
      'member_12345',
      'premium_group',
      'secret_membership_key',
      { purpose: 'exclusive_access' }
    );
    
    const membershipVerification = await this.zkpSystem.verifyProof(membershipProof.proofId);
    console.log('✅ Membership proof generated and verified:', membershipVerification.isValid);
    
    // Show ZKP statistics
    console.log('\n📊 ZKP Statistics:');
    const zkpStats = this.zkpSystem.getStatistics();
    console.log('   Total Proofs:', zkpStats.totalProofs);
    console.log('   Total Circuits:', zkpStats.totalCircuits);
    console.log('   Verification Rate:', zkpStats.verificationRate + '%');
    console.log('   Proof Types:', zkpStats.proofTypes);
  }

  /**
   * Demo staking and rewards system
   */
  async demoStakingRewards() {
    console.log('\n🔒 Demo 3: Staking and Rewards System');
    console.log('-' .repeat(50));
    
    const alice = this.users.get('alice');
    const bob = this.users.get('bob');
    
    // Alice stakes tokens
    console.log('1. Alice stakes tokens...');
    const aliceStakeAmount = BigInt(10000) * BigInt(10 ** this.veriToken.decimals);
    const aliceStake = this.veriToken.stake(alice, aliceStakeAmount, 30 * 24 * 60 * 60 * 1000); // 30 days
    
    console.log('✅ Alice staked:', this.veriToken.formatTokens(aliceStakeAmount), 'VERI');
    console.log('   Stake ID:', aliceStake.id);
    console.log('   APY:', (aliceStake.apy * 100).toFixed(2) + '%');
    
    // Bob stakes tokens
    console.log('\n2. Bob stakes tokens...');
    const bobStakeAmount = BigInt(15000) * BigInt(10 ** this.veriToken.decimals);
    const bobStake = this.veriToken.stake(bob, bobStakeAmount, 60 * 24 * 60 * 60 * 1000); // 60 days
    
    console.log('✅ Bob staked:', this.veriToken.formatTokens(bobStakeAmount), 'VERI');
    console.log('   Stake ID:', bobStake.id);
    
    // Show staking statistics
    console.log('\n📊 Staking Statistics:');
    const stakingStats = this.veriToken.getStatistics();
    console.log('   Total Staked:', this.veriToken.formatTokens(stakingStats.metrics.totalStaked), 'VERI');
    console.log('   Active Stakers:', stakingStats.stats.activeStakers);
    console.log('   Staking Ratio:', (stakingStats.metrics.stakingRatio * 100).toFixed(2) + '%');
    
    // Simulate daily rewards
    console.log('\n3. Processing daily staking rewards...');
    this.veriToken.processDailyMaintenance();
    
    // Early unstaking demo (with penalty)
    console.log('\n4. Alice unstakes early (with penalty)...');
    const unstakeResult = this.veriToken.unstake(aliceStake.id);
    console.log('✅ Alice unstaked:');
    console.log('   Returned amount:', this.veriToken.formatTokens(unstakeResult.amount - unstakeResult.penaltyAmount), 'VERI');
    console.log('   Reward amount:', this.veriToken.formatTokens(unstakeResult.rewardAmount), 'VERI');
    console.log('   Penalty amount:', this.veriToken.formatTokens(unstakeResult.penaltyAmount), 'VERI');
  }

  /**
   * Demo marketplace transactions with tokenomics
   */
  async demoMarketplaceWithTokenomics() {
    console.log('\n🛒 Demo 4: Marketplace Transactions with Tokenomics');
    console.log('-' .repeat(50));
    
    // Create marketplace entities
    console.log('1. Creating marketplace entities...');
    const merchant = await this.marketplace.createEntity('merchant', {
      businessInfo: {
        name: 'TokenTech Solutions',
        type: 'Technology Company',
        registrationNumber: 'TTS-2024-001'
      }
    });
    
    const customer = await this.marketplace.createEntity('customer', {
      profile: {
        preferredName: 'Alice Johnson',
        kycLevel: 'level_1'
      }
    });
    
    const product = await this.marketplace.createEntity('product', {
      productInfo: {
        name: 'Smart Identity Device',
        manufacturer: 'TokenTech Solutions',
        model: 'SID-2024',
        serialNumber: 'SID-001-2024'
      }
    });
    
    console.log('✅ Entities created:');
    console.log('   Merchant:', merchant.id);
    console.log('   Customer:', customer.id);
    console.log('   Product:', product.id);
    
    // Issue credentials with token costs
    console.log('\n2. Issuing credentials with token costs...');
    
    const merchantCredential = await this.marketplace.issueCredential(
      merchant.id,
      merchant.id,
      'business_verification',
      { businessName: 'TokenTech Solutions', verified: true }
    );
    
    const customerCredential = await this.marketplace.issueCredential(
      customer.id,
      customer.id,
      'kyc_level_1',
      { kycLevel: 'level_1', verified: true }
    );
    
    const productCredential = await this.marketplace.issueCredential(
      product.id,
      product.id,
      'product_authenticity',
      { authentic: true, manufacturer: 'TokenTech Solutions' }
    );
    
    console.log('✅ Credentials issued with token economics');
    
    // Create transaction
    console.log('\n3. Creating marketplace transaction...');
    const transaction = await this.marketplace.createTransaction(
      customer.id,
      merchant.id,
      product.id,
      1999.99,
      'USD'
    );
    
    console.log('✅ Transaction created:', transaction.id);
    
    // Update transaction status
    console.log('\n4. Completing transaction...');
    const completedTransaction = await this.marketplace.updateTransactionStatus(
      transaction.id,
      'completed'
    );
    
    console.log('✅ Transaction completed');
    
    // Show final marketplace statistics
    console.log('\n📊 Marketplace Statistics:');
    const marketplaceStats = this.marketplace.getStatistics();
    console.log('   Total Entities:', marketplaceStats.totalEntities);
    console.log('   Total Credentials:', marketplaceStats.totalCredentials);
    console.log('   Total Transactions:', marketplaceStats.totalTransactions);
    console.log('   Token Health Score:', marketplaceStats.tokenomics.metrics.healthScore + '/100');
  }

  /**
   * Demo health metrics and analytics
   */
  async demoHealthMetrics() {
    console.log('\n📈 Demo 5: Health Metrics and Analytics');
    console.log('-' .repeat(50));
    
    // Get comprehensive health metrics
    const healthMetrics = this.veriToken.getHealthMetrics();
    
    console.log('💰 Token Health Metrics:');
    console.log('   Total Supply:', this.veriToken.formatTokens(healthMetrics.totalSupply), 'VERI');
    console.log('   Circulating Supply:', this.veriToken.formatTokens(healthMetrics.circulatingSupply), 'VERI');
    console.log('   Total Burned:', this.veriToken.formatTokens(healthMetrics.totalBurned), 'VERI');
    console.log('   Total Minted:', this.veriToken.formatTokens(healthMetrics.totalMinted), 'VERI');
    console.log('   Total Staked:', this.veriToken.formatTokens(healthMetrics.totalStaked), 'VERI');
    
    console.log('\n📊 Economic Health Indicators:');
    console.log('   Burn-to-Mint Ratio:', healthMetrics.burnToMintRatio.toFixed(2));
    console.log('   Staking Ratio:', (healthMetrics.stakingRatio * 100).toFixed(2) + '%');
    console.log('   Health Score:', healthMetrics.healthScore + '/100');
    console.log('   Price Stability:', healthMetrics.priceStability + '/100');
    console.log('   Inflation Rate:', healthMetrics.inflationRate.toFixed(2) + '%');
    
    // ZKP system health
    const zkpStats = this.zkpSystem.getStatistics();
    console.log('\n🔐 ZKP System Health:');
    console.log('   Total Proofs Generated:', zkpStats.totalProofs);
    console.log('   Verification Success Rate:', zkpStats.verificationRate + '%');
    console.log('   Available Circuits:', zkpStats.totalCircuits);
    
    // Marketplace health
    const marketplaceStats = this.marketplace.getStatistics();
    console.log('\n🛒 Marketplace Health:');
    console.log('   Active Entities:', marketplaceStats.totalEntities);
    console.log('   Credential Issuance:', marketplaceStats.totalCredentials);
    console.log('   Transaction Volume:', marketplaceStats.totalTransactions);
    
    // Health recommendations
    console.log('\n💡 Health Recommendations:');
    if (healthMetrics.burnToMintRatio > 2.5) {
      console.log('   ⚠️ High burn rate - consider increasing utility to encourage holding');
    } else if (healthMetrics.burnToMintRatio < 1.0) {
      console.log('   ⚠️ Low burn rate - consider increasing transaction fees or burn mechanisms');
    } else {
      console.log('   ✅ Healthy burn-to-mint ratio');
    }
    
    if (healthMetrics.stakingRatio < 0.2) {
      console.log('   ⚠️ Low staking participation - consider increasing rewards');
    } else if (healthMetrics.stakingRatio > 0.6) {
      console.log('   ⚠️ High staking ratio - may reduce liquidity');
    } else {
      console.log('   ✅ Healthy staking participation');
    }
    
    if (healthMetrics.healthScore < 70) {
      console.log('   ⚠️ Overall health below optimal - review tokenomics parameters');
    } else {
      console.log('   ✅ Overall system health is good');
    }
  }
}

/**
 * Run the demo
 */
async function runPhase3Demo() {
  const demo = new Phase3Demo();
  await demo.runDemo();
}

// Export for use as module or run directly
module.exports = Phase3Demo;

if (require.main === module) {
  runPhase3Demo().catch(console.error);
}
