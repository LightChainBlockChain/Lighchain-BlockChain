const { ProductDID } = require('./schemas');
const { MarketplaceCredentials } = require('../credentials/verifiable-credential');
const crypto = require('crypto');

/**
 * Product Authenticity Verification System
 * Handles product registration, supply chain tracking, and authenticity verification
 */
class ProductAuthenticity {
  constructor(marketplaceAuthority) {
    this.authorityDID = marketplaceAuthority;
    this.manufacturers = new Map();
    this.products = new Map();
    this.supplyChainEvents = new Map();
    this.certificationBodies = new Map();
  }

  /**
   * Register a manufacturer
   */
  registerManufacturer(manufacturerId, manufacturerDID, businessInfo) {
    this.manufacturers.set(manufacturerId, {
      did: manufacturerDID,
      businessInfo: businessInfo,
      verified: false,
      registrationDate: new Date().toISOString(),
      products: []
    });
    
    console.log(`🏭 Manufacturer registered: ${manufacturerId}`);
  }

  /**
   * Register a certification body
   */
  registerCertificationBody(bodyId, bodyDID, accreditations) {
    this.certificationBodies.set(bodyId, {
      did: bodyDID,
      accreditations: accreditations,
      active: true,
      registrationDate: new Date().toISOString()
    });
    
    console.log(`🏅 Certification body registered: ${bodyId}`);
  }

  /**
   * Register a product with authenticity verification
   */
  async registerProduct(productInfo, manufacturerDID) {
    console.log('📦 Registering product with authenticity verification...');
    
    // Create product DID
    const productDID = new ProductDID();
    productDID.setProductInfo(productInfo);
    productDID.generateKeyPair();
    productDID.createDocument();
    
    // Generate unique product identifiers
    const productId = productDID.id;
    const authenticityHash = this.generateAuthenticityHash(productInfo);
    const serialNumber = productInfo.serialNumber || this.generateSerialNumber();
    
    // Create product registration record
    const productRecord = {
      productDID: productDID,
      productId: productId,
      manufacturerDID: manufacturerDID,
      productInfo: productInfo,
      authenticityHash: authenticityHash,
      serialNumber: serialNumber,
      registrationDate: new Date().toISOString(),
      status: 'registered',
      supplyChainEvents: [],
      certifications: [],
      currentOwner: manufacturerDID,
      verificationLevel: 'basic'
    };
    
    // Store product record
    this.products.set(productId, productRecord);
    
    // Add to manufacturer's product list
    const manufacturer = this.manufacturers.get(manufacturerDID);
    if (manufacturer) {
      manufacturer.products.push(productId);
    }
    
    console.log(`✅ Product registered: ${productId}`);
    console.log(`🔐 Authenticity hash: ${authenticityHash}`);
    
    return productRecord;
  }

  /**
   * Issue product authenticity credential
   */
  async issueProductCredential(productId, certificationLevel = 'basic') {
    console.log(`🏆 Issuing product authenticity credential for ${productId}...`);
    
    const productRecord = this.products.get(productId);
    if (!productRecord) {
      throw new Error('Product not found');
    }
    
    // Create product credential
    const credential = MarketplaceCredentials.createProductCredential(
      this.authorityDID,
      productId,
      {
        name: productRecord.productInfo.name,
        manufacturer: productRecord.manufacturerDID,
        model: productRecord.productInfo.model,
        serialNumber: productRecord.serialNumber,
        productionDate: productRecord.productInfo.productionDate,
        certifications: productRecord.certifications,
        supplyChainHash: productRecord.authenticityHash,
        verificationLevel: certificationLevel,
        registrationDate: productRecord.registrationDate
      }
    );
    
    // Simulate signing by marketplace authority
    const signedCredential = {
      ...credential.create(),
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${this.authorityDID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: this.generateCredentialSignature(credential.create())
      }
    };
    
    console.log(`✅ Product credential issued: ${signedCredential.id}`);
    return signedCredential;
  }

  /**
   * Add supply chain event
   */
  async addSupplyChainEvent(productId, eventData) {
    console.log(`📍 Adding supply chain event for product ${productId}...`);
    
    const productRecord = this.products.get(productId);
    if (!productRecord) {
      throw new Error('Product not found');
    }
    
    const event = {
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: productId,
      eventType: eventData.type,
      description: eventData.description,
      location: eventData.location,
      timestamp: new Date().toISOString(),
      actor: eventData.actor,
      metadata: eventData.metadata || {},
      verified: false
    };
    
    // Add to product's supply chain
    productRecord.supplyChainEvents.push(event);
    
    // Store in global supply chain events
    this.supplyChainEvents.set(event.eventId, event);
    
    console.log(`✅ Supply chain event added: ${event.eventId}`);
    return event;
  }

  /**
   * Verify product authenticity
   */
  async verifyProductAuthenticity(productId, verificationData) {
    console.log(`🔍 Verifying product authenticity for ${productId}...`);
    
    const productRecord = this.products.get(productId);
    if (!productRecord) {
      return {
        verified: false,
        reason: 'Product not found in registry',
        confidence: 0
      };
    }
    
    // Verification checks
    const verificationResults = {
      productExists: true,
      hashMatches: this.verifyAuthenticityHash(productRecord, verificationData),
      serialNumberValid: this.verifySerialNumber(productRecord, verificationData),
      manufacturerVerified: this.verifyManufacturer(productRecord),
      supplyChainValid: this.verifySupplyChain(productRecord),
      certificationsValid: this.verifyCertifications(productRecord)
    };
    
    // Calculate confidence score
    const confidence = this.calculateConfidenceScore(verificationResults);
    
    const result = {
      verified: confidence >= 80,
      confidence: confidence,
      verificationResults: verificationResults,
      productInfo: {
        name: productRecord.productInfo.name,
        manufacturer: productRecord.manufacturerDID,
        serialNumber: productRecord.serialNumber,
        registrationDate: productRecord.registrationDate
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`📊 Verification result: ${result.verified ? 'VERIFIED' : 'FAILED'} (${confidence}% confidence)`);
    return result;
  }

  /**
   * Transfer product ownership
   */
  async transferOwnership(productId, newOwnerDID, transferData) {
    console.log(`📋 Transferring ownership of product ${productId}...`);
    
    const productRecord = this.products.get(productId);
    if (!productRecord) {
      throw new Error('Product not found');
    }
    
    // Create transfer event
    const transferEvent = {
      type: 'ownership_transfer',
      description: `Ownership transferred from ${productRecord.currentOwner} to ${newOwnerDID}`,
      location: transferData.location || 'Unknown',
      actor: transferData.transferAgent || productRecord.currentOwner,
      metadata: {
        previousOwner: productRecord.currentOwner,
        newOwner: newOwnerDID,
        transferReason: transferData.reason || 'Sale',
        transferValue: transferData.value || null
      }
    };
    
    // Add supply chain event
    await this.addSupplyChainEvent(productId, transferEvent);
    
    // Update product ownership
    productRecord.productDID.transferOwnership(newOwnerDID);
    productRecord.currentOwner = newOwnerDID;
    
    console.log(`✅ Ownership transferred successfully`);
    return {
      success: true,
      previousOwner: transferEvent.metadata.previousOwner,
      newOwner: newOwnerDID,
      transferEvent: transferEvent
    };
  }

  /**
   * Add product certification
   */
  async addCertification(productId, certificationData) {
    console.log(`🏅 Adding certification for product ${productId}...`);
    
    const productRecord = this.products.get(productId);
    if (!productRecord) {
      throw new Error('Product not found');
    }
    
    const certification = {
      certificationId: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: productId,
      type: certificationData.type,
      issuer: certificationData.issuer,
      issueDate: new Date().toISOString(),
      expiryDate: certificationData.expiryDate,
      standard: certificationData.standard,
      scope: certificationData.scope,
      status: 'valid'
    };
    
    productRecord.certifications.push(certification);
    
    console.log(`✅ Certification added: ${certification.certificationId}`);
    return certification;
  }

  /**
   * Get product information
   */
  getProductInfo(productId) {
    const productRecord = this.products.get(productId);
    if (!productRecord) {
      return null;
    }
    
    return {
      productId: productId,
      productDID: productRecord.productDID.id,
      productInfo: productRecord.productInfo,
      manufacturer: productRecord.manufacturerDID,
      currentOwner: productRecord.currentOwner,
      registrationDate: productRecord.registrationDate,
      supplyChainEvents: productRecord.supplyChainEvents.length,
      certifications: productRecord.certifications.length,
      verificationLevel: productRecord.verificationLevel
    };
  }

  /**
   * Generate authenticity hash
   */
  generateAuthenticityHash(productInfo) {
    const data = JSON.stringify({
      name: productInfo.name,
      manufacturer: productInfo.manufacturer,
      model: productInfo.model,
      serialNumber: productInfo.serialNumber,
      productionDate: productInfo.productionDate,
      timestamp: Date.now()
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate serial number
   */
  generateSerialNumber() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `VT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate credential signature
   */
  generateCredentialSignature(credential) {
    const data = JSON.stringify(credential);
    return crypto.createHash('sha256').update(data + Date.now()).digest('hex');
  }

  /**
   * Verify authenticity hash
   */
  verifyAuthenticityHash(productRecord, verificationData) {
    if (!verificationData.expectedHash) return true;
    return productRecord.authenticityHash === verificationData.expectedHash;
  }

  /**
   * Verify serial number
   */
  verifySerialNumber(productRecord, verificationData) {
    if (!verificationData.serialNumber) return true;
    return productRecord.serialNumber === verificationData.serialNumber;
  }

  /**
   * Verify manufacturer
   */
  verifyManufacturer(productRecord) {
    const manufacturer = this.manufacturers.get(productRecord.manufacturerDID);
    return manufacturer && manufacturer.verified;
  }

  /**
   * Verify supply chain
   */
  verifySupplyChain(productRecord) {
    // Check if supply chain events are consistent
    return productRecord.supplyChainEvents.length > 0;
  }

  /**
   * Verify certifications
   */
  verifyCertifications(productRecord) {
    // Check if certifications are valid and not expired
    return productRecord.certifications.every(cert => {
      if (cert.expiryDate) {
        return new Date(cert.expiryDate) > new Date();
      }
      return true;
    });
  }

  /**
   * Calculate confidence score
   */
  calculateConfidenceScore(verificationResults) {
    let score = 0;
    let totalChecks = 0;
    
    Object.values(verificationResults).forEach(result => {
      totalChecks++;
      if (result) score++;
    });
    
    return Math.round((score / totalChecks) * 100);
  }

  /**
   * Get system statistics
   */
  getStatistics() {
    return {
      totalProducts: this.products.size,
      totalManufacturers: this.manufacturers.size,
      totalSupplyChainEvents: this.supplyChainEvents.size,
      totalCertificationBodies: this.certificationBodies.size,
      verificationLevels: this.getVerificationLevelStats()
    };
  }

  /**
   * Get verification level statistics
   */
  getVerificationLevelStats() {
    const stats = {};
    this.products.forEach(product => {
      const level = product.verificationLevel;
      stats[level] = (stats[level] || 0) + 1;
    });
    return stats;
  }
}

module.exports = ProductAuthenticity;
