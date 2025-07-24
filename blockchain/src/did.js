const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * DID (Decentralized Identifier) Core Implementation
 * Based on VeriToken white paper specifications
 */
class DID {
  constructor(method = 'veritoken', network = 'mainnet') {
    this.method = method;
    this.network = network;
    this.id = this.generateId();
    this.publicKey = null;
    this.privateKey = null;
    this.document = null;
    this.created = new Date().toISOString();
    this.updated = this.created;
  }

  /**
   * Generate a unique DID identifier
   * Format: did:veritoken:mainnet:uuid
   */
  generateId() {
    const uniqueId = uuidv4();
    return `did:${this.method}:${this.network}:${uniqueId}`;
  }

  /**
   * Generate cryptographic key pair for the DID
   */
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.updated = new Date().toISOString();
    
    return { publicKey, privateKey };
  }

  /**
   * Create DID Document according to W3C DID specification
   */
  createDocument() {
    if (!this.publicKey) {
      this.generateKeyPair();
    }

    this.document = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1"
      ],
      "id": this.id,
      "controller": this.id,
      "created": this.created,
      "updated": this.updated,
      "verificationMethod": [{
        "id": `${this.id}#key-1`,
        "type": "Ed25519VerificationKey2020",
        "controller": this.id,
        "publicKeyPem": this.publicKey
      }],
      "authentication": [`${this.id}#key-1`],
      "assertionMethod": [`${this.id}#key-1`],
      "keyAgreement": [`${this.id}#key-1`],
      "capabilityInvocation": [`${this.id}#key-1`],
      "capabilityDelegation": [`${this.id}#key-1`]
    };

    return this.document;
  }

  /**
   * Sign data with the DID's private key
   */
  sign(data) {
    if (!this.privateKey) {
      throw new Error('Private key not available for signing');
    }

    const dataString = JSON.stringify(data);
    const signature = crypto.sign(null, Buffer.from(dataString), this.privateKey);
    return signature.toString('hex');
  }

  /**
   * Verify signature using the DID's public key
   */
  verify(data, signature) {
    if (!this.publicKey) {
      throw new Error('Public key not available for verification');
    }

    const dataString = JSON.stringify(data);
    const signatureBuffer = Buffer.from(signature, 'hex');
    return crypto.verify(null, Buffer.from(dataString), this.publicKey, signatureBuffer);
  }

  /**
   * Export DID for storage (without private key)
   */
  export() {
    return {
      id: this.id,
      method: this.method,
      network: this.network,
      publicKey: this.publicKey,
      document: this.document,
      created: this.created,
      updated: this.updated
    };
  }

  /**
   * Import DID from storage
   */
  static import(didData) {
    const did = new DID(didData.method, didData.network);
    did.id = didData.id;
    did.publicKey = didData.publicKey;
    did.document = didData.document;
    did.created = didData.created;
    did.updated = didData.updated;
    return did;
  }
}

module.exports = DID;
