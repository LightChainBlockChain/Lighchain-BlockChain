const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Verifiable Credential Implementation
 * Based on W3C Verifiable Credentials specification
 * Enhanced for marketplace use cases
 */
class VerifiableCredential {
  constructor(issuer, subject, credentialType) {
    this.id = `urn:uuid:${uuidv4()}`;
    this.issuer = issuer; // DID of the issuer
    this.subject = subject; // DID of the subject
    this.type = ['VerifiableCredential', credentialType];
    this.issuanceDate = new Date().toISOString();
    this.expirationDate = null;
    this.credentialSubject = {};
    this.proof = null;
    this.credentialStatus = {
      id: `${this.id}#status`,
      type: 'RevocationList2020Status',
      revocationListIndex: Math.floor(Math.random() * 1000000),
      revocationListCredential: `${issuer}/revocation-list`
    };
  }

  /**
   * Add claims to the credential
   */
  addClaim(property, value) {
    this.credentialSubject[property] = value;
    return this;
  }

  /**
   * Set expiration date
   */
  setExpirationDate(date) {
    this.expirationDate = date instanceof Date ? date.toISOString() : date;
    return this;
  }

  /**
   * Create the credential object
   */
  create() {
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://veritoken.org/marketplace/v1'
      ],
      id: this.id,
      type: this.type,
      issuer: this.issuer,
      issuanceDate: this.issuanceDate,
      credentialSubject: {
        id: this.subject,
        ...this.credentialSubject
      },
      credentialStatus: this.credentialStatus
    };

    if (this.expirationDate) {
      credential.expirationDate = this.expirationDate;
    }

    return credential;
  }

  /**
   * Sign the credential with issuer's private key
   */
  sign(issuerDID) {
    const credential = this.create();
    
    // Create proof
    const proof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${this.issuer}#key-1`,
      proofPurpose: 'assertionMethod'
    };

    // Sign the credential
    const signature = issuerDID.sign(credential);
    proof.proofValue = signature;

    this.proof = proof;
    
    return {
      ...credential,
      proof: this.proof
    };
  }

  /**
   * Verify the credential signature
   */
  static verify(credential, issuerDID) {
    try {
      const { proof, ...credentialWithoutProof } = credential;
      
      if (!proof || !proof.proofValue) {
        throw new Error('No proof found in credential');
      }

      return issuerDID.verify(credentialWithoutProof, proof.proofValue);
    } catch (error) {
      console.error('Credential verification failed:', error);
      return false;
    }
  }

  /**
   * Check if credential is expired
   */
  static isExpired(credential) {
    if (!credential.expirationDate) return false;
    return new Date() > new Date(credential.expirationDate);
  }

  /**
   * Create selective disclosure proof
   * Only reveals specified attributes
   */
  createSelectiveDisclosure(attributesToReveal) {
    const credential = this.create();
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
}

/**
 * Marketplace-specific credential types
 */
class MarketplaceCredentials {
  
  /**
   * Create merchant verification credential
   */
  static createMerchantCredential(issuer, merchantDID, businessInfo) {
    const credential = new VerifiableCredential(issuer, merchantDID, 'MerchantVerification');
    
    credential.addClaim('businessName', businessInfo.name);
    credential.addClaim('businessType', businessInfo.type);
    credential.addClaim('registrationNumber', businessInfo.registrationNumber);
    credential.addClaim('taxId', businessInfo.taxId);
    credential.addClaim('address', businessInfo.address);
    credential.addClaim('verificationLevel', businessInfo.verificationLevel || 'basic');
    credential.addClaim('verificationDate', new Date().toISOString());
    
    return credential;
  }

  /**
   * Create product authenticity credential
   */
  static createProductCredential(issuer, productDID, productInfo) {
    const credential = new VerifiableCredential(issuer, productDID, 'ProductAuthenticity');
    
    credential.addClaim('productName', productInfo.name);
    credential.addClaim('manufacturer', productInfo.manufacturer);
    credential.addClaim('model', productInfo.model);
    credential.addClaim('serialNumber', productInfo.serialNumber);
    credential.addClaim('productionDate', productInfo.productionDate);
    credential.addClaim('certifications', productInfo.certifications);
    credential.addClaim('supplyChainHash', productInfo.supplyChainHash);
    
    return credential;
  }

  /**
   * Create customer verification credential
   */
  static createCustomerCredential(issuer, customerDID, customerInfo) {
    const credential = new VerifiableCredential(issuer, customerDID, 'CustomerVerification');
    
    credential.addClaim('ageVerified', customerInfo.ageVerified);
    credential.addClaim('locationVerified', customerInfo.locationVerified);
    credential.addClaim('identityVerified', customerInfo.identityVerified);
    credential.addClaim('kycLevel', customerInfo.kycLevel);
    credential.addClaim('verificationDate', new Date().toISOString());
    
    return credential;
  }

  /**
   * Create transaction attestation credential
   */
  static createTransactionCredential(issuer, transactionDID, transactionInfo) {
    const credential = new VerifiableCredential(issuer, transactionDID, 'TransactionAttestation');
    
    credential.addClaim('transactionId', transactionInfo.id);
    credential.addClaim('buyer', transactionInfo.buyer);
    credential.addClaim('seller', transactionInfo.seller);
    credential.addClaim('productId', transactionInfo.productId);
    credential.addClaim('amount', transactionInfo.amount);
    credential.addClaim('currency', transactionInfo.currency);
    credential.addClaim('timestamp', transactionInfo.timestamp);
    credential.addClaim('status', transactionInfo.status);
    
    return credential;
  }
}

module.exports = { VerifiableCredential, MarketplaceCredentials };
