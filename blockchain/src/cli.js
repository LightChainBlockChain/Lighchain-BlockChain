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
      
      // Save credential\n      const credentialFilename = `credential_${signedCredential.id.replace(/[^a-zA-Z0-9]/g, '_')}.json`;\n      const credentialPath = path.join(this.storageDir, credentialFilename);\n      fs.writeFileSync(credentialPath, JSON.stringify(signedCredential, null, 2));\n      \n      console.log(`✅ Issued ${credentialType} credential: ${signedCredential.id}`);\n      console.log(`📁 Saved to: ${credentialPath}`);\n      console.log(`👤 Subject: ${subjectDID}`);\n      \n      return signedCredential;\n    } catch (error) {\n      console.error(`❌ Error issuing credential: ${error.message}`);\n      throw error;\n    }\n  }\n\n  /**\n   * Verify a credential\n   */\n  verifyCredential(credentialPath) {\n    try {\n      const credential = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));\n      const issuer = this.loadDID(credential.issuer);\n      \n      const isValid = VerifiableCredential.verify(credential, issuer);\n      const isExpired = VerifiableCredential.isExpired(credential);\n      \n      console.log(`🔍 Credential Verification Results:`);\n      console.log(`📄 Credential ID: ${credential.id}`);\n      console.log(`✅ Signature Valid: ${isValid}`);\n      console.log(`⏰ Expired: ${isExpired}`);\n      console.log(`👤 Subject: ${credential.credentialSubject.id}`);\n      console.log(`🏢 Issuer: ${credential.issuer}`);\n      \n      return { isValid, isExpired };\n    } catch (error) {\n      console.error(`❌ Error verifying credential: ${error.message}`);\n      throw error;\n    }\n  }\n\n  /**\n   * List all stored DIDs\n   */\n  listDIDs() {\n    const files = fs.readdirSync(this.storageDir)\n      .filter(file => file.endsWith('.json') && !file.startsWith('credential_'));\n    \n    console.log(`📋 Stored DIDs (${files.length}):`);\n    \n    files.forEach(file => {\n      try {\n        const didData = JSON.parse(fs.readFileSync(path.join(this.storageDir, file), 'utf8'));\n        console.log(`  🆔 ${didData.id}`);\n        console.log(`     📅 Created: ${didData.created}`);\n        console.log(`     🔧 Method: ${didData.method}`);\n        console.log(``);\n      } catch (error) {\n        console.log(`  ❌ Error reading ${file}: ${error.message}`);\n      }\n    });\n  }\n\n  /**\n   * List all stored credentials\n   */\n  listCredentials() {\n    const files = fs.readdirSync(this.storageDir)\n      .filter(file => file.startsWith('credential_') && file.endsWith('.json'));\n    \n    console.log(`📋 Stored Credentials (${files.length}):`);\n    \n    files.forEach(file => {\n      try {\n        const credential = JSON.parse(fs.readFileSync(path.join(this.storageDir, file), 'utf8'));\n        console.log(`  🆔 ${credential.id}`);\n        console.log(`     📅 Issued: ${credential.issuanceDate}`);\n        console.log(`     🏷️  Type: ${credential.type.join(', ')}`);\n        console.log(`     👤 Subject: ${credential.credentialSubject.id}`);\n        console.log(``);\n      } catch (error) {\n        console.log(`  ❌ Error reading ${file}: ${error.message}`);\n      }\n    });\n  }\n\n  /**\n   * Show help\n   */\n  showHelp() {\n    console.log(`\n🚀 VeriToken Marketplace CLI\n`);\n    console.log(`Usage: node src/cli.js <command> [options]\n`);\n    console.log(`Commands:`);\n    console.log(`  generate-did [type]              Generate a new DID`);\n    console.log(`                                   Types: basic, merchant, customer, product, transaction`);\n    console.log(`  issue-credential <issuer> <subject> <type> <claims>`);\n    console.log(`                                   Issue a verifiable credential`);\n    console.log(`  verify-credential <path>         Verify a credential`);\n    console.log(`  list-dids                        List all stored DIDs`);\n    console.log(`  list-credentials                 List all stored credentials`);\n    console.log(`  help                             Show this help message\n`);\n    console.log(`Examples:`);\n    console.log(`  node src/cli.js generate-did merchant`);\n    console.log(`  node src/cli.js issue-credential did:veritoken-merchant:mainnet:123 did:veritoken-customer:mainnet:456 merchant '{\"name\":\"ACME Corp\",\"type\":\"LLC\",\"registrationNumber\":\"12345\"}'`);\n    console.log(`  node src/cli.js verify-credential storage/credential_abc123.json`);\n    console.log(``);\n  }\n}\n\n// CLI execution\nif (require.main === module) {\n  const cli = new VeriTokenCLI();\n  const args = process.argv.slice(2);\n  \n  if (args.length === 0) {\n    cli.showHelp();\n    process.exit(0);\n  }\n  \n  const command = args[0];\n  \n  try {\n    switch (command) {\n      case 'generate-did':\n        const type = args[1] || 'basic';\n        cli.generateDID(type);\n        break;\n        \n      case 'issue-credential':\n        if (args.length < 5) {\n          console.error('❌ Usage: issue-credential <issuer> <subject> <type> <claims>');\n          process.exit(1);\n        }\n        const [, issuer, subject, credType, claimsJson] = args;\n        const claims = JSON.parse(claimsJson);\n        cli.issueCredential(issuer, subject, credType, claims);\n        break;\n        \n      case 'verify-credential':\n        if (args.length < 2) {\n          console.error('❌ Usage: verify-credential <path>');\n          process.exit(1);\n        }\n        cli.verifyCredential(args[1]);\n        break;\n        \n      case 'list-dids':\n        cli.listDIDs();\n        break;\n        \n      case 'list-credentials':\n        cli.listCredentials();\n        break;\n        \n      case 'help':\n        cli.showHelp();\n        break;\n        \n      default:\n        console.error(`❌ Unknown command: ${command}`);\n        cli.showHelp();\n        process.exit(1);\n    }\n  } catch (error) {\n    console.error(`❌ Error: ${error.message}`);\n    process.exit(1);\n  }\n}\n\nmodule.exports = VeriTokenCLI;"}})
