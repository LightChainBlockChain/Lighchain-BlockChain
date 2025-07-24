const DID = require('../core/did');

/**
 * Marketplace-specific DID schemas and entity types
 * Extends the base DID functionality for marketplace use cases
 */

/**
 * Merchant DID - For businesses selling on the marketplace
 */
class MerchantDID extends DID {
  constructor(network = 'mainnet') {
    super('veritoken-merchant', network);
    this.entityType = 'merchant';
    this.businessInfo = {
      name: null,
      type: null,
      registrationNumber: null,
      taxId: null,
      address: null,
      contactInfo: null,
      verificationLevel: 'unverified'
    };
    this.credentials = [];
    this.reputation = {
      score: 0,
      totalTransactions: 0,
      positiveReviews: 0,
      negativeReviews: 0
    };
  }

  /**
   * Set business information
   */
  setBusinessInfo(businessInfo) {
    this.businessInfo = { ...this.businessInfo, ...businessInfo };
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Add a credential to the merchant
   */
  addCredential(credential) {
    this.credentials.push(credential);
    return this;
  }

  /**
   * Update reputation score
   */
  updateReputation(transactionResult) {
    this.reputation.totalTransactions++;
    if (transactionResult.positive) {
      this.reputation.positiveReviews++;
    } else {
      this.reputation.negativeReviews++;
    }
    
    // Simple reputation calculation
    const total = this.reputation.positiveReviews + this.reputation.negativeReviews;
    this.reputation.score = total > 0 ? (this.reputation.positiveReviews / total) * 100 : 0;
    
    return this;
  }

  /**
   * Create merchant-specific DID document
   */
  createDocument() {
    const baseDocument = super.createDocument();
    
    // Add marketplace-specific context and service endpoints
    baseDocument['@context'].push('https://veritoken.org/marketplace/merchant/v1');
    baseDocument.service = [
      {
        id: `${this.id}#marketplace-service`,
        type: 'MarketplaceService',
        serviceEndpoint: `https://marketplace.veritoken.org/merchant/${this.id}`
      }
    ];
    
    // Add merchant-specific metadata
    baseDocument.merchantInfo = {
      entityType: this.entityType,
      businessName: this.businessInfo.name,
      verificationLevel: this.businessInfo.verificationLevel,
      reputationScore: this.reputation.score
    };
    
    return baseDocument;
  }
}

/**
 * Customer DID - For buyers on the marketplace
 */
class CustomerDID extends DID {
  constructor(network = 'mainnet') {
    super('veritoken-customer', network);
    this.entityType = 'customer';
    this.profile = {
      preferences: {},
      kycLevel: 'none',
      ageVerified: false,
      locationVerified: false
    };
    this.credentials = [];
    this.purchaseHistory = [];
  }

  /**
   * Set customer profile
   */
  setProfile(profile) {
    this.profile = { ...this.profile, ...profile };
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Add purchase to history
   */
  addPurchase(purchase) {
    this.purchaseHistory.push(purchase);
    return this;
  }

  /**
   * Create customer-specific DID document
   */
  createDocument() {
    const baseDocument = super.createDocument();
    
    baseDocument['@context'].push('https://veritoken.org/marketplace/customer/v1');
    baseDocument.service = [
      {
        id: `${this.id}#marketplace-service`,
        type: 'MarketplaceService',
        serviceEndpoint: `https://marketplace.veritoken.org/customer/${this.id}`
      }
    ];
    
    // Add customer-specific metadata (privacy-preserving)
    baseDocument.customerInfo = {
      entityType: this.entityType,
      kycLevel: this.profile.kycLevel,
      verificationStatus: {
        age: this.profile.ageVerified,
        location: this.profile.locationVerified
      }
    };
    
    return baseDocument;
  }
}

/**
 * Product DID - For individual products or product lines
 */
class ProductDID extends DID {
  constructor(network = 'mainnet') {
    super('veritoken-product', network);
    this.entityType = 'product';
    this.productInfo = {
      name: null,
      manufacturer: null,
      model: null,
      serialNumber: null,
      category: null,
      specifications: {},
      certifications: []
    };
    this.supplyChain = [];
    this.ownership = {
      currentOwner: null,
      ownershipHistory: []
    };
  }

  /**
   * Set product information
   */
  setProductInfo(productInfo) {
    this.productInfo = { ...this.productInfo, ...productInfo };
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Add supply chain event
   */
  addSupplyChainEvent(event) {
    this.supplyChain.push({
      ...event,
      timestamp: new Date().toISOString()
    });
    return this;
  }

  /**
   * Transfer ownership
   */
  transferOwnership(newOwner) {
    if (this.ownership.currentOwner) {
      this.ownership.ownershipHistory.push({
        previousOwner: this.ownership.currentOwner,
        newOwner: newOwner,
        timestamp: new Date().toISOString()
      });
    }
    this.ownership.currentOwner = newOwner;
    return this;
  }

  /**
   * Create product-specific DID document
   */
  createDocument() {
    const baseDocument = super.createDocument();
    
    baseDocument['@context'].push('https://veritoken.org/marketplace/product/v1');
    baseDocument.service = [
      {
        id: `${this.id}#marketplace-service`,
        type: 'MarketplaceService',
        serviceEndpoint: `https://marketplace.veritoken.org/product/${this.id}`
      }
    ];
    
    // Add product-specific metadata
    baseDocument.productInfo = {
      entityType: this.entityType,
      name: this.productInfo.name,
      manufacturer: this.productInfo.manufacturer,
      category: this.productInfo.category,
      currentOwner: this.ownership.currentOwner,
      certifications: this.productInfo.certifications.length
    };
    
    return baseDocument;
  }
}

/**
 * Transaction DID - For marketplace transactions
 */
class TransactionDID extends DID {
  constructor(network = 'mainnet') {
    super('veritoken-transaction', network);
    this.entityType = 'transaction';
    this.transactionInfo = {
      buyer: null,
      seller: null,
      productId: null,
      amount: null,
      currency: 'USD',
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    this.attestations = [];
  }

  /**
   * Set transaction information
   */
  setTransactionInfo(transactionInfo) {
    this.transactionInfo = { ...this.transactionInfo, ...transactionInfo };
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Add attestation
   */
  addAttestation(attestation) {
    this.attestations.push(attestation);
    return this;
  }

  /**
   * Update transaction status
   */
  updateStatus(status) {
    this.transactionInfo.status = status;
    this.updated = new Date().toISOString();
    return this;
  }

  /**
   * Create transaction-specific DID document
   */
  createDocument() {
    const baseDocument = super.createDocument();
    
    baseDocument['@context'].push('https://veritoken.org/marketplace/transaction/v1');
    baseDocument.service = [
      {
        id: `${this.id}#marketplace-service`,
        type: 'MarketplaceService',
        serviceEndpoint: `https://marketplace.veritoken.org/transaction/${this.id}`
      }
    ];
    
    // Add transaction-specific metadata
    baseDocument.transactionInfo = {
      entityType: this.entityType,
      status: this.transactionInfo.status,
      timestamp: this.transactionInfo.timestamp,
      attestations: this.attestations.length
    };
    
    return baseDocument;
  }
}

/**
 * Schema validation utilities
 */
class SchemaValidator {
  
  /**
   * Validate merchant business info
   */
  static validateMerchantInfo(businessInfo) {
    const required = ['name', 'type', 'registrationNumber'];
    const missing = required.filter(field => !businessInfo[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required merchant fields: ${missing.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Validate product info
   */
  static validateProductInfo(productInfo) {
    const required = ['name', 'manufacturer', 'serialNumber'];
    const missing = required.filter(field => !productInfo[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required product fields: ${missing.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Validate transaction info
   */
  static validateTransactionInfo(transactionInfo) {
    const required = ['buyer', 'seller', 'productId', 'amount'];
    const missing = required.filter(field => !transactionInfo[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required transaction fields: ${missing.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = {
  MerchantDID,
  CustomerDID,
  ProductDID,
  TransactionDID,
  SchemaValidator
};
