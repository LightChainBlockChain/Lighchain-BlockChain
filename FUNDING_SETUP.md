# 🇵🇭 Sideline Pinas powered by Veri Token - Funding Setup Guide

## 🎯 Overview

This guide will help you set up the complete incremental funding system for your decentralized marketplace project.

## 📋 Prerequisites

- [x] Stripe account (sign up at [stripe.com](https://stripe.com))
- [x] Vercel account (for deployment)
- [x] Basic understanding of environment variables

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Stripe Keys

1. **Login to Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Get Secret Key**:
   - Go to "Developers" → "API keys"
   - Copy your "Secret key" (starts with `sk_test_` or `sk_live_`)
3. **Get Publishable Key**:
   - Copy your "Publishable key" (starts with `pk_test_` or `pk_live_`)

### Step 2: Configure Environment Variables

```bash
# Add to Vercel (required for live payments)
vercel env add STRIPE_SECRET_KEY
# Paste your secret key when prompted

vercel env add STRIPE_WEBHOOK_SECRET
# We'll get this in Step 3
```

### Step 3: Setup Stripe Webhook

1. **Go to Webhooks**: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://sideline-pinas.vercel.app/funding/webhook`
4. **Select events**: `payment_intent.succeeded`
5. **Copy the webhook secret** (starts with `whsec_`)
6. **Add webhook secret to Vercel**:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   # Paste the webhook secret
   ```

### Step 4: Update Publishable Key

Edit `public/funding.html` line 290:
```javascript
const stripe = Stripe('pk_test_your_actual_publishable_key_here');
```

### Step 5: Deploy

```bash
vercel --prod
```

## 🎉 You're Done!

Your funding system is now live at:
- **Support Page**: https://sideline-pinas.vercel.app/support
- **API Status**: https://sideline-pinas.vercel.app/funding/status

## 💰 Funding Milestones

| Milestone | Amount | Purpose |
|-----------|--------|---------|
| Phase 1 | $50 | Domain registration (`sidelinepinas.com`) |
| Phase 2 | $200 | Feature enhancements, mobile optimization |
| Phase 3 | $500 | Marketing, growth, Philippine market expansion |
| **Total** | **$750** | Complete marketplace platform |

## 🌐 Domain Purchase (Automatic when $50 reached)

Once you reach $50 in funding, you can purchase the domain:

```bash
# Check if domain is still available
vercel domains buy sidelinepinas.com --check

# Purchase the domain
vercel domains buy sidelinepinas.com

# Add to your project
vercel domains add sidelinepinas.com

# Deploy with custom domain
vercel --prod --alias sidelinepinas.com
```

## 📊 Monitoring & Analytics

### Check Funding Status
```bash
curl https://sideline-pinas.vercel.app/funding/status
```

### View All Supporters
```bash
curl https://sideline-pinas.vercel.app/funding/supporters
```

### Admin Dashboard (JSON)
```bash
curl https://sideline-pinas.vercel.app/funding/admin/stats
```

## 🔧 Advanced Configuration

### Custom Funding Goals

Edit `api/index.js` to modify funding goals:
```javascript
let fundingData = {
  totalRaised: 0,
  goal: 1000, // Change total goal
  milestones: [
    { name: 'Domain Registration', amount: 100, achieved: false }, // Modify amounts
    { name: 'Feature Enhancement', amount: 300, achieved: false },
    { name: 'Growth & Marketing', amount: 600, achieved: false }
  ]
};
```

### Custom Payment Amounts

Edit `public/funding.html` to modify payment options:
```html
<div class="amount-btn" data-amount="20">$20</div>
<div class="amount-btn" data-amount="50">$50</div>
<div class="amount-btn" data-amount="100">$100</div>
<div class="amount-btn" data-amount="250">$250</div>
```

## 🛡️ Security Best Practices

1. **Never commit real Stripe keys** to version control
2. **Use test keys during development**
3. **Verify webhook signatures** (already implemented)
4. **Monitor for suspicious activity** via Stripe dashboard
5. **Set up email notifications** for new payments

## 🚨 Troubleshooting

### Payment Not Working?
1. Check if `STRIPE_SECRET_KEY` is set in Vercel
2. Verify publishable key in `funding.html`
3. Check Stripe dashboard for errors

### Webhook Not Receiving Events?
1. Verify webhook URL is correct
2. Check webhook secret in Vercel environment
3. Ensure `payment_intent.succeeded` event is selected

### Domain Purchase Issues?
1. Ensure you have sufficient funding ($50+)
2. Check if domain is still available
3. Verify Vercel billing is set up

## 📞 Support

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: Create an issue in your repository

## 🎯 Marketing Your Funding Campaign

### Share Your Support Page
- **Direct Link**: https://sideline-pinas.vercel.app/support
- **Social Media**: Use the built-in sharing features
- **Email**: Send to potential supporters
- **Philippine Tech Communities**: Share in relevant groups

### Key Selling Points
- ✅ **Decentralized Identity (DID)** for secure commerce
- ✅ **Zero-Knowledge Proofs** for privacy
- ✅ **Philippine Market Focus** with local compliance
- ✅ **Open Source Development** for transparency
- ✅ **Blockchain Technology** for future-proof solutions

---

**🇵🇭 Building the future of Philippine e-commerce with blockchain technology!**
