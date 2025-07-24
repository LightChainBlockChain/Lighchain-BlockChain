#!/usr/bin/env node

const DID = require('./core/did');
const { MerchantDID, CustomerDID, ProductDID, TransactionDID, SchemaValidator } = require('./marketplace/schemas');
const { VerifiableCredential, MarketplaceCredentials } = require('./credentials/verifiable-credential');
const fs = require('fs');
const path = require('path');

/**
 * VeriToken Marketplace CLI
 * Command-line interface for marketplace operations
 */
class VeriTokenCLI {
  constructor() {
    this.storageDir = path.join(__dirname, '..', 'storage');
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Save DID to storage
   */
  saveDID(did) {
    const filename = `${did.id.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filepath = path.join(this.storageDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(did.export(), null, 2));
    return filepath;
  }

  /**
   * Load DID from storage
   */
  loadDID(didId) {
    const filename = `${didId.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filepath = path.join(this.storageDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`DID not found: ${didId}`);
    }
    
    const didData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    return DID.import(didData);
  }

  /**
   * Generate a new DID
   */
  generateDID(type = 'basic') {
    let did;
    
    switch (type) {
      case 'merchant':
        did = new MerchantDID();
        break;
      case 'customer':
        did = new CustomerDID();
        break;
      case 'product':
        did = new ProductDID();
        break;
      case 'transaction':
        did = new TransactionDID();
        break;
      default:
        did = new DID();
    }
    
    did.generateKeyPair();
    did.createDocument();
    
    const filepath = this.saveDID(did);
    
    console.log(`✅ Generated ${type} DID: ${did.id}`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log(`🔑 Public Key: ${did.publicKey.substring(0, 50)}...`);
    
    return did;
  }

  /**
   * Issue a credential
   */
  issueCredential(issuerDID, subjectDID, credentialType, claims) {
    try {
      const issuer = this.loadDID(issuerDID);
      
      let credential;
      
      switch (credentialType) {
        case 'merchant':
          credential = MarketplaceCredentials.createMerchantCredential(issuerDID, subjectDID, claims);
          break;
        case 'customer':
          credential = MarketplaceCredentials.createCustomerCredential(issuerDID, subjectDID, claims);
          break;
        case 'product':
          credential = MarketplaceCredentials.createProductCredential(issuerDID, subjectDID, claims);
          break;
        case 'transaction':
          credential = MarketplaceCredentials.createTransactionCredential(issuerDID, subjectDID, claims);
          break;
        default:
          credential = new VerifiableCredential(issuerDID, subjectDID, credentialType);
          Object.keys(claims).forEach(key => {
            credential.addClaim(key, claims[key]);
          });
      }
      
      const signedCredential = credential.sign(issuer);
      
      // Save credential
      const credentialFilename = `credential_${signedCredential.id.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      const credentialPath = path.join(this.storageDir, credentialFilename);
      fs.writeFileSync(credentialPath, JSON.stringify(signedCredential, null, 2));
      
      console.log(`✅ Issued ${credentialType} credential: ${signedCredential.id}`);
      console.log(`📁 Saved to: ${credentialPath}`);
      console.log(`👤 Subject: ${subjectDID}`);
      
      return signedCredential;
    } catch (error) {
      console.error(`❌ Error issuing credential: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify a credential
   */
  verifyCredential(credentialPath) {
    try {
      const credential = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
      const issuer = this.loadDID(credential.issuer);
      
      const isValid = VerifiableCredential.verify(credential, issuer);
      const isExpired = VerifiableCredential.isExpired(credential);
      
      console.log(`🔍 Credential Verification Results:`);
      console.log(`📄 Credential ID: ${credential.id}`);
      console.log(`✅ Signature Valid: ${isValid}`);
      console.log(`⏰ Expired: ${isExpired}`);
      console.log(`👤 Subject: ${credential.credentialSubject.id}`);
      console.log(`🏢 Issuer: ${credential.issuer}`);
      
      return { isValid, isExpired };
    } catch (error) {
      console.error(`❌ Error verifying credential: ${error.message}`);
      throw error;
    }
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(`\n🚀 VeriToken Marketplace CLI\n`);
    console.log(`Usage: node src/cli.js <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  generate-did [type]              Generate a new DID`);
    console.log(`                                   Types: basic, merchant, customer, product, transaction`);
    console.log(`  issue-credential <issuer> <subject> <type> <claims>`);
    console.log(`                                   Issue a verifiable credential`);
    console.log(`  verify-credential <path>         Verify a credential`);
    console.log(`  help                             Show this help message\n`);
    console.log(`Examples:`);
    console.log(`  node src/cli.js generate-did merchant`);
    console.log(`  node src/cli.js issue-credential did:veritoken-merchant:mainnet:123 did:veritoken-customer:mainnet:456 merchant '{"name":"ACME Corp","type":"LLC","registrationNumber":"12345"}'`);
    console.log(`  node src/cli.js verify-credential storage/credential_abc123.json`);
    console.log(``);
  }
}

// CLI execution
if (require.main === module) {
  const cli = new VeriTokenCLI();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    cli.showHelp();
    process.exit(0);
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case 'generate-did':
        const type = args[1] || 'basic';
        cli.generateDID(type);
        break;
        
      case 'issue-credential':
        if (args.length < 5) {
          console.error('❌ Usage: issue-credential <issuer> <subject> <type> <claims>');
          process.exit(1);
        }
        const [, issuer, subject, credType, claimsJson] = args;
        const claims = JSON.parse(claimsJson);
        cli.issueCredential(issuer, subject, credType, claims);
        break;
        
      case 'verify-credential':
        if (args.length < 2) {
          console.error('❌ Usage: verify-credential <path>');
          process.exit(1);
        }
        cli.verifyCredential(args[1]);
        break;
        
      case 'help':
        cli.showHelp();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        cli.showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = VeriTokenCLI;
