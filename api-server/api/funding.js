const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// In-memory storage for demo (use a database in production)
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

/**
 * Get funding status
 */
app.get('/status', (req, res) => {
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

/**
 * Create payment intent (Stripe integration placeholder)
 */
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', supporterEmail, supporterName } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least $1'
      });
    }

    // TODO: Replace with actual Stripe integration
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // Stripe uses cents
    //   currency: currency,
    //   metadata: {
    //     project: 'sideline-pinas-veritoken',
    //     supporterEmail: supporterEmail,
    //     supporterName: supporterName
    //   }
    // });

    // For demo purposes, simulate payment intent
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_mock`,
      amount: amount * 100,
      currency: currency,
      status: 'requires_payment_method'
    };

    res.json({
      success: true,
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
      message: 'Payment intent created successfully'
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

/**
 * Handle payment confirmation (webhook simulation)
 */
app.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, amount, supporterEmail, supporterName } = req.body;
    
    // TODO: Verify payment with Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // For demo purposes, simulate successful payment
    const supporter = {
      id: Date.now(),
      name: supporterName || 'Anonymous',
      email: supporterEmail,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      paymentIntentId: paymentIntentId
    };

    // Update funding data
    fundingData.totalRaised += supporter.amount;
    fundingData.supporters.push(supporter);

    // Check milestones
    fundingData.milestones.forEach(milestone => {
      if (!milestone.achieved && fundingData.totalRaised >= milestone.amount) {
        milestone.achieved = true;
        console.log(`🎉 Milestone achieved: ${milestone.name} ($${milestone.amount})`);
      }
    });

    res.json({
      success: true,
      data: {
        supporter: supporter,
        totalRaised: fundingData.totalRaised,
        newMilestonesAchieved: fundingData.milestones.filter(m => m.achieved),
        message: 'Thank you for your support!'
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

/**
 * Get supporters list (anonymized)
 */
app.get('/supporters', (req, res) => {
  const anonymizedSupporters = fundingData.supporters.map(supporter => ({
    name: supporter.name.charAt(0) + '*'.repeat(supporter.name.length - 1),
    amount: supporter.amount,
    date: supporter.date
  }));

  res.json({
    success: true,
    data: {
      supporters: anonymizedSupporters,
      total: fundingData.supporters.length
    }
  });
});

/**
 * Stripe webhook endpoint (for production)
 */
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  // TODO: Implement Stripe webhook handling
  // const sig = req.headers['stripe-signature'];
  // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // let event;
  // try {
  //   event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  // } catch (err) {
  //   console.log(`Webhook signature verification failed.`, err.message);
  //   return res.status(400).send(`Webhook Error: ${err.message}`);
  // }

  // Handle the event
  console.log('Webhook received (placeholder)');
  res.json({received: true});
});

/**
 * Get funding statistics for admin
 */
app.get('/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRaised: fundingData.totalRaised,
      goal: fundingData.goal,
      supporters: fundingData.supporters,
      milestones: fundingData.milestones,
      averageContribution: fundingData.supporters.length > 0 
        ? fundingData.totalRaised / fundingData.supporters.length 
        : 0,
      recentSupport: fundingData.supporters.slice(-5).reverse()
    }
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Sideline Pinas Funding API',
    timestamp: new Date().toISOString()
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Sideline Pinas powered by Veri Token - Funding API',
    version: '1.0.0',
    endpoints: {
      status: '/status',
      createPayment: '/create-payment-intent',
      confirmPayment: '/confirm-payment',
      supporters: '/supporters',
      webhook: '/webhook',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Funding API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = app;
