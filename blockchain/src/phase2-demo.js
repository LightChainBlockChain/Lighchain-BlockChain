const MarketplaceWallet = require('./wallet/marketplace-wallet');
const CustomerOnboarding = require('./marketplace/customer-onboarding');
const ProductAuthenticity = require('./marketplace/product-authenticity');
const MarketplaceAPI = require('./marketplace/api-server');

/**
 * Phase 2 Demo: Core Integration
 * Demonstrates wallet integration, customer onboarding, and product authenticity verification
 */
class Phase2Demo {
  constructor() {
    this.authorityDID = 'did:veritoken:mainnet:marketplace-authority';
    this.customerOnboarding = new CustomerOnboarding(this.authorityDID);
    this.productAuthenticity = new ProductAuthenticity(this.authorityDID);
    this.wallets = new Map();
    this.merchants = new Map();
    this.products = new Map();
  }

  /**
   * Run comprehensive Phase 2 demo
   */
  async runDemo() {
    console.log('🚀 VeriToken Marketplace Phase 2 Demo: Core Integration\n');
    console.log('=' .repeat(60));
    
    try {
      // 1. Wallet Integration Demo
      await this.demoWalletIntegration();
      
      // 2. Customer Onboarding Demo
      await this.demoCustomerOnboarding();
      
      // 3. Product Authenticity Demo
      await this.demoProductAuthenticity();
      
      // 4. Integration Demo
      await this.demoIntegration();
      
      console.log('\n🎉 Phase 2 Demo completed successfully!');
      console.log('=' .repeat(60));
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  /**
   * Demo 1: Wallet Integration
   */
  async demoWalletIntegration() {
    console.log('\n📱 Demo 1: Marketplace Wallet Integration');
    console.log('-' .repeat(50));
    
    // Create merchant wallet
    console.log('1. Creating merchant wallet...');
    const merchantWallet = new MarketplaceWallet('merchant_wallet_acme');
    this.wallets.set('merchant_wallet_acme', merchantWallet);
    
    // Create merchant identity
    const merchantDID = await merchantWallet.createIdentity('merchant', {
      businessInfo: {
        name: 'ACME Electronics Ltd',
        type: 'Limited Company',
        registrationNumber: 'UK-REG-12345',
        taxId: 'GB-VAT-67890',
        address: '123 Tech Street, London, UK',
        contactInfo: {
          email: 'info@acme-electronics.com',
          phone: '+44-20-1234-5678'
        }
      }
    });
    
    console.log(`✅ Merchant DID created: ${merchantDID.id}`);
    
    // Create customer wallet
    console.log('2. Creating customer wallet...');
    const customerWallet = new MarketplaceWallet('customer_wallet_alice');
    this.wallets.set('customer_wallet_alice', customerWallet);
    
    // Create customer identity
    const customerDID = await customerWallet.createIdentity('customer', {
      profile: {
        preferredName: 'Alice Smith',
        kycLevel: 'none',
        ageVerified: false,
        locationVerified: false,
        preferences: {
          marketing: false,
          dataSharing: 'minimal'
        }
      }
    });
    
    console.log(`✅ Customer DID created: ${customerDID.id}`);
    
    // Establish connection between merchant and customer
    console.log('3. Establishing business connection...');
    await merchantWallet.connect(customerDID.id, 'business');
    await customerWallet.connect(merchantDID.id, 'business');
    
    console.log('✅ Business connection established');
    
    // Show wallet statistics
    console.log('4. Wallet statistics:');
    console.log('   Merchant wallet:', merchantWallet.getStatistics());
    console.log('   Customer wallet:', customerWallet.getStatistics());
    
    // Store for later use
    this.merchants.set('acme', { wallet: merchantWallet, did: merchantDID });
    
    return { merchantWallet, customerWallet, merchantDID, customerDID };
  }

  /**
   * Demo 2: Customer Onboarding
   */
  async demoCustomerOnboarding() {
    console.log('\n👤 Demo 2: Customer Onboarding with DIDs');
    console.log('-' .repeat(50));
    
    // Customer data
    const customerData = {
      preferredName: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      marketingOptIn: true,
      dataSharing: 'selective'
    };
    
    // Verification data
    const verificationData = {
      email: 'bob.johnson@example.com',
      emailToken: 'ABC123',
      phone: '+1-555-123-4567',
      phoneToken: '9876'
    };
    
    // KYC data
    const kycData = {
      documents: ['government_id', 'address_proof'],
      documentImages: ['id_front.jpg', 'id_back.jpg', 'utility_bill.pdf'],
      consentGiven: true
    };
    
    console.log('1. Starting customer onboarding process...');
    
    // Perform full onboarding
    const onboardingResult = await this.customerOnboarding.performFullOnboarding(
      customerData,
      verificationData,
      kycData
    );
    
    if (onboardingResult.success) {
      console.log('\n✅ Customer onboarding completed successfully!');
      console.log('📊 Summary:');
      console.log(`   - Customer DID: ${onboardingResult.summary.customerDID}`);
      console.log(`   - Wallet ID: ${onboardingResult.summary.walletId}`);
      console.log(`   - KYC Level: ${onboardingResult.summary.kycLevel}`);
      console.log(`   - Credentials Issued: ${onboardingResult.summary.credentialsIssued}`);
      console.log(`   - Duration: ${onboardingResult.summary.duration}ms`);
      
      // Store wallet for later use
      this.wallets.set(onboardingResult.wallet.walletId, onboardingResult.wallet);
      
      // Demo selective disclosure
      console.log('\n2. Demonstrating selective disclosure...');
      const credentials = onboardingResult.wallet.listCredentials();
      if (credentials.length > 0) {
        const credential = credentials[0];
        const disclosed = await onboardingResult.wallet.createSelectiveDisclosure(
          credential.id,
          ['kycLevel', 'ageVerified']
        );
        console.log('✅ Selective disclosure created (only KYC level and age verification shared)');
      }
      
      // Demo zero-knowledge proof
      console.log('\n3. Demonstrating zero-knowledge proof...');
      if (credentials.length > 0) {
        const credential = credentials[0];
        try {
          const zkProof = await onboardingResult.wallet.createZKProof(
            credential.id,
            'ageVerified',
            { type: 'equals', value: true }
          );
          console.log('✅ Zero-knowledge proof created:', zkProof.type);
        } catch (error) {
          console.log('ℹ️  ZK proof demo skipped (attribute not found)');
        }
      }
      
      return onboardingResult;
    } else {
      console.log('❌ Customer onboarding failed:', onboardingResult.error);
      throw new Error(onboardingResult.error);
    }
  }

  /**
   * Demo 3: Product Authenticity Verification
   */
  async demoProductAuthenticity() {
    console.log('\n📦 Demo 3: Product Authenticity Verification');
    console.log('-' .repeat(50));
    
    // Get merchant info
    const acmeMerchant = this.merchants.get('acme');
    if (!acmeMerchant) {
      throw new Error('ACME merchant not found');
    }
    
    // Register manufacturer
    console.log('1. Registering manufacturer...');
    this.productAuthenticity.registerManufacturer(
      'acme_electronics',
      acmeMerchant.did.id,
      acmeMerchant.did.businessInfo
    );
    
    // Register certification body
    console.log('2. Registering certification body...');
    this.productAuthenticity.registerCertificationBody(
      'ce_certification',
      'did:veritoken:mainnet:ce-authority',
      ['CE Mark', 'RoHS', 'WEEE']
    );
    
    // Register product
    console.log('3. Registering product with authenticity verification...');
    const productInfo = {
      name: 'Wireless Bluetooth Headphones Pro',
      manufacturer: 'ACME Electronics',
      model: 'AE-WBH-Pro-2024',
      serialNumber: null, // Will be auto-generated
      category: 'Electronics',
      productionDate: '2024-01-15',
      specifications: {
        batteryLife: '30 hours',
        driver: '40mm',
        frequency: '20Hz - 20kHz',
        weight: '250g'
      },
      certifications: []
    };
    
    const productRecord = await this.productAuthenticity.registerProduct(
      productInfo,
      acmeMerchant.did.id
    );
    
    console.log(`✅ Product registered with ID: ${productRecord.productId}`);
    console.log(`🔐 Authenticity Hash: ${productRecord.authenticityHash}`);
    console.log(`📋 Serial Number: ${productRecord.serialNumber}`);
    
    // Add supply chain events
    console.log('\n4. Adding supply chain events...');
    
    // Manufacturing event
    await this.productAuthenticity.addSupplyChainEvent(
      productRecord.productId,
      {
        type: 'manufacturing',
        description: 'Product manufactured at ACME facility',
        location: 'Manchester, UK',
        actor: acmeMerchant.did.id,
        metadata: {
          batchNumber: 'BATCH-2024-001',
          qualityCheck: 'passed'
        }
      }
    );
    
    // Quality control event
    await this.productAuthenticity.addSupplyChainEvent(
      productRecord.productId,
      {
        type: 'quality_control',
        description: 'Quality control testing completed',
        location: 'ACME QC Lab',
        actor: 'qc_inspector_001',
        metadata: {
          testResults: 'all_passed',
          inspector: 'John Doe'
        }
      }
    );
    
    // Packaging event
    await this.productAuthenticity.addSupplyChainEvent(
      productRecord.productId,
      {
        type: 'packaging',
        description: 'Product packaged for distribution',
        location: 'ACME Warehouse',
        actor: 'packaging_team',
        metadata: {
          packageType: 'retail_box',
          packagingDate: new Date().toISOString()
        }
      }
    );
    
    console.log('✅ Supply chain events added');
    
    // Add certifications
    console.log('\n5. Adding product certifications...');
    await this.productAuthenticity.addCertification(
      productRecord.productId,
      {
        type: 'CE Mark',
        issuer: 'did:veritoken:mainnet:ce-authority',
        expiryDate: '2027-01-15',
        standard: 'EN 55032',
        scope: 'Electromagnetic Compatibility'
      }
    );
    
    await this.productAuthenticity.addCertification(
      productRecord.productId,
      {
        type: 'FCC',
        issuer: 'did:veritoken:mainnet:fcc-authority',
        expiryDate: '2026-01-15',
        standard: 'FCC Part 15',
        scope: 'Radio Frequency Emissions'
      }
    );
    
    console.log('✅ Certifications added');
    
    // Issue product authenticity credential
    console.log('\n6. Issuing product authenticity credential...');
    const productCredential = await this.productAuthenticity.issueProductCredential(
      productRecord.productId,
      'premium'
    );
    
    console.log(`✅ Product credential issued: ${productCredential.id}`);
    
    // Verify product authenticity
    console.log('\n7. Verifying product authenticity...');
    const verificationResult = await this.productAuthenticity.verifyProductAuthenticity(
      productRecord.productId,
      {
        serialNumber: productRecord.serialNumber,
        expectedHash: productRecord.authenticityHash
      }
    );
    
    console.log('📊 Verification Result:');
    console.log(`   - Verified: ${verificationResult.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Confidence: ${verificationResult.confidence}%`);
    console.log('   - Checks:');
    Object.entries(verificationResult.verificationResults).forEach(([check, result]) => {
      console.log(`     - ${check}: ${result ? '✅' : '❌'}`);
    });
    
    // Store product for later use
    this.products.set('headphones_pro', productRecord);
    
    return productRecord;
  }

  /**
   * Demo 4: Full Integration
   */
  async demoIntegration() {
    console.log('\n🔄 Demo 4: Full Marketplace Integration');
    console.log('-' .repeat(50));
    
    // Get components
    const merchantWallet = this.wallets.get('merchant_wallet_acme');
    const product = this.products.get('headphones_pro');
    
    if (!merchantWallet || !product) {
      throw new Error('Required components not found');
    }
    
    // Simulate customer purchase
    console.log('1. Customer discovering product...');
    const productInfo = this.productAuthenticity.getProductInfo(product.productId);
    console.log(`   - Product: ${productInfo.productInfo.name}`);
    console.log(`   - Manufacturer: ${productInfo.manufacturer}`);
    console.log(`   - Verification Level: ${productInfo.verificationLevel}`);
    
    // Customer verifies product before purchase
    console.log('\n2. Customer verifying product authenticity...');
    const customerVerification = await this.productAuthenticity.verifyProductAuthenticity(
      product.productId,
      { serialNumber: product.serialNumber }
    );
    
    if (customerVerification.verified) {
      console.log('✅ Customer confirms product is authentic');
      
      // Simulate purchase - transfer ownership
      console.log('\n3. Processing purchase - transferring ownership...');
      const onboardedCustomer = Array.from(this.wallets.values()).find(w => 
        w.walletId.includes('onboarding_')
      );
      
      if (onboardedCustomer) {
        const customerDID = onboardedCustomer.listIdentities()[0];
        
        const transferResult = await this.productAuthenticity.transferOwnership(
          product.productId,
          customerDID.id,
          {
            reason: 'Sale',
            value: 199.99,
            location: 'Online Marketplace',
            transferAgent: 'marketplace_escrow_service'
          }
        );
        
        console.log('✅ Ownership transferred successfully');
        console.log(`   - Previous Owner: ${transferResult.previousOwner}`);
        console.log(`   - New Owner: ${transferResult.newOwner}`);
        
        // Customer can now prove ownership
        console.log('\n4. Customer proving ownership...');
        const updatedProductInfo = this.productAuthenticity.getProductInfo(product.productId);
        console.log(`   - Current Owner: ${updatedProductInfo.currentOwner}`);
        console.log(`   - Supply Chain Events: ${updatedProductInfo.supplyChainEvents}`);
        
        // Show final statistics
        console.log('\n5. Final system statistics:');
        const stats = this.productAuthenticity.getStatistics();
        console.log('   - Products:', stats.totalProducts);
        console.log('   - Manufacturers:', stats.totalManufacturers);
        console.log('   - Supply Chain Events:', stats.totalSupplyChainEvents);
        console.log('   - Certification Bodies:', stats.totalCertificationBodies);
        
        console.log('\n6. Wallet statistics:');
        this.wallets.forEach((wallet, id) => {
          const walletStats = wallet.getStatistics();
          console.log(`   - ${id}:`, walletStats);
        });
        
      } else {
        console.log('ℹ️  No onboarded customer found for ownership transfer demo');
      }
    } else {
      console.log('❌ Customer verification failed - purchase cancelled');
    }
  }

  /**
   * Demo API server (optional)
   */
  async demoAPIServer() {
    console.log('\n🌐 Demo: API Server');
    console.log('-' .repeat(50));
    
    console.log('Starting API server...');
    const apiServer = new MarketplaceAPI(3001);
    
    // Note: In a real demo, you would start the server
    // apiServer.start();
    
    console.log('ℹ️  API server demo prepared (not started to avoid blocking)');
    console.log('   To start: node -e "const API = require(\'./src/marketplace/api-server\'); new API(3001).start()"');
    
    return apiServer;
  }
}

/**
 * Run the demo
 */
async function runPhase2Demo() {
  const demo = new Phase2Demo();
  await demo.runDemo();
}

// Export for use as module or run directly
module.exports = Phase2Demo;

if (require.main === module) {
  runPhase2Demo().catch(console.error);
}
