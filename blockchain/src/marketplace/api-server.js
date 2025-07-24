const express = require('express');
const cors = require('cors');
const VeriTokenMarketplace = require('../index');
const MarketplaceWallet = require('../wallet/marketplace-wallet');
const CustomerOnboarding = require('./customer-onboarding');
const ProductAuthenticity = require('./product-authenticity');
const ZKPSystem = require('../crypto/zkp-system');

/**
 * VeriToken Marketplace API Server
 * RESTful API for marketplace operations
 */
class MarketplaceAPI {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.marketplace = new VeriTokenMarketplace();
    this.customerOnboarding = new CustomerOnboarding('did:veritoken:mainnet:marketplace-authority');
    this.productAuthenticity = new ProductAuthenticity('did:veritoken:mainnet:marketplace-authority');
    this.zkpSystem = new ZKPSystem();
    this.wallets = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      // no-dd-sa:javascript-best-practices/no-console
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Identity management routes
    this.app.post('/identity/create', this.createIdentity.bind(this));
    this.app.get('/identity/:did', this.getIdentity.bind(this));
    this.app.get('/identity/:did/document', this.getIdentityDocument.bind(this));

    // Wallet management routes
    this.app.post('/wallet/create', this.createWallet.bind(this));
    this.app.get('/wallet/:walletId', this.getWallet.bind(this));
    this.app.get('/wallet/:walletId/identities', this.getWalletIdentities.bind(this));
    this.app.get('/wallet/:walletId/credentials', this.getWalletCredentials.bind(this));
    this.app.post('/wallet/:walletId/connect', this.connectWallet.bind(this));

    // Customer onboarding routes
    this.app.post('/customer/onboard', this.onboardCustomer.bind(this));
    this.app.get('/customer/onboard/:sessionId', this.getOnboardingStatus.bind(this));

    // Product authenticity routes
    this.app.post('/product/register', this.registerProduct.bind(this));
    this.app.get('/product/:productId', this.getProduct.bind(this));
    this.app.post('/product/:productId/verify', this.verifyProduct.bind(this));
    this.app.post('/product/:productId/transfer', this.transferProduct.bind(this));
    this.app.post('/product/:productId/certify', this.certifyProduct.bind(this));

    // Credential management routes
    this.app.post('/credential/issue', this.issueCredential.bind(this));
    this.app.post('/credential/verify', this.verifyCredential.bind(this));
    this.app.post('/credential/selective-disclosure', this.createSelectiveDisclosure.bind(this));

    // Transaction routes
    this.app.post('/transaction/create', this.createTransaction.bind(this));
    this.app.get('/transaction/:transactionId', this.getTransaction.bind(this));
    this.app.put('/transaction/:transactionId/status', this.updateTransactionStatus.bind(this));

    // Marketplace specific routes
    this.app.get('/marketplace', this.getMarketplaceInfo.bind(this));
    this.app.get('/marketplace/products', this.getMarketplaceProducts.bind(this));
    this.app.get('/marketplace/sellers', this.getMarketplaceSellers.bind(this));
    this.app.get('/status', this.getServiceStatus.bind(this));
    
    // Statistics and reporting
    this.app.get('/stats', this.getStatistics.bind(this));
    this.app.get('/stats/products', this.getProductStats.bind(this));
    this.app.get('/stats/marketplace', this.getMarketplaceStats.bind(this));

    // Zero-Knowledge Proof routes
    this.app.post('/zkp/generate', this.generateZKP.bind(this));
    this.app.post('/zkp/verify', this.verifyZKP.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }
  
  /**
   * Generate zero-knowledge proof endpoint
   */
  async generateZKP(req, res) {
    try {
      const { proofType, inputs, metadata } = req.body;
      if (!proofType || !inputs) {
        return res.status(400).json({ error: 'Proof type and inputs are required' });
      }

      const { proofId, proof } = await this.zkpSystem.generateProof(proofType, inputs, metadata);

      res.json({
        success: true,
        proofId: proofId,
        proof: proof
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify zero-knowledge proof endpoint
   */
  async verifyZKP(req, res) {
    try {
      const { proofId } = req.body;
      if (!proofId) {
        return res.status(400).json({ error: 'Proof ID is required' });
      }

      const result = await this.zkpSystem.verifyProof(proofId);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create identity endpoint
   */
  async createIdentity(req, res) {
    try {
      const { type, info } = req.body;
      
      if (!type) {
        return res.status(400).json({ error: 'Identity type is required' });
      }
      
      const entity = await this.marketplace.createEntity(type, info);
      
      res.json({
        success: true,
        entity: {
          id: entity.id,
          type: entity.entityType,
          created: entity.created,
          document: entity.document
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get identity endpoint
   */
  async getIdentity(req, res) {
    try {
      const { did } = req.params;
      const entity = this.marketplace.getEntity(did);
      
      if (!entity) {
        return res.status(404).json({ error: 'Identity not found' });
      }
      
      res.json({
        id: entity.id,
        type: entity.entityType,
        created: entity.created,
        updated: entity.updated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get identity document endpoint
   */
  async getIdentityDocument(req, res) {
    try {
      const { did } = req.params;
      const entity = this.marketplace.getEntity(did);
      
      if (!entity) {
        return res.status(404).json({ error: 'Identity not found' });
      }
      
      res.json(entity.document);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create wallet endpoint
   */
  async createWallet(req, res) {
    try {
      const { walletId } = req.body;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }
      
      const wallet = new MarketplaceWallet(walletId);
      this.wallets.set(walletId, wallet);
      
      res.json({
        success: true,
        walletId: walletId,
        statistics: wallet.getStatistics()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get wallet endpoint
   */
  async getWallet(req, res) {
    try {
      const { walletId } = req.params;
      const wallet = this.wallets.get(walletId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      res.json({
        walletId: walletId,
        statistics: wallet.getStatistics(),
        preferences: wallet.preferences
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get wallet identities endpoint
   */
  async getWalletIdentities(req, res) {
    try {
      const { walletId } = req.params;
      const wallet = this.wallets.get(walletId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const identities = wallet.listIdentities();
      res.json({
        walletId: walletId,
        identities: identities.map(id => ({
          id: id.id,
          type: id.entityType,
          created: id.created
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get wallet credentials endpoint
   */
  async getWalletCredentials(req, res) {
    try {
      const { walletId } = req.params;
      const wallet = this.wallets.get(walletId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const credentials = wallet.listCredentials();
      res.json({
        walletId: walletId,
        credentials: credentials.map(cred => ({
          id: cred.id,
          type: cred.type,
          issuer: cred.issuer,
          issuanceDate: cred.issuanceDate
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Connect wallet endpoint
   */
  async connectWallet(req, res) {
    try {
      const { walletId } = req.params;
      const { entityDID, connectionType } = req.body;
      
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const connection = await wallet.connect(entityDID, connectionType);
      res.json({
        success: true,
        connection: connection
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get onboarding status endpoint
   */
  async getOnboardingStatus(req, res) {
    try {
      const { sessionId } = req.params;
      
      // This would typically query a database for the session
      // For now, we'll return a mock response
      res.json({
        sessionId: sessionId,
        status: 'completed',
        message: 'Onboarding session completed'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Customer onboarding endpoint
   */
  async onboardCustomer(req, res) {
    try {
      const { customerData, verificationData, kycData } = req.body;
      
      const result = await this.customerOnboarding.performFullOnboarding(
        customerData,
        verificationData,
        kycData
      );
      
      if (result.success) {
        // Store the wallet for later access
        this.wallets.set(result.wallet.walletId, result.wallet);
        
        res.json({
          success: true,
          summary: result.summary,
          walletId: result.wallet.walletId,
          customerDID: result.customerDID.id
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Register product endpoint
   */
  async registerProduct(req, res) {
    try {
      const { productInfo, manufacturerDID } = req.body;
      
      if (!productInfo || !manufacturerDID) {
        return res.status(400).json({ error: 'Product info and manufacturer DID are required' });
      }
      
      const productRecord = await this.productAuthenticity.registerProduct(
        productInfo,
        manufacturerDID
      );
      
      res.json({
        success: true,
        productId: productRecord.productId,
        productDID: productRecord.productDID.id,
        authenticityHash: productRecord.authenticityHash,
        serialNumber: productRecord.serialNumber
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify product endpoint
   */
  async verifyProduct(req, res) {
    try {
      const { productId } = req.params;
      const verificationData = req.body;
      
      const result = await this.productAuthenticity.verifyProductAuthenticity(
        productId,
        verificationData
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Issue credential endpoint
   */
  async issueCredential(req, res) {
    try {
      const { issuerDID, subjectDID, credentialType, claims } = req.body;
      
      if (!issuerDID || !subjectDID || !credentialType || !claims) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const credential = await this.marketplace.issueCredential(
        issuerDID,
        subjectDID,
        credentialType,
        claims
      );
      
      res.json({
        success: true,
        credential: credential
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create transaction endpoint
   */
  async createTransaction(req, res) {
    try {
      const { buyerDID, sellerDID, productDID, amount, currency } = req.body;
      
      if (!buyerDID || !sellerDID || !productDID || !amount) {
        return res.status(400).json({ error: 'Missing required transaction fields' });
      }
      
      const transaction = await this.marketplace.createTransaction(
        buyerDID,
        sellerDID,
        productDID,
        amount,
        currency
      );
      
      res.json({
        success: true,
        transactionId: transaction.id,
        transaction: transaction.transactionInfo
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get product endpoint
   */
  async getProduct(req, res) {
    try {
      const { productId } = req.params;
      const productInfo = this.productAuthenticity.getProductInfo(productId);
      
      if (!productInfo) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(productInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Transfer product endpoint
   */
  async transferProduct(req, res) {
    try {
      const { productId } = req.params;
      const { newOwnerDID, transferData } = req.body;
      
      if (!newOwnerDID) {
        return res.status(400).json({ error: 'New owner DID is required' });
      }
      
      const result = await this.productAuthenticity.transferOwnership(
        productId,
        newOwnerDID,
        transferData || {}
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Certify product endpoint
   */
  async certifyProduct(req, res) {
    try {
      const { productId } = req.params;
      const certificationData = req.body;
      
      const certification = await this.productAuthenticity.addCertification(
        productId,
        certificationData
      );
      
      res.json({
        success: true,
        certification: certification
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify credential endpoint
   */
  async verifyCredential(req, res) {
    try {
      const { credentialId } = req.body;
      
      if (!credentialId) {
        return res.status(400).json({ error: 'Credential ID is required' });
      }
      
      const result = await this.marketplace.verifyCredential(credentialId);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create selective disclosure endpoint
   */
  async createSelectiveDisclosure(req, res) {
    try {
      const { walletId, credentialId, attributesToReveal } = req.body;
      
      if (!walletId || !credentialId || !attributesToReveal) {
        return res.status(400).json({ error: 'Wallet ID, credential ID, and attributes are required' });
      }
      
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const disclosed = await wallet.createSelectiveDisclosure(credentialId, attributesToReveal);
      
      res.json({
        success: true,
        disclosedCredential: disclosed
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get transaction endpoint
   */
  async getTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const transaction = this.marketplace.getEntity(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json({
        id: transaction.id,
        type: transaction.entityType,
        transactionInfo: transaction.transactionInfo,
        created: transaction.created
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update transaction status endpoint
   */
  async updateTransactionStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      
      const result = await this.marketplace.updateTransactionStatus(transactionId, status);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get statistics endpoint
   */
  async getStatistics(req, res) {
    try {
      const marketplaceStats = this.marketplace.getStatistics();
      const productStats = this.productAuthenticity.getStatistics();
      const zkpStats = this.zkpSystem.getStatistics();
      
      res.json({
        marketplace: marketplaceStats,
        products: productStats,
        zkp: zkpStats,
        wallets: this.wallets.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get product statistics endpoint
   */
  async getProductStats(req, res) {
    try {
      const stats = this.productAuthenticity.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get marketplace statistics endpoint
   */
  async getMarketplaceStats(req, res) {
    try {
      const stats = this.marketplace.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get marketplace info endpoint
   */
  async getMarketplaceInfo(req, res) {
    try {
      res.json({
        success: true,
        service: 'Sideline Pinas Marketplace',
        description: 'Decentralized marketplace for the Philippines powered by VeriToken',
        version: '2.0.0',
        features: [
          'Decentralized Identity',
          'Secure Transactions', 
          'Product Authenticity',
          'Zero-Knowledge Proofs',
          'Philippines-Focused'
        ],
        endpoints: {
          health: '/health',
          marketplace: '/marketplace',
          identity: '/identity',
          products: '/product',
          status: '/status'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get marketplace products endpoint
   */
  async getMarketplaceProducts(req, res) {
    try {
      // Mock products for demo
      const products = [
        {
          id: 'prod_001',
          name: 'Handwoven Barong Tagalog',
          category: 'Fashion',
          price: 2500,
          currency: 'PHP',
          seller: 'Filipino Artisan Co.',
          verified: true,
          location: 'Ilocos Norte'
        },
        {
          id: 'prod_002', 
          name: 'Organic Coconut Oil',
          category: 'Health & Beauty',
          price: 350,
          currency: 'PHP',
          seller: 'Laguna Farms',
          verified: true,
          location: 'Laguna'
        },
        {
          id: 'prod_003',
          name: 'Digital Art NFT - Sarimanok',
          category: 'Digital Art',
          price: 0.5,
          currency: 'ETH',
          seller: 'PinoyArt Digital',
          verified: true,
          location: 'Metro Manila'
        }
      ];
      
      res.json({
        success: true,
        products: products,
        count: products.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get marketplace sellers endpoint
   */
  async getMarketplaceSellers(req, res) {
    try {
      // Mock sellers for demo
      const sellers = [
        {
          id: 'seller_001',
          name: 'Filipino Artisan Co.',
          location: 'Ilocos Norte',
          rating: 4.8,
          products: 15,
          verified: true,
          specialties: ['Traditional Clothing', 'Handicrafts']
        },
        {
          id: 'seller_002',
          name: 'Laguna Farms',
          location: 'Laguna',
          rating: 4.9,
          products: 8,
          verified: true,
          specialties: ['Organic Products', 'Agriculture']
        },
        {
          id: 'seller_003',
          name: 'PinoyArt Digital',
          location: 'Metro Manila',
          rating: 4.7,
          products: 25,
          verified: true,
          specialties: ['Digital Art', 'NFTs']
        }
      ];
      
      res.json({
        success: true,
        sellers: sellers,
        count: sellers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get service status endpoint
   */
  async getServiceStatus(req, res) {
    try {
      res.json({
        status: 'operational',
        service: 'Sideline Pinas powered by VeriToken',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        uptime: process.uptime(),
        features: {
          marketplace: 'active',
          identity: 'active',
          payments: 'active',
          zkp: 'active'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Error handler
   */
  errorHandler(err, req, res, next) {
    // no-dd-sa:javascript-best-practices/no-console
    console.error('API Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }

  /**
   * Get the Express router for mounting in other apps
   */
  getRouter() {
    return this.app;
  }

  /**
   * Start the server
   */
  async start() {
    // Initialize ZKP system
    await this.zkpSystem.initialize();
    
    this.app.listen(this.port, () => {
      console.log(`🚀 Sideline Pinas powered by Veri Token API Server running on port ${this.port}`);
      console.log(`📍 Health check: http://localhost:${this.port}/health`);
      console.log(`📖 API Documentation: http://localhost:${this.port}/api`);
      console.log(`🔐 ZKP System: ${this.zkpSystem.circuits.size} circuits initialized`);
    });
  }
}

module.exports = MarketplaceAPI;
