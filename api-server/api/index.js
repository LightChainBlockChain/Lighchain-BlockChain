const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import the marketplace API server
const MarketplaceAPI = require('../src/marketplace/api-server');

const app = express();

// Enable CORS for all origins in production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Sideline Pinas powered by Veri Token',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Initialize marketplace API
const marketplaceAPI = new MarketplaceAPI();

// Mount all marketplace routes under /api
app.use('/api', marketplaceAPI.getRouter());

// Creator/Lead Developer Commission Configuration
const CREATOR_CONFIG = {
  address: '0x568b65e3C2572f355d08c284348C492856a95F88',
  name: 'Ronirei Light',
  role: 'Creator & Lead Developer',
  commissionRate: 0.10, // 10% commission
  email: 'lightchain2025@outlook.com'
};

// Commission tracking storage (use database in production)
let commissionData = {
  totalCommissionsEarned: 0,
  totalTransactionsProcessed: 0,
  commissionHistory: [],
  lastPayoutDate: null,
  pendingCommissions: 0
};

// Initialize Stripe (replace with your actual keys)
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Funding data storage (use database in production)
let fundingData = {
  totalRaised: 0,
  goal: 750,
  supporters: [],
  milestones: [
    { name: 'Domain Registration', amount: 50, achieved: false },
    { name: 'Feature Enhancement', amount: 200, achieved: false },
    { name: 'Growth & Marketing', amount: 500, achieved: false }
  ]
};

// Funding API endpoints
app.get('/funding/status', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRaised: fundingData.totalRaised,
      goal: fundingData.goal,
      percentage: Math.round((fundingData.totalRaised / fundingData.goal) * 100),
      supportersCount: fundingData.supporters.length,
      milestones: fundingData.milestones,
      nextMilestone: fundingData.milestones.find(m => !m.achieved)
    }
  });
});

app.post('/funding/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', supporterEmail, supporterName } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least $1'
      });
    }

    if (!stripe) {
      // Fallback for demo purposes
      const mockPaymentIntent = {
        id: `pi_demo_${Date.now()}`,
        client_secret: `pi_demo_${Date.now()}_secret_demo`,
        amount: amount * 100,
        currency: currency,
        status: 'requires_payment_method'
      };

      return res.json({
        success: true,
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        message: 'Demo mode - Add STRIPE_SECRET_KEY to environment for live payments',
        demoMode: true
      });
    }

    // Real Stripe integration
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency,
      metadata: {
        project: 'sideline-pinas-veritoken',
        supporterEmail: supporterEmail || 'anonymous',
        supporterName: supporterName || 'Anonymous Supporter',
        timestamp: new Date().toISOString()
      },
      description: `Support for Sideline Pinas powered by Veri Token - $${amount}`,
      receipt_email: supporterEmail || null
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      message: 'Payment intent created successfully'
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: stripe ? 'Failed to create payment intent' : 'Stripe not configured'
    });
  }
});

// Creator Commission API Endpoints
app.get('/api/creator/commission-status', (req, res) => {
  res.json({
    success: true,
    creator: CREATOR_CONFIG,
    commissions: {
      totalEarned: commissionData.totalCommissionsEarned,
      pendingAmount: commissionData.pendingCommissions,
      totalTransactions: commissionData.totalTransactionsProcessed,
      averageCommission: commissionData.totalTransactionsProcessed > 0 
        ? (commissionData.totalCommissionsEarned / commissionData.totalTransactionsProcessed).toFixed(4)
        : 0,
      lastPayoutDate: commissionData.lastPayoutDate,
      commissionRate: (CREATOR_CONFIG.commissionRate * 100) + '%'
    },
    recentTransactions: commissionData.commissionHistory.slice(-10).reverse()
  });
});

app.get('/api/creator/metamask-integration', (req, res) => {
  res.json({
    success: true,
    message: 'MetaMask Integration Active',
    creator: {
      address: CREATOR_CONFIG.address,
      name: CREATOR_CONFIG.name,
      role: CREATOR_CONFIG.role,
      verified: true
    },
    integration: {
      status: 'ACTIVE',
      commissionRate: CREATOR_CONFIG.commissionRate,
      autoPayoutEnabled: true,
      minimumPayoutThreshold: 0.01, // ETH
      supportedNetworks: ['Ethereum', 'Polygon', 'VeriToken']
    },
    instructions: {
      connectWallet: 'Connect MetaMask to view commission earnings',
      claimCommissions: 'Use /api/creator/claim-commission endpoint',
      viewHistory: 'Check /api/creator/commission-history for details'
    }
  });
});

// Function to calculate and record commission
function processCreatorCommission(transactionAmount, transactionType, transactionId) {
  const commissionAmount = transactionAmount * CREATOR_CONFIG.commissionRate;
  
  const commissionRecord = {
    id: Date.now(),
    transactionId: transactionId,
    transactionType: transactionType,
    transactionAmount: transactionAmount,
    commissionAmount: commissionAmount,
    commissionRate: CREATOR_CONFIG.commissionRate,
    timestamp: new Date().toISOString(),
    status: 'pending',
    creatorAddress: CREATOR_CONFIG.address
  };
  
  // Update commission data
  commissionData.totalCommissionsEarned += commissionAmount;
  commissionData.totalTransactionsProcessed += 1;
  commissionData.pendingCommissions += commissionAmount;
  commissionData.commissionHistory.push(commissionRecord);
  
  console.log(`💰 Creator Commission Earned: $${commissionAmount.toFixed(4)} from $${transactionAmount} transaction`);
  console.log(`📊 Total Creator Commissions: $${commissionData.totalCommissionsEarned.toFixed(4)}`);
  
  return commissionRecord;
}

// Commission claiming endpoint
app.post('/api/creator/claim-commission', (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    
    // Verify this is the creator's wallet
    if (walletAddress?.toLowerCase() !== CREATOR_CONFIG.address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only creator can claim commissions',
        requiredAddress: CREATOR_CONFIG.address
      });
    }
    
    const claimAmount = amount || commissionData.pendingCommissions;
    
    if (claimAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending commissions to claim'
      });
    }
    
    if (claimAmount > commissionData.pendingCommissions) {
      return res.status(400).json({
        success: false,
        error: 'Claim amount exceeds pending commissions',
        available: commissionData.pendingCommissions
      });
    }
    
    // Process the claim (in production, this would trigger actual blockchain transaction)
    const claimRecord = {
      id: Date.now(),
      type: 'commission_claim',
      amount: claimAmount,
      walletAddress: walletAddress,
      timestamp: new Date().toISOString(),
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Demo hash
      status: 'completed'
    };
    
    // Update pending commissions
    commissionData.pendingCommissions -= claimAmount;
    commissionData.lastPayoutDate = new Date().toISOString();
    
    // Mark related commission records as claimed
    commissionData.commissionHistory.forEach(record => {
      if (record.status === 'pending') {
        record.status = 'claimed';
        record.claimedDate = claimRecord.timestamp;
        record.claimTransactionHash = claimRecord.transactionHash;
      }
    });
    
    res.json({
      success: true,
      message: 'Commission claimed successfully! 🎉',
      claim: claimRecord,
      remaining: {
        pendingCommissions: commissionData.pendingCommissions,
        totalEarned: commissionData.totalCommissionsEarned
      },
      metamask: {
        instruction: 'Check MetaMask for incoming transaction',
        network: 'Ethereum/Polygon/VeriToken',
        estimatedConfirmation: '2-5 minutes'
      }
    });
    
  } catch (error) {
    console.error('Commission claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process commission claim'
    });
  }
});

// Commission history endpoint
app.get('/api/creator/commission-history', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  const history = commissionData.commissionHistory
    .slice(offset, offset + parseInt(limit))
    .reverse();
  
  res.json({
    success: true,
    data: {
      commissions: history,
      total: commissionData.commissionHistory.length,
      summary: {
        totalEarned: commissionData.totalCommissionsEarned,
        totalTransactions: commissionData.totalTransactionsProcessed,
        averageCommission: commissionData.totalTransactionsProcessed > 0 
          ? (commissionData.totalCommissionsEarned / commissionData.totalTransactionsProcessed)
          : 0,
        pendingAmount: commissionData.pendingCommissions
      }
    }
  });
});

// Payment confirmation endpoint
app.post('/funding/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, amount, supporterEmail, supporterName } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    // Verify payment with Stripe if available
    let paymentIntent = null;
    if (stripe) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            error: 'Payment not completed'
          });
        }
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        return res.status(400).json({
          success: false,
          error: 'Payment verification failed'
        });
      }
    }

    // Create supporter record
    const supporter = {
      id: Date.now(),
      name: supporterName || paymentIntent?.metadata?.supporterName || 'Anonymous',
      email: supporterEmail || paymentIntent?.metadata?.supporterEmail,
      amount: paymentIntent ? paymentIntent.amount / 100 : parseFloat(amount),
      date: new Date().toISOString(),
      paymentIntentId: paymentIntentId,
      verified: !!stripe
    };

    // Update funding data
    fundingData.totalRaised += supporter.amount;
    fundingData.supporters.push(supporter);
    
    // Process creator commission for this transaction
    const commissionRecord = processCreatorCommission(
      supporter.amount, 
      'funding_payment', 
      paymentIntentId
    );

    // Check and update milestones
    const newlyAchieved = [];
    fundingData.milestones.forEach(milestone => {
      if (!milestone.achieved && fundingData.totalRaised >= milestone.amount) {
        milestone.achieved = true;
        milestone.achievedDate = new Date().toISOString();
        newlyAchieved.push(milestone);
        console.log(`🎉 Milestone achieved: ${milestone.name} ($${milestone.amount})`);
      }
    });

    // Check if we can now buy the domain
    const canBuyDomain = fundingData.totalRaised >= 50 && !fundingData.domainPurchased;

    res.json({
      success: true,
      data: {
        supporter: {
          name: supporter.name,
          amount: supporter.amount,
          date: supporter.date
        },
        totalRaised: fundingData.totalRaised,
        newMilestonesAchieved: newlyAchieved,
        canBuyDomain: canBuyDomain,
        creatorCommission: {
          amount: commissionRecord.commissionAmount,
          rate: (CREATOR_CONFIG.commissionRate * 100) + '%',
          creatorAddress: CREATOR_CONFIG.address,
          message: 'Creator commission automatically calculated'
        },
        message: 'Thank you for your support! 🙏 Creator commission processed.'
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment'
    });
  }
});

// Stripe webhook endpoint
app.post('/funding/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
      
      // Auto-confirm the payment
      try {
        const amount = paymentIntent.amount / 100;
        const supporter = {
          id: Date.now(),
          name: paymentIntent.metadata.supporterName || 'Anonymous',
          email: paymentIntent.metadata.supporterEmail,
          amount: amount,
          date: new Date().toISOString(),
          paymentIntentId: paymentIntent.id,
          verified: true
        };

        fundingData.totalRaised += supporter.amount;
        fundingData.supporters.push(supporter);
        
        // Process creator commission via webhook
        processCreatorCommission(
          supporter.amount,
          'webhook_payment',
          paymentIntent.id
        );

        // Check milestones
        fundingData.milestones.forEach(milestone => {
          if (!milestone.achieved && fundingData.totalRaised >= milestone.amount) {
            milestone.achieved = true;
            milestone.achievedDate = new Date().toISOString();
            console.log(`🎉 Milestone achieved via webhook: ${milestone.name}`);
          }
        });
      } catch (webhookError) {
        console.error('Webhook processing error:', webhookError);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

app.get('/funding', (req, res) => {
  res.json({
    message: 'Sideline Pinas powered by Veri Token - Funding API',
    version: '1.0.0',
    stripeConfigured: !!stripe,
    totalRaised: fundingData.totalRaised,
    goal: fundingData.goal,
    endpoints: {
      status: '/funding/status',
      createPayment: '/funding/create-payment-intent',
      confirmPayment: '/funding/confirm-payment',
      webhook: '/funding/webhook',
      supportPage: '/support'
    }
  });
});

// Serve funding page
app.get('/support', (req, res) => {
  const fundingPagePath = path.join(__dirname, '..', 'public', 'funding.html');
  if (fs.existsSync(fundingPagePath)) {
    res.sendFile(fundingPagePath);
  } else {
    res.status(404).json({ error: 'Funding page not found' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sideline Pinas powered by Veri Token - Decentralized Marketplace API',
    version: '2.0.0',
    docs: '/api',
    health: '/health',
    endpoints: {
      identities: '/api/identities',
      credentials: '/api/credentials',
      wallets: '/api/wallets',
      onboarding: '/api/onboarding',
      products: '/api/products',
      transactions: '/api/transactions',
      stats: '/api/stats',
      support: '/support',
      funding: '/funding',
      creatorCommission: '/api/creator/commission-status',
      metamaskIntegration: '/api/creator/metamask-integration',
      claimCommission: '/api/creator/claim-commission',
      commissionHistory: '/api/creator/commission-history'
    }
  });
});

// Export for Vercel
module.exports = app;
