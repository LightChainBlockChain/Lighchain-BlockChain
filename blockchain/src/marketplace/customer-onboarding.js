const MarketplaceWallet = require('../wallet/marketplace-wallet');
const { CustomerDID } = require('./schemas');
const { MarketplaceCredentials } = require('../credentials/verifiable-credential');

/**
 * Customer Onboarding System
 * Handles customer registration, KYC processes, and initial credential issuance
 */
class CustomerOnboarding {
  constructor(marketplaceAuthority) {
    this.authorityDID = marketplaceAuthority;
    this.kycProviders = new Map();
    this.onboardingSteps = [
      'identity_creation',
      'basic_verification',
      'kyc_level_1',
      'kyc_level_2',
      'kyc_level_3',
      'credential_issuance'
    ];
  }

  /**
   * Register a KYC provider
   */
  registerKYCProvider(providerId, providerDID, capabilities) {
    this.kycProviders.set(providerId, {
      did: providerDID,
      capabilities: capabilities,
      active: true
    });
  }

  /**
   * Start customer onboarding process
   */
  async startOnboarding(customerData) {
    const onboardingSession = {
      sessionId: `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerData: customerData,
      currentStep: 'identity_creation',
      completedSteps: [],
      wallet: null,
      customerDID: null,
      credentials: [],
      kycLevel: 'none',
      startedAt: new Date().toISOString(),
      status: 'in_progress'
    };

    console.log(`🚀 Starting customer onboarding session: ${onboardingSession.sessionId}`);
    return onboardingSession;
  }

  /**
   * Step 1: Create customer identity and wallet
   */
  async createIdentity(onboardingSession) {
    console.log('📝 Step 1: Creating customer identity...');
    
    // Create wallet for customer
    const wallet = new MarketplaceWallet(onboardingSession.sessionId);
    
    // Create customer DID
    const customerDID = await wallet.createIdentity('customer', {
      profile: {
        preferredName: onboardingSession.customerData.preferredName,
        email: onboardingSession.customerData.email,
        registrationDate: new Date().toISOString(),
        kycLevel: 'none',
        ageVerified: false,
        locationVerified: false,
        preferences: {
          marketing: onboardingSession.customerData.marketingOptIn || false,
          dataSharing: onboardingSession.customerData.dataSharing || 'minimal'
        }
      }
    });

    onboardingSession.wallet = wallet;
    onboardingSession.customerDID = customerDID;
    onboardingSession.completedSteps.push('identity_creation');
    onboardingSession.currentStep = 'basic_verification';

    console.log(`✅ Customer identity created: ${customerDID.id}`);
    return onboardingSession;
  }

  /**
   * Step 2: Basic verification (email, phone)
   */
  async basicVerification(onboardingSession, verificationData) {
    console.log('📧 Step 2: Performing basic verification...');
    
    const verificationResults = {
      email: await this.verifyEmail(verificationData.email, verificationData.emailToken),
      phone: await this.verifyPhone(verificationData.phone, verificationData.phoneToken)
    };

    if (verificationResults.email && verificationResults.phone) {
      // Update customer profile
      const customerDID = onboardingSession.customerDID;
      customerDID.setProfile({
        emailVerified: true,
        phoneVerified: true,
        verificationDate: new Date().toISOString()
      });

      onboardingSession.completedSteps.push('basic_verification');
      onboardingSession.currentStep = 'kyc_level_1';
      onboardingSession.kycLevel = 'basic';

      console.log('✅ Basic verification completed');
    } else {
      console.log('❌ Basic verification failed');
      throw new Error('Basic verification failed');
    }

    return onboardingSession;
  }

  /**
   * Step 3: KYC Level 1 (Identity documents)
   */
  async performKYCLevel1(onboardingSession, kycData) {
    console.log('🆔 Step 3: Performing KYC Level 1...');
    
    const kycResults = await this.processKYCDocuments(kycData, 'level_1');
    
    if (kycResults.passed) {
      // Update customer profile
      const customerDID = onboardingSession.customerDID;
      customerDID.setProfile({
        kycLevel: 'level_1',
        identityVerified: true,
        ageVerified: kycResults.ageVerified,
        locationVerified: kycResults.locationVerified,
        kycCompletedAt: new Date().toISOString()
      });

      // Issue KYC Level 1 credential
      const kycCredential = await this.issueKYCCredential(
        onboardingSession,
        'level_1',
        kycResults
      );

      onboardingSession.credentials.push(kycCredential);
      onboardingSession.completedSteps.push('kyc_level_1');
      onboardingSession.currentStep = 'credential_issuance';
      onboardingSession.kycLevel = 'level_1';

      console.log('✅ KYC Level 1 completed');
    } else {
      console.log('❌ KYC Level 1 failed');
      throw new Error('KYC Level 1 verification failed');
    }

    return onboardingSession;
  }

  /**
   * Step 4: Issue customer verification credential
   */
  async issueCustomerCredential(onboardingSession) {
    console.log('🏆 Step 4: Issuing customer verification credential...');
    
    const customerInfo = {
      customerId: onboardingSession.customerDID.id,
      kycLevel: onboardingSession.kycLevel,
      ageVerified: onboardingSession.customerDID.profile.ageVerified,
      locationVerified: onboardingSession.customerDID.profile.locationVerified,
      identityVerified: onboardingSession.customerDID.profile.identityVerified,
      verificationDate: new Date().toISOString(),
      issuedBy: this.authorityDID,
      marketplaceAccess: true
    };

    const credential = MarketplaceCredentials.createCustomerCredential(
      this.authorityDID,
      onboardingSession.customerDID.id,
      customerInfo
    );

    // In a real implementation, this would be signed by the marketplace authority
    // For now, we'll simulate this
    const signedCredential = {
      ...credential.create(),
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${this.authorityDID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: 'simulated_marketplace_authority_signature'
      }
    };

    // Store credential in wallet
    await onboardingSession.wallet.storeCredential(signedCredential);
    
    onboardingSession.credentials.push(signedCredential);
    onboardingSession.completedSteps.push('credential_issuance');
    onboardingSession.currentStep = 'completed';
    onboardingSession.status = 'completed';
    onboardingSession.completedAt = new Date().toISOString();

    console.log(`✅ Customer verification credential issued: ${signedCredential.id}`);
    return onboardingSession;
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(onboardingSession) {
    console.log('🎉 Completing customer onboarding...');
    
    const completionSummary = {
      sessionId: onboardingSession.sessionId,
      customerDID: onboardingSession.customerDID.id,
      walletId: onboardingSession.wallet.walletId,
      kycLevel: onboardingSession.kycLevel,
      credentialsIssued: onboardingSession.credentials.length,
      completedSteps: onboardingSession.completedSteps,
      duration: Date.now() - new Date(onboardingSession.startedAt).getTime(),
      status: 'completed',
      marketplaceAccess: true
    };

    console.log('📊 Onboarding Summary:', completionSummary);
    return completionSummary;
  }

  /**
   * Verify email address
   */
  async verifyEmail(email, token) {
    // Simulate email verification
    console.log(`📧 Verifying email: ${email}`);
    
    // In production, this would verify against a real email service
    const isValid = email.includes('@') && token.length >= 6;
    
    if (isValid) {
      console.log('✅ Email verified successfully');
    } else {
      console.log('❌ Email verification failed');
    }
    
    return isValid;
  }

  /**
   * Verify phone number
   */
  async verifyPhone(phone, token) {
    // Simulate phone verification
    console.log(`📱 Verifying phone: ${phone}`);
    
    // In production, this would verify against a real SMS service
    const isValid = phone.length >= 10 && token.length >= 4;
    
    if (isValid) {
      console.log('✅ Phone verified successfully');
    } else {
      console.log('❌ Phone verification failed');
    }
    
    return isValid;
  }

  /**
   * Process KYC documents
   */
  async processKYCDocuments(kycData, level) {
    console.log(`🔍 Processing KYC documents for ${level}...`);
    
    // Simulate document processing
    const results = {
      passed: true,
      ageVerified: kycData.documents.includes('government_id'),
      locationVerified: kycData.documents.includes('address_proof'),
      identityConfirmed: kycData.documents.includes('government_id'),
      riskScore: Math.floor(Math.random() * 30), // Low risk score
      processingTime: Date.now(),
      verificationProvider: 'marketplace_kyc_service'
    };

    console.log('📋 KYC Results:', results);
    return results;
  }

  /**
   * Issue KYC credential
   */
  async issueKYCCredential(onboardingSession, level, kycResults) {
    console.log(`🏅 Issuing KYC ${level} credential...`);
    
    const kycCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://veritoken.org/marketplace/kyc/v1'
      ],
      id: `urn:uuid:kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ['VerifiableCredential', 'KYCCredential'],
      issuer: this.authorityDID,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: onboardingSession.customerDID.id,
        kycLevel: level,
        verificationResults: kycResults,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${this.authorityDID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: 'simulated_kyc_provider_signature'
      }
    };

    return kycCredential;
  }

  /**
   * Full onboarding workflow
   */
  async performFullOnboarding(customerData, verificationData, kycData) {
    try {
      console.log('🚀 Starting full customer onboarding workflow...\n');
      
      // Step 1: Start onboarding
      let session = await this.startOnboarding(customerData);
      
      // Step 2: Create identity
      session = await this.createIdentity(session);
      
      // Step 3: Basic verification
      session = await this.basicVerification(session, verificationData);
      
      // Step 4: KYC Level 1
      session = await this.performKYCLevel1(session, kycData);
      
      // Step 5: Issue customer credential
      session = await this.issueCustomerCredential(session);
      
      // Step 6: Complete onboarding
      const summary = await this.completeOnboarding(session);
      
      return {
        success: true,
        summary: summary,
        wallet: session.wallet,
        customerDID: session.customerDID
      };
      
    } catch (error) {
      console.error('❌ Onboarding failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CustomerOnboarding;
