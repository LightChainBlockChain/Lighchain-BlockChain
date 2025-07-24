mod blockchain;
mod transaction;
mod dedication;
mod block;
mod governance;
mod environment;
mod integration_service;
mod wallet_integration;
mod privacy_manager;
mod ai_module;

use blockchain::Blockchain;
use transaction::{Transaction, TransactionType};
use governance::GovernanceProposal;
use environment::EnvironmentalData;
use integration_service::{
    LightChainIntegrationService, 
    SidelineTransaction, 
    ProductSustainabilityData, 
    MerchantEnvironmentalProfile
};
use std::io::{self, Write};

fn main() {
    // Display the dedication before starting
    dedication::display_dedication();
    println!("⚡ LightChain x Sideline_Pinas Integration Demo");
    println!("=============================================\n");
    
    // Initialize the integration service
    let mut integration_service = LightChainIntegrationService::new();
    
    println!("🔧 Setting up integration environment...");
    
    // Register sample products with sustainability data
    let product1 = ProductSustainabilityData {
        product_id: "did:veritoken-product:mainnet:eco-shirt-001".to_string(),
        carbon_footprint: 2.5, // kg CO2
        sustainability_score: 8.5,
        eco_certification: vec!["Organic Cotton".to_string(), "Fair Trade".to_string()],
        supply_chain_transparency: 9.0,
    };
    
    let product2 = ProductSustainabilityData {
        product_id: "did:veritoken-product:mainnet:solar-panel-001".to_string(),
        carbon_footprint: 1.2, // kg CO2
        sustainability_score: 9.8,
        eco_certification: vec!["Solar Energy".to_string(), "Renewable".to_string()],
        supply_chain_transparency: 8.5,
    };
    
    integration_service.register_product_sustainability(
        "did:veritoken-product:mainnet:eco-shirt-001".to_string(),
        product1,
    );
    
    integration_service.register_product_sustainability(
        "did:veritoken-product:mainnet:solar-panel-001".to_string(),
        product2,
    );
    
    // Register merchants with environmental profiles
    let green_merchant = MerchantEnvironmentalProfile {
        merchant_did: "did:veritoken-merchant:mainnet:green-shop-ph".to_string(),
        green_practices: vec![
            "Renewable Energy".to_string(),
            "Zero Waste Packaging".to_string(),
            "Carbon Neutral Shipping".to_string(),
        ],
        carbon_neutral_shipping: true,
        renewable_energy_usage: 0.8, // 80% renewable energy
        waste_reduction_score: 9.2,
        environmental_certifications: vec!["Green Business".to_string(), "ISO 14001".to_string()],
    };
    
    let regular_merchant = MerchantEnvironmentalProfile {
        merchant_did: "did:veritoken-merchant:mainnet:regular-shop-ph".to_string(),
        green_practices: vec!["Recyclable Packaging".to_string()],
        carbon_neutral_shipping: false,
        renewable_energy_usage: 0.3, // 30% renewable energy
        waste_reduction_score: 5.5,
        environmental_certifications: vec![],
    };
    
    integration_service.register_merchant_profile(
        "did:veritoken-merchant:mainnet:green-shop-ph".to_string(),
        green_merchant,
    );
    
    integration_service.register_merchant_profile(
        "did:veritoken-merchant:mainnet:regular-shop-ph".to_string(),
        regular_merchant,
    );
    
    println!("✅ Integration environment set up successfully\n");
    
    // Simulate Sideline_Pinas marketplace transactions
    println!("🛒 Simulating Sideline_Pinas marketplace transactions...");
    
    let tx1 = SidelineTransaction {
        transaction_id: "sideline_tx_001".to_string(),
        buyer_did: "did:veritoken-customer:mainnet:maria-santos".to_string(),
        seller_did: "did:veritoken-merchant:mainnet:green-shop-ph".to_string(),
        product_did: "did:veritoken-product:mainnet:eco-shirt-001".to_string(),
        amount: 25.99,
        currency: "USD".to_string(),
        status: "completed".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    let tx2 = SidelineTransaction {
        transaction_id: "sideline_tx_002".to_string(),
        buyer_did: "did:veritoken-customer:mainnet:juan-dela-cruz".to_string(),
        seller_did: "did:veritoken-merchant:mainnet:green-shop-ph".to_string(),
        product_did: "did:veritoken-product:mainnet:solar-panel-001".to_string(),
        amount: 299.99,
        currency: "USD".to_string(),
        status: "completed".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    let tx3 = SidelineTransaction {
        transaction_id: "sideline_tx_003".to_string(),
        buyer_did: "did:veritoken-customer:mainnet:anna-reyes".to_string(),
        seller_did: "did:veritoken-merchant:mainnet:regular-shop-ph".to_string(),
        product_did: "did:veritoken-product:mainnet:regular-item-001".to_string(),
        amount: 15.50,
        currency: "USD".to_string(),
        status: "completed".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    // Process transactions through the integration service
    println!("\n📋 Processing transactions through LightChain...");
    
    match integration_service.process_sideline_transaction(tx1.clone()) {
        Ok(blockchain_tx_id) => println!("✅ Transaction 1 processed: {}", blockchain_tx_id),
        Err(e) => println!("❌ Error processing transaction 1: {}", e),
    }
    
    match integration_service.process_sideline_transaction(tx2.clone()) {
        Ok(blockchain_tx_id) => println!("✅ Transaction 2 processed: {}", blockchain_tx_id),
        Err(e) => println!("❌ Error processing transaction 2: {}", e),
    }
    
    match integration_service.process_sideline_transaction(tx3.clone()) {
        Ok(blockchain_tx_id) => println!("✅ Transaction 3 processed: {}", blockchain_tx_id),
        Err(e) => println!("❌ Error processing transaction 3: {}", e),
    }
    
    // Mine the pending transactions
    println!("\n⛏️  Mining transactions into blocks...");
    dedication::display_mining_dedication();
integration_service.mine_pending_transactions();

// --- Wallet Integration ---
// Initialize wallet integration
let mut wallet_integration = wallet_integration::WalletIntegration::default();

// Process each sideline transaction for commission
for tx in [tx1, tx2, tx3].iter() {
    if let Ok(commission_tx) = wallet_integration.process_commission(tx.transaction_id.clone(), tx.amount) {
        let commission_blockchain_tx = wallet_integration.create_commission_blockchain_transaction(&commission_tx);
        println!("🌟 Commission Transaction for {} Processed: {:.2} tokens", commission_tx.original_transaction_id, commission_tx.commission_amount);
        // Add commission transaction to the blockchain
        integration_service.get_blockchain_mut().add_transaction(commission_blockchain_tx);
    }
}
// --- End Wallet Integration ---
    
    // Display blockchain statistics
    println!("\n📊 LightChain x Sideline_Pinas Integration Stats:");
    println!("=============================================");
        integration_service.ai_module.run_fraud_detection();
        let stats = integration_service.get_blockchain_stats();
    println!("📦 Total Blocks: {}", stats.total_blocks);
    println!("📋 Total Transactions: {}", stats.total_transactions);
    println!("🛒 Marketplace Transactions: {}", stats.marketplace_transactions);
    println!("🌟 Carbon Credits Issued: {:.2}", stats.carbon_credits_issued);
    println!("⭐ Average Sustainability Score: {:.1}/10", stats.average_sustainability_score);
    println!("🌱 Total Carbon Footprint: {:.2} kg CO2", stats.total_carbon_footprint);
    
    // Display blockchain validation
    let blockchain = integration_service.get_blockchain();
    println!("\n🔐 Blockchain Validation:");
    println!("✅ Chain Valid: {}", blockchain.is_chain_valid());
    println!("⚡ Mining Difficulty: {}", blockchain.get_difficulty());
    
    // Display latest block info
    if let Some(latest_block) = blockchain.get_latest_block() {
        println!("\n📦 Latest Block Info:");
        println!("🔗 Hash: {}", &latest_block.hash[..16]);
        println!("📅 Timestamp: {}", latest_block.timestamp);
        println!("📊 Transactions: {}", latest_block.transactions.len());
        println!("🔢 Nonce: {}", latest_block.nonce);
    }
    
    // Create a governance proposal related to the marketplace
    let proposal = GovernanceProposal::new(
        "prop_marketplace_001".to_string(),
        "did:veritoken-merchant:mainnet:green-shop-ph".to_string(),
        "Implement mandatory sustainability scoring for all products".to_string(),
        "To promote transparency and encourage sustainable practices in the marketplace".to_string(),
    );
    
    println!("\n🗳️  New Governance Proposal:");
    println!("ID: {}", proposal.id);
    println!("Title: {}", proposal.title);
    println!("Proposer: {}", proposal.proposer);
    println!("Status: {:?}", proposal.status);
    
    println!("\n🎉 LightChain x Sideline_Pinas Integration Demo Complete!");
    println!("⚡ Your marketplace is now powered by LightChain environmental governance!");
    println!("\n🔗 Features Demonstrated:");
    println!("   ✅ Marketplace transaction recording on blockchain");
    println!("   ✅ Automatic carbon footprint calculation");
    println!("   ✅ Sustainability scoring for merchants and products");
    println!("   ✅ Carbon credit rewards for sustainable practices");
    println!("   ✅ Environmental impact tracking");
    println!("   ✅ Governance proposal system");
    println!("   ✅ Immutable audit trail for all transactions");
    
    // Add interactive CLI functionality
    println!("\n🎯 Interactive LightChain CLI");
    println!("==============================");
    interactive_cli(&mut integration_service);
    
    // Display closing dedication
    dedication::display_shutdown_dedication();
}

fn interactive_cli(integration_service: &mut LightChainIntegrationService) {
    loop {
        println!("\n📋 Available Commands:");
        println!("1. Add Environmental Data");
        println!("2. Check Balance");
        println!("3. Create Governance Proposal");
        println!("4. View Blockchain Stats");
        println!("5. Validate Chain");
        println!("6. Create Environmental Impact Transaction");
        println!("7. Create Credential Verification");
        println!("8. View Environmental Data");
        println!("9. Exit");
        
        print!("\nEnter your choice (1-9): ");
        io::stdout().flush().unwrap();
        
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        
        match input.trim() {
            "1" => add_environmental_data(integration_service),
            "2" => check_balance(integration_service),
            "3" => create_governance_proposal(integration_service),
            "4" => view_blockchain_stats(integration_service),
            "5" => validate_chain(integration_service),
            "6" => create_environmental_impact(integration_service),
            "7" => create_credential_verification(integration_service),
            "8" => view_environmental_data(integration_service),
            "9" => {
                println!("👋 Goodbye! Thanks for using LightChain!");
                break;
            }
            _ => println!("❌ Invalid option. Please try again."),
        }
    }
}

fn add_environmental_data(integration_service: &mut LightChainIntegrationService) {
    println!("\n🌱 Add Environmental Data");
    println!("==========================");
    
    let env_data = EnvironmentalData {
        location: "Philippines".to_string(),
        co2_level: 420.0,
        temperature: 28.5,
        humidity: 82.0,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    let env_tx = Transaction::new(
        "environmental_sensor_001".to_string(),
        TransactionType::EnvironmentalData { data: env_data },
    );
    
    integration_service.get_blockchain_mut().add_transaction(env_tx);
    println!("✅ Environmental data added successfully!");
}

fn check_balance(integration_service: &LightChainIntegrationService) {
    println!("\n💰 Check Balance");
    println!("================");
    
    print!("Enter address: ");
    io::stdout().flush().unwrap();
    
    let mut address = String::new();
    io::stdin().read_line(&mut address).unwrap();
    let address = address.trim();
    
    let balance = integration_service.get_blockchain().get_balance(address);
    println!("💳 Balance for {}: {:.2} tokens", address, balance);
}

fn create_governance_proposal(integration_service: &mut LightChainIntegrationService) {
    println!("\n🗳️  Create Governance Proposal");
    println!("===============================");
    
    let proposal = GovernanceProposal::new(
        format!("prop_{}", rand::random::<u32>()),
        "did:lightchain:proposer:001".to_string(),
        "Increase carbon credit rewards for renewable energy usage".to_string(),
        "To incentivize more sustainable practices in the marketplace".to_string(),
    );
    
    println!("📝 Proposal created:");
    println!("   ID: {}", proposal.id);
    println!("   Title: {}", proposal.title);
    println!("   Status: {:?}", proposal.status);
    println!("✅ Governance proposal created successfully!");
}

fn view_blockchain_stats(integration_service: &LightChainIntegrationService) {
    println!("\n📊 Blockchain Statistics");
    println!("========================");
    
    let stats = integration_service.get_blockchain_stats();
    println!("📦 Total Blocks: {}", stats.total_blocks);
    println!("📋 Total Transactions: {}", stats.total_transactions);
    println!("🛒 Marketplace Transactions: {}", stats.marketplace_transactions);
    println!("🌟 Carbon Credits Issued: {:.2}", stats.carbon_credits_issued);
    println!("⭐ Average Sustainability Score: {:.1}/10", stats.average_sustainability_score);
    println!("🌱 Total Carbon Footprint: {:.2} kg CO2", stats.total_carbon_footprint);
}

fn validate_chain(integration_service: &LightChainIntegrationService) {
    println!("\n🔐 Chain Validation");
    println!("==================");
    
    let is_valid = integration_service.get_blockchain().is_chain_valid();
    if is_valid {
        println!("✅ Blockchain is valid!");
    } else {
        println!("❌ Blockchain validation failed!");
    }
    
    println!("⚡ Mining Difficulty: {}", integration_service.get_blockchain().get_difficulty());
}

fn create_environmental_impact(integration_service: &mut LightChainIntegrationService) {
    println!("\n🌍 Create Environmental Impact Transaction");
    println!("==========================================");
    
    let impact_tx = Transaction::new_environmental_impact(
        "did:lightchain:entity:solar_farm_001".to_string(),
        "carbon_reduction".to_string(),
        -50.5, // Negative value indicates carbon reduction
        "kg_co2".to_string(),
        Some("Renewable Energy Farm, Philippines".to_string()),
    );
    
    integration_service.get_blockchain_mut().add_transaction(impact_tx);
    println!("✅ Environmental impact transaction created successfully!");
    println!("🌱 Carbon Reduction: -50.5 kg CO2");
}

fn create_credential_verification(integration_service: &mut LightChainIntegrationService) {
    println!("\n🎓 Create Credential Verification");
    println!("==================================");
    
    let verification_tx = Transaction::new_credential_verification(
        "did:lightchain:verifier:sustainability_council".to_string(),
        format!("cred_{}", rand::random::<u32>()),
        "did:lightchain:issuer:green_certification_body".to_string(),
        "did:lightchain:merchant:eco_store_001".to_string(),
        "Sustainable_Business_Certificate".to_string(),
        true,
    );
    
    integration_service.get_blockchain_mut().add_transaction(verification_tx);
    println!("✅ Credential verification transaction created successfully!");
}

fn view_environmental_data(integration_service: &LightChainIntegrationService) {
    println!("\n🌡️  Environmental Data");
    println!("======================");
    
    let env_data = integration_service.get_blockchain().get_environmental_data();
    if env_data.is_empty() {
        println!("📭 No environmental data found.");
    } else {
        for (i, data) in env_data.iter().enumerate() {
            println!("🌍 Data Record {}:", i + 1);
            println!("   Location: {}", data.location);
            println!("   CO2 Level: {:.1} ppm", data.co2_level);
            println!("   Temperature: {:.1}°C", data.temperature);
            println!("   Humidity: {:.1}%", data.humidity);
            println!("   Timestamp: {}", data.timestamp);
            println!();
        }
    }
}
