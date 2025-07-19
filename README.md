# Sideline Pinas powered by Veri Token

A decentralized identity (DID) and self-sovereign identity (SSI) system integrated with digital marketplace functionality for the Philippines.

## Overview

VeriToken Marketplace extends the VeriToken white paper specifications to create a comprehensive identity management system specifically designed for digital marketplaces. It enables secure, privacy-preserving commerce through verifiable credentials and decentralized identifiers.

## 🚀 Phase 1: Foundation - COMPLETED ✅

### ✅ Completed Features

1. **VeriToken Development Environment Setup**
   - Node.js project structure
   - Core dependencies installed
   - Storage system implemented

2. **Marketplace-Specific DID Schemas**
   - **MerchantDID**: Business identity with verification levels and reputation
   - **CustomerDID**: Buyer identity with KYC levels and privacy controls
   - **ProductDID**: Product authenticity with supply chain tracking
   - **TransactionDID**: Transaction attestation and verification

3. **Credential Issuance System**
   - Merchant verification credentials
   - Customer verification credentials
   - Product authenticity credentials
   - Transaction attestation credentials

## 🚀 Phase 2: Core Integration - COMPLETED ✅

### ✅ Completed Features

1. **Marketplace-Specific Wallet Integration**
   - **MarketplaceWallet**: Secure identity wallet for marketplace participants
   - Multi-identity support (merchant, customer, product, transaction)
   - Connection management between entities
   - Credential storage and management
   - Selective disclosure capabilities
   - Zero-knowledge proof generation

2. **Customer Onboarding System**
   - **CustomerOnboarding**: Complete onboarding workflow
   - Step-by-step identity creation process
   - Email and phone verification
   - KYC Level 1 processing
   - Automatic credential issuance
   - Privacy-preserving verification

3. **Product Authenticity Verification**
   - **ProductAuthenticity**: Comprehensive product verification system
   - Manufacturer registration and verification
   - Product registration with authenticity hashing
   - Supply chain event tracking
   - Certification management
   - Ownership transfer with provenance
   - Confidence-based verification scoring

4. **Basic Marketplace API Endpoints**
   - **MarketplaceAPI**: RESTful API server
   - Identity management endpoints
   - Wallet management endpoints
   - Customer onboarding endpoints
   - Product authenticity endpoints
   - Credential management endpoints
   - Transaction processing endpoints
   - Statistics and reporting endpoints

## 🏗️ Architecture

```
VeriToken-Marketplace/
├── src/
│   ├── core/              # Core DID functionality
│   │   └── did.js         # Base DID implementation
│   ├── credentials/       # Verifiable Credentials
│   │   └── verifiable-credential.js
│   ├── marketplace/       # Marketplace-specific schemas
│   │   └── schemas.js     # Entity types and validation
│   ├── cli.js            # Command-line interface
│   └── index.js          # Main marketplace system
├── storage/              # Local storage for DIDs and credentials
├── tests/               # Test suites
├── docs/                # Documentation
└── examples/            # Usage examples
```

## 🔧 Installation

```bash
# Clone the repository
git clone [repository-url]
cd VeriToken-Marketplace

# Install dependencies
npm install
```

## 🎯 Usage

### Phase 1 Demo (Foundation)

Run the foundational marketplace demo:

```bash
node src/index.js
```

### Phase 2 Demo (Core Integration)

Run the comprehensive Phase 2 demo showcasing all integrated features:

```bash
node src/phase2-demo.js
```

### Phase 3 Demo (TikTok-Inspired Marketplace)

Run the TikTok-style marketplace demo with creators, content, and affiliate program:

```bash
npm run tiktok-demo
# or
node src/tiktok-demo.js
```

### TikTok Marketplace API Server

Start the TikTok marketplace API server:

```bash
npm run tiktok-api
# or
node start-tiktok-api.js
```

API available at `http://localhost:3000/api/` with endpoints:
- **Creators**: `/api/creators` - Manage content creators
- **Content**: `/api/content` - Create and discover content
- **Trending**: `/api/trending` - Get trending videos
- **Social**: `/api/follow`, `/api/like` - Social interactions
- **Affiliate**: `/api/affiliate/*` - Affiliate program management
- **Challenges**: `/api/challenges` - Viral challenges
- **Analytics**: `/api/analytics` - Comprehensive analytics
- **Search**: `/api/search` - Search content and creators

### CLI Interface

```bash
# Generate DIDs
node src/cli-fixed.js generate-did merchant
node src/cli-fixed.js generate-did customer
node src/cli-fixed.js generate-did product

# Issue credentials
node src/cli-fixed.js issue-credential <issuer-did> <subject-did> merchant '{"name":"ACME Corp","type":"LLC","registrationNumber":"12345"}'

# Verify credentials
node src/cli-fixed.js verify-credential storage/credential_xyz.json

# Show help
node src/cli-fixed.js help
```

### API Server

Start the RESTful API server:

```bash
node -e "const API = require('./src/marketplace/api-server'); new API(3000).start()"
```

API endpoints available at `http://localhost:3000/api/`

## 🏪 Marketplace Integration Points

### 1. **Merchant Identity Verification**
- Business license verification
- Tax ID validation
- Reputation scoring
- Selective disclosure of business information

### 2. **Customer Identity Management**
- Age verification without revealing exact age
- Location verification for compliance
- KYC level management
- Privacy-preserving purchase history

### 3. **Product Authenticity**
- Manufacturer attestations
- Supply chain verification
- Anti-counterfeiting measures
- Ownership tracking

### 4. **Transaction Attestation**
- Cryptographically signed transaction records
- Dispute resolution evidence
- Reputation building
- Compliance auditing

## 🔐 Security Features

- **Ed25519 Cryptography**: Industry-standard elliptic curve signatures
- **Local Key Storage**: Private keys never leave the user's device
- **Selective Disclosure**: Share only necessary information
- **Zero-Knowledge Proofs**: Prove attributes without revealing data
- **Decentralized Architecture**: No single point of failure

## 📊 Sample Output

```
🚀 VeriToken Marketplace Demo

1. Creating merchant...
✅ Merchant created: did:veritoken-merchant:mainnet:f076719f-40d9-4ce8-9309-44df1f61ed61

2. Creating customer...
✅ Customer created: did:veritoken-customer:mainnet:04667199-9070-4dfa-9029-8d0a5296d662

3. Creating product...
✅ Product created: did:veritoken-product:mainnet:17c0a847-f232-4cc9-9397-bcc1ae68ee0e

4. Issuing merchant verification credential...
✅ Merchant credential issued: urn:uuid:6064686e-d596-4f65-a180-444fbd1887ae

5. Creating transaction...
✅ Transaction created: did:veritoken-transaction:mainnet:66cb13dc-198c-4363-b13a-bc34cbfcd27f

6. Completing transaction...
✅ Transaction completed with attestation: urn:uuid:ed879b99-3142-47af-a45b-f71da5c8eb95

7. Marketplace Statistics:
📊 Total Entities: 4
📊 Total Credentials: 2
📊 Total Transactions: 1
📊 Entity Breakdown: { merchant: 1, customer: 1, product: 1, transaction: 1 }

🎉 Demo completed successfully!
```

## 🛣️ Development Roadmap

### Phase 2: Core Integration - COMPLETED ✅
- [x] Marketplace-specific wallet integration
- [x] Customer onboarding with DIDs
- [x] Product authenticity verification system
- [x] Basic marketplace API endpoints

### Phase 3: TikTok-Inspired Marketplace - COMPLETED ✅
- [x] Content creator profiles and management
- [x] Short-form video content system
- [x] Multi-tier affiliate program with tracking
- [x] Social features (follow, like, share)
- [x] Viral challenge system
- [x] Real-time trending algorithm
- [x] Commission-based affiliate tracking
- [x] Token-based creator rewards
- [x] Comprehensive analytics dashboard
- [x] RESTful API for all features

### Phase 4: Advanced Features (Next)
- [ ] Advanced zero-knowledge proof integration
- [ ] Decentralized reputation system with cross-reference
- [ ] Cross-marketplace interoperability protocols
- [ ] Advanced privacy controls and consent management
- [ ] Smart contract integration
- [ ] Mobile wallet application
- [ ] Decentralized dispute resolution
- [ ] AI-powered content recommendations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Based on the VeriToken white paper specifications
- Implements W3C DID and Verifiable Credentials standards
- Inspired by the need for privacy-preserving digital commerce

---

**Status**: Phase 2 Complete ✅  
**Next**: Phase 3 Advanced Features  
**Version**: 2.0.0
