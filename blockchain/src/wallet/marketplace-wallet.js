const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DID = require('../core/did');
const { MerchantDID, CustomerDID, ProductDID, TransactionDID } = require('../marketplace/schemas');
const { VerifiableCredential, MarketplaceCredentials } = require('../credentials/verifiable-credential');

/**
 * Marketplace Wallet - Identity Wallet for marketplace participants
 * Manages DIDs, credentials, and privacy-preserving interactions
 */
class MarketplaceWallet {
  constructor(walletId) {
    this.walletId = walletId;
    this.walletDir = path.join(__dirname, '..', '..', 'wallets', walletId);
    this.dids = new Map();
    this.credentials = new Map();
    this.connections = new Map();
    this.preferences = {
      defaultPrivacyLevel: 'selective',
      autoAcceptCredentials: false,
      enableZeroKnowledgeProofs: true
    };
    
    this.ensureWalletDirectory();
    this.loadWalletData();
  }

  /**
   * Ensure wallet directory exists
   */
  ensureWalletDirectory() {
    if (!fs.existsSync(this.walletDir)) {
      fs.mkdirSync(this.walletDir, { recursive: true });
    }
  }

  /**
   * Load wallet data from storage
   */
  loadWalletData() {
    try {
      const walletFile = path.join(this.walletDir, 'wallet.json');
      if (fs.existsSync(walletFile)) {
        const walletData = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
        this.preferences = { ...this.preferences, ...walletData.preferences };
        
        // Load DIDs
        if (walletData.dids) {
          walletData.dids.forEach(didData => {
            const did = this.reconstructDID(didData);
            this.dids.set(did.id, did);
          });
        }
        
        // Load credentials
        if (walletData.credentials) {
          walletData.credentials.forEach(cred => {
            this.credentials.set(cred.id, cred);
          });
        }
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  }

  /**
   * Save wallet data to storage
   */
  saveWalletData() {
    try {
      const walletData = {
        walletId: this.walletId,
        preferences: this.preferences,
        dids: Array.from(this.dids.values()).map(did => did.export()),
        credentials: Array.from(this.credentials.values()),
        connections: Array.from(this.connections.entries()).map(([id, conn]) => ({ id, ...conn }))
      };
      
      const walletFile = path.join(this.walletDir, 'wallet.json');
      fs.writeFileSync(walletFile, JSON.stringify(walletData, null, 2));
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  }

  /**
   * Reconstruct DID from stored data
   */
  reconstructDID(didData) {
    switch (didData.method) {
      case 'veritoken-merchant':
        return MerchantDID.import ? MerchantDID.import(didData) : DID.import(didData);
      case 'veritoken-customer':
        return CustomerDID.import ? CustomerDID.import(didData) : DID.import(didData);
      case 'veritoken-product':
        return ProductDID.import ? ProductDID.import(didData) : DID.import(didData);
      case 'veritoken-transaction':
        return TransactionDID.import ? TransactionDID.import(didData) : DID.import(didData);
      default:
        return DID.import(didData);
    }
  }

  /**
   * Create a new identity in the wallet
   */
  async createIdentity(type, options = {}) {
    let did;
    
    switch (type) {
      case 'merchant':
        did = new MerchantDID();
        if (options.businessInfo) {
          did.setBusinessInfo(options.businessInfo);
        }
        break;
      case 'customer':
        did = new CustomerDID();
        if (options.profile) {
          did.setProfile(options.profile);
        }
        break;
      case 'product':
        did = new ProductDID();
        if (options.productInfo) {
          did.setProductInfo(options.productInfo);
        }
        break;
      case 'transaction':
        did = new TransactionDID();
        if (options.transactionInfo) {
          did.setTransactionInfo(options.transactionInfo);
        }
        break;
      default:
        throw new Error(`Unknown identity type: ${type}`);
    }
    
    did.generateKeyPair();
    did.createDocument();
    
    this.dids.set(did.id, did);
    this.saveWalletData();
    
    return did;
  }

  /**
   * Get identity by DID
   */
  getIdentity(didId) {
    return this.dids.get(didId);
  }

  /**
   * List all identities
   */
  listIdentities() {
    return Array.from(this.dids.values());
  }

  /**
   * Store received credential
   */
  async storeCredential(credential) {
    // For now, we'll trust credentials from external issuers
    // In production, this would verify against a trusted issuer registry
    this.credentials.set(credential.id, credential);
    this.saveWalletData();
    
    return credential;
  }

  /**
   * Get credential by ID
   */
  getCredential(credentialId) {
    return this.credentials.get(credentialId);
  }

  /**
   * List all credentials
   */
  listCredentials() {
    return Array.from(this.credentials.values());
  }

  /**
   * Create selective disclosure proof
   */
  async createSelectiveDisclosure(credentialId, attributesToReveal) {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }
    
    const disclosedCredential = {
      ...credential,
      credentialSubject: {
        id: credential.credentialSubject.id
      }
    };
    
    // Only include specified attributes
    attributesToReveal.forEach(attr => {
      if (credential.credentialSubject[attr] !== undefined) {
        disclosedCredential.credentialSubject[attr] = credential.credentialSubject[attr];
      }
    });
    
    return disclosedCredential;
  }

  /**
   * Create zero-knowledge proof for attribute
   */
  async createZKProof(credentialId, attribute, condition) {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }
    
    const value = credential.credentialSubject[attribute];
    if (value === undefined) {
      throw new Error(`Attribute ${attribute} not found in credential`);
    }
    
    // Simple ZK proof simulation (in production, use proper ZK libraries)
    const proof = {
      type: 'ZeroKnowledgeProof',
      attribute: attribute,
      condition: condition,
      result: this.evaluateCondition(value, condition),
      proofValue: this.generateProofValue(value, condition),
      timestamp: new Date().toISOString()
    };
    
    return proof;
  }

  /**
   * Evaluate condition for ZK proof
   */
  evaluateCondition(value, condition) {
    switch (condition.type) {
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'equals':
        return value === condition.value;
      case 'age_over':
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age >= condition.value;
      default:
        return false;
    }
  }

  /**
   * Generate proof value (cryptographic proof)
   */
  generateProofValue(value, condition) {
    // In production, this would use proper ZK proof generation
    const data = JSON.stringify({ value, condition, timestamp: Date.now() });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Connect to another entity
   */
  async connect(entityDID, connectionType = 'business') {
    const connection = {
      entityDID: entityDID,
      connectionType: connectionType,
      established: new Date().toISOString(),
      status: 'active',
      permissions: {
        shareProfile: false,
        receiveCreds: true,
        businessTransactions: connectionType === 'business'
      }
    };
    
    this.connections.set(entityDID, connection);
    this.saveWalletData();
    
    return connection;
  }

  /**
   * Get connection info
   */
  getConnection(entityDID) {
    return this.connections.get(entityDID);
  }

  /**
   * List all connections
   */
  listConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Update wallet preferences
   */
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.saveWalletData();
  }

  /**
   * Export wallet for backup
   */
  exportWallet() {
    return {
      walletId: this.walletId,
      identities: Array.from(this.dids.values()).map(did => did.export()),
      credentials: Array.from(this.credentials.values()),
      connections: Array.from(this.connections.values()),
      preferences: this.preferences,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Get wallet statistics
   */
  getStatistics() {
    const stats = {
      totalIdentities: this.dids.size,
      totalCredentials: this.credentials.size,
      totalConnections: this.connections.size,
      identityTypes: {},
      credentialTypes: {},
      connectionTypes: {}
    };
    
    // Count identity types
    this.dids.forEach(did => {
      const type = did.entityType || 'basic';
      stats.identityTypes[type] = (stats.identityTypes[type] || 0) + 1;
    });
    
    // Count credential types
    this.credentials.forEach(cred => {
      const type = cred.type[cred.type.length - 1];
      stats.credentialTypes[type] = (stats.credentialTypes[type] || 0) + 1;
    });
    
    // Count connection types
    this.connections.forEach(conn => {
      const type = conn.connectionType;
      stats.connectionTypes[type] = (stats.connectionTypes[type] || 0) + 1;
    });
    
    return stats;
  }
}

module.exports = MarketplaceWallet;
