const DID = require('./core/did');
const { MerchantDID, CustomerDID, ProductDID, TransactionDID } = require('./marketplace/schemas');
const { VerifiableCredential, MarketplaceCredentials } = require('./credentials/verifiable-credential');
const VeriToken = require('./tokenomics/veri-token');

/**
 * VeriToken Marketplace System
 * Main entry point for the marketplace identity system
 */
class VeriTokenMarketplace {
  constructor() {
    this.dids = new Map();
    this.credentials = new Map();
    this.transactions = new Map();
    this.veriToken = new VeriToken();
    
    console.log('💰 VeriToken integrated into marketplace');
  }

  /**
   * Create a new marketplace entity
   */
  async createEntity(type, info = {}) {
    let entity;
    
    switch (type) {
      case 'merchant':
        entity = new MerchantDID();
        if (info.businessInfo) {
          entity.setBusinessInfo(info.businessInfo);
        }
        break;
      case 'customer':
        entity = new CustomerDID();
        if (info.profile) {
          entity.setProfile(info.profile);
        }
        break;
      case 'product':
        entity = new ProductDID();
        if (info.productInfo) {
          entity.setProductInfo(info.productInfo);
        }
        break;
      case 'transaction':
        entity = new TransactionDID();
        if (info.transactionInfo) {
          entity.setTransactionInfo(info.transactionInfo);
        }
        break;
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
    
    entity.generateKeyPair();
    entity.createDocument();
    
    this.dids.set(entity.id, entity);
    
    return entity;
  }

  /**
   * Get entity by DID
   */
  getEntity(did) {
    return this.dids.get(did);
  }

  /**
   * Allocate tokens to an entity
   */
  allocateTokens(entityDID, amount) {
    const tokenAmount = BigInt(amount) * BigInt(10 ** this.veriToken.decimals);
    this.veriToken.mint(entityDID, tokenAmount, 'marketplace_allocation');
    return tokenAmount;
  }

  /**
   * Issue a credential
   */
  async issueCredential(issuerDID, subjectDID, credentialType, claims) {
    const issuer = this.dids.get(issuerDID);
    if (!issuer) {
      throw new Error(`Issuer DID not found: ${issuerDID}`);
    }

    // Ensure issuer has sufficient tokens for verification
    const verificationCost = this.veriToken.getVerificationCost(credentialType);
    if (this.veriToken.balanceOf(issuerDID) < verificationCost) {
      console.log(`💰 Allocating tokens to issuer for verification: ${this.veriToken.formatTokens(verificationCost * BigInt(10))} VERI`);
      this.allocateTokens(issuerDID, Number(verificationCost * BigInt(10)) / Number(BigInt(10 ** this.veriToken.decimals)));
    }

    // Process token-based verification
    const verificationResult = this.veriToken.processVerification(issuerDID, subjectDID, credentialType);
    
    let credential;
    
    switch (credentialType) {
      case 'merchant':
        credential = MarketplaceCredentials.createMerchantCredential(issuerDID, subjectDID, claims);
        break;
      case 'customer':
        credential = MarketplaceCredentials.createCustomerCredential(issuerDID, subjectDID, claims);
        break;
      case 'product':
        credential = MarketplaceCredentials.createProductCredential(issuerDID, subjectDID, claims);
        break;
      case 'transaction':
        credential = MarketplaceCredentials.createTransactionCredential(issuerDID, subjectDID, claims);
        break;
      default:
        credential = new VerifiableCredential(issuerDID, subjectDID, credentialType);
        Object.keys(claims).forEach(key => {
          credential.addClaim(key, claims[key]);
        });
    }

    const signedCredential = credential.sign(issuer);
    this.credentials.set(signedCredential.id, signedCredential);
    
    console.log(`💰 Verification cost: ${this.veriToken.formatTokens(verificationResult.verificationCost)} VERI`);
    console.log(`💰 Validator reward: ${this.veriToken.formatTokens(verificationResult.validatorReward)} VERI`);
    
    return signedCredential;
  }

  /**
   * Verify a credential
   */
  async verifyCredential(credentialId) {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error(`Credential not found: ${credentialId}`);
    }

    const issuer = this.dids.get(credential.issuer);
    if (!issuer) {
      throw new Error(`Issuer DID not found: ${credential.issuer}`);
    }

    const isValid = VerifiableCredential.verify(credential, issuer);
    const isExpired = VerifiableCredential.isExpired(credential);
    
    return { isValid, isExpired, credential };
  }

  /**
   * Create a marketplace transaction
   */
  async createTransaction(buyerDID, sellerDID, productDID, amount, currency = 'USD') {
    const buyer = this.dids.get(buyerDID);
    const seller = this.dids.get(sellerDID);
    const product = this.dids.get(productDID);

    if (!buyer || !seller || !product) {
      throw new Error('One or more entities not found');
    }

    const transaction = await this.createEntity('transaction', {
      transactionInfo: {
        buyer: buyerDID,
        seller: sellerDID,
        productId: productDID,
        amount: amount,
        currency: currency,
        status: 'pending'
      }
    });

    this.transactions.set(transaction.id, transaction);
    
    return transaction;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionDID, status) {
    const transaction = this.dids.get(transactionDID);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionDID}`);
    }

    transaction.updateStatus(status);
    
    // Create transaction attestation credential
    const attestation = await this.issueCredential(
      transactionDID,
      transactionDID,
      'transaction',
      transaction.transactionInfo
    );

    return { transaction, attestation };
  }

  /**
   * Get marketplace statistics
   */
  getStatistics() {
    const stats = {
      totalEntities: this.dids.size,
      totalCredentials: this.credentials.size,
      totalTransactions: this.transactions.size,
      entityTypes: {
        merchant: 0,
        customer: 0,
        product: 0,
        transaction: 0
      },
      tokenomics: this.veriToken.getStatistics()
    };

    this.dids.forEach(entity => {
      if (entity.entityType) {
        stats.entityTypes[entity.entityType]++;
      }
    });

    return stats;
  }
}

/**
 * Demo function to show the system in action
 */
async function demo() {
  console.log('🚀 Sideline Pinas powered by Veri Token Demo\n');
  
  const marketplace = new VeriTokenMarketplace();
  
  // 1. Create a merchant
  console.log('1. Creating merchant...');
  const merchant = await marketplace.createEntity('merchant', {
    businessInfo: {
      name: 'ACME Electronics',
      type: 'LLC',
      registrationNumber: 'REG-12345',
      taxId: 'TAX-67890',
      address: '123 Business St, Commerce City, CC 12345'
    }
  });
  console.log(`✅ Merchant created: ${merchant.id}\n`);
  
  // 2. Create a customer
  console.log('2. Creating customer...');
  const customer = await marketplace.createEntity('customer', {
    profile: {
      kycLevel: 'basic',
      ageVerified: true,
      locationVerified: true
    }
  });
  console.log(`✅ Customer created: ${customer.id}\n`);
  
  // 3. Create a product
  console.log('3. Creating product...');
  const product = await marketplace.createEntity('product', {
    productInfo: {
      name: 'Wireless Headphones',
      manufacturer: 'ACME Electronics',
      model: 'WH-1000XM4',
      serialNumber: 'SN-ABC123',
      category: 'Electronics'
    }
  });
  console.log(`✅ Product created: ${product.id}\n`);
  
  // 4. Issue merchant verification credential
  console.log('4. Issuing merchant verification credential...');
  const merchantCredential = await marketplace.issueCredential(
    merchant.id, // Self-issued for demo
    merchant.id,
    'merchant',
    {
      name: 'ACME Electronics',
      type: 'LLC',
      registrationNumber: 'REG-12345',
      verificationLevel: 'verified'
    }
  );
  console.log(`✅ Merchant credential issued: ${merchantCredential.id}\n`);
  
  // 5. Create a transaction
  console.log('5. Creating transaction...');
  const transaction = await marketplace.createTransaction(
    customer.id,
    merchant.id,
    product.id,
    299.99,
    'USD'
  );
  console.log(`✅ Transaction created: ${transaction.id}\n`);
  
  // 6. Complete the transaction
  console.log('6. Completing transaction...');
  const { transaction: completedTransaction, attestation } = await marketplace.updateTransactionStatus(
    transaction.id,
    'completed'
  );
  console.log(`✅ Transaction completed with attestation: ${attestation.id}\n`);
  
  // 7. Show statistics
  console.log('7. Marketplace Statistics:');
  const stats = marketplace.getStatistics();
  console.log(`📊 Total Entities: ${stats.totalEntities}`);
  console.log(`📊 Total Credentials: ${stats.totalCredentials}`);
  console.log(`📊 Total Transactions: ${stats.totalTransactions}`);
  console.log(`📊 Entity Breakdown:`, stats.entityTypes);
  
  console.log('\n🎉 Demo completed successfully!');
}

// Export the main class and run demo if this file is executed directly
module.exports = VeriTokenMarketplace;

if (require.main === module) {
  demo().catch(console.error);
}
