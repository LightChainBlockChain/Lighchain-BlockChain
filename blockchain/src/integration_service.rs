use crate::ai_module::AiModule;

use crate::privacy_manager::{PrivacyManager, SectorType};

use crate::blockchain::Blockchain;
use crate::transaction::{Transaction, TransactionType};
use crate::environment::EnvironmentalData;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidelineTransaction {
    pub transaction_id: String,
    pub buyer_did: String,
    pub seller_did: String,
    pub product_did: String,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductSustainabilityData {
    pub product_id: String,
    pub carbon_footprint: f64,
    pub sustainability_score: f64,
    pub eco_certification: Vec<String>,
    pub supply_chain_transparency: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerchantEnvironmentalProfile {
    pub merchant_did: String,
    pub green_practices: Vec<String>,
    pub carbon_neutral_shipping: bool,
    pub renewable_energy_usage: f64,
    pub waste_reduction_score: f64,
    pub environmental_certifications: Vec<String>,
}

pub struct LightChainIntegrationService {
    blockchain: Blockchain,
    product_sustainability_db: HashMap<String, ProductSustainabilityData>,
    merchant_profiles: HashMap<String, MerchantEnvironmentalProfile>,
    carbon_credit_rates: HashMap<String, f64>, // currency -> carbon credit rate
    privacy_manager: PrivacyManager,
    pub ai_module: AiModule,
}

impl LightChainIntegrationService {
    pub fn new() -> Self {
let mut service = LightChainIntegrationService {
            blockchain: Blockchain::new(),
            product_sustainability_db: HashMap::new(),
            merchant_profiles: HashMap::new(),
            carbon_credit_rates: HashMap::new(),
            privacy_manager: PrivacyManager::default(),
            ai_module: AiModule::default(),
        };
        
        // Initialize default carbon credit rates
        service.carbon_credit_rates.insert("USD".to_string(), 0.15); // $0.15 per kg CO2
        service.carbon_credit_rates.insert("PHP".to_string(), 8.50); // ₱8.50 per kg CO2
        service.carbon_credit_rates.insert("EUR".to_string(), 0.13); // €0.13 per kg CO2
        
        service.ai_module.enable_threat_detection();
        service.ai_module.generate_insights();

        service
    }
    
    pub fn register_product_sustainability(&mut self, product_id: String, data: ProductSustainabilityData) {
        self.product_sustainability_db.insert(product_id, data);
    }
    
    pub fn register_merchant_profile(&mut self, merchant_did: String, profile: MerchantEnvironmentalProfile) {
        self.merchant_profiles.insert(merchant_did, profile);
    }
    
    pub fn process_sideline_transaction(&mut self, sideline_tx: SidelineTransaction) -> Result<String, String> {
        println!("🔄 Processing Sideline_Pinas transaction: {}", sideline_tx.transaction_id);
        
        // Create blockchain transaction
        let mut blockchain_tx = Transaction::new_marketplace_transaction(
            sideline_tx.buyer_did.clone(),
            sideline_tx.seller_did.clone(),
            sideline_tx.product_did.clone(),
            sideline_tx.transaction_id.clone(),
            sideline_tx.amount,
            sideline_tx.currency.clone(),
            sideline_tx.status.clone(),
        );
        
        // Calculate environmental impact
        let (carbon_footprint, sustainability_score) = self.calculate_environmental_impact(&sideline_tx);
        blockchain_tx.update_environmental_impact(carbon_footprint, sustainability_score);
        
        // Add to blockchain
        self.blockchain.add_transaction(blockchain_tx.clone());
        
        // Process carbon credits if applicable
        if sustainability_score > 7.0 {
            self.award_carbon_credits(&sideline_tx.seller_did, carbon_footprint, &sideline_tx.currency);
        }
        
        // Record environmental impact
        self.record_environmental_impact(&sideline_tx);
        
        println!("✅ Transaction processed successfully");
        println!("   🌱 Carbon Footprint: {:.2} kg CO2", carbon_footprint);
        println!("   ⭐ Sustainability Score: {:.1}/10", sustainability_score);
        
        Ok(blockchain_tx.id)
    }
    
    fn calculate_environmental_impact(&self, tx: &SidelineTransaction) -> (f64, f64) {
        let mut carbon_footprint = 0.0;
        let mut sustainability_score = 5.0; // Default score
        
        // Get product sustainability data
        if let Some(product_data) = self.product_sustainability_db.get(&tx.product_did) {
            carbon_footprint += product_data.carbon_footprint;
            sustainability_score = product_data.sustainability_score;
        } else {
            // Default estimates based on transaction amount
            carbon_footprint = tx.amount * 0.01; // 0.01 kg CO2 per dollar (rough estimate)
        }
        
        // Adjust based on merchant profile
        if let Some(merchant_profile) = self.merchant_profiles.get(&tx.seller_did) {
            if merchant_profile.carbon_neutral_shipping {
                carbon_footprint *= 0.7; // 30% reduction for carbon neutral shipping
                sustainability_score += 1.0;
            }
            
            if merchant_profile.renewable_energy_usage > 0.5 {
                carbon_footprint *= 0.8; // 20% reduction for renewable energy
                sustainability_score += 0.5;
            }
            
            sustainability_score += merchant_profile.waste_reduction_score * 0.1;
        }
        
        // Shipping distance impact (simplified)
        carbon_footprint += 0.5; // Base shipping impact
        
        // Cap sustainability score at 10
        sustainability_score = sustainability_score.min(10.0);
        
        (carbon_footprint, sustainability_score)
    }
    
    fn award_carbon_credits(&mut self, merchant_did: &str, carbon_footprint: f64, currency: &str) {
        let rate = self.carbon_credit_rates.get(currency).unwrap_or(&0.15);
        let credit_amount = carbon_footprint * rate * 0.1; // 10% of carbon cost as credit
        
        let carbon_credit_tx = Transaction::new(
            "ecogov_system".to_string(),
            TransactionType::CarbonCredit {
                amount: credit_amount,
                project_id: format!("sustainable_merchant_{}", merchant_did),
            },
        );
        
        self.blockchain.add_transaction(carbon_credit_tx);
        
        println!("🌟 Carbon credit awarded to {}: {:.2} credits", merchant_did, credit_amount);
    }
    
    fn record_environmental_impact(&mut self, tx: &SidelineTransaction) {
        let env_data = EnvironmentalData {
            location: "Philippines".to_string(), // Default location for Sideline_Pinas
            co2_level: 415.0, // Current atmospheric CO2 level
            temperature: 27.0, // Average temperature in Philippines
            humidity: 80.0,   // Average humidity in Philippines
            timestamp: tx.timestamp,
        };
        
        let env_tx = Transaction::new(
            tx.transaction_id.clone(),
            TransactionType::EnvironmentalData { data: env_data },
        );
        
        self.blockchain.add_transaction(env_tx);
    }
    
    pub fn mine_pending_transactions(&mut self) {
        println!("⛏️  Mining pending transactions...");
        self.blockchain.mine_pending_transactions("ecogov_miner".to_string());
    }
    
    pub fn get_blockchain_stats(&self) -> BlockchainStats {
        BlockchainStats {
            total_blocks: self.blockchain.get_chain_length(),
            total_transactions: self.get_total_transactions(),
            marketplace_transactions: self.get_marketplace_transaction_count(),
            carbon_credits_issued: self.get_carbon_credits_issued(),
            average_sustainability_score: self.get_average_sustainability_score(),
            total_carbon_footprint: self.get_total_carbon_footprint(),
        }
    }
    
    fn get_total_transactions(&self) -> usize {
        self.blockchain.get_all_transactions().len()
    }
    
    fn get_marketplace_transaction_count(&self) -> usize {
        self.blockchain.get_all_transactions()
            .iter()
            .filter(|tx| tx.is_marketplace_transaction())
            .count()
    }
    
    fn get_carbon_credits_issued(&self) -> f64 {
        self.blockchain.get_all_transactions()
            .iter()
            .filter_map(|tx| {
                if let TransactionType::CarbonCredit { amount, .. } = &tx.transaction_type {
                    Some(*amount)
                } else {
                    None
                }
            })
            .sum()
    }
    
    fn get_average_sustainability_score(&self) -> f64 {
        let marketplace_txs: Vec<_> = self.blockchain.get_all_transactions()
            .iter()
            .filter_map(|tx| tx.get_marketplace_details())
            .collect();
        
        if marketplace_txs.is_empty() {
            return 0.0;
        }
        
        let total_score: f64 = marketplace_txs
            .iter()
            .filter_map(|tx| tx.sustainability_score)
            .sum();
        
        let count = marketplace_txs
            .iter()
            .filter(|tx| tx.sustainability_score.is_some())
            .count();
        
        if count > 0 {
            total_score / count as f64
        } else {
            0.0
        }
    }
    
    fn get_total_carbon_footprint(&self) -> f64 {
        self.blockchain.get_all_transactions()
            .iter()
            .filter_map(|tx| {
                if let Some(details) = tx.get_marketplace_details() {
                    details.carbon_footprint
                } else {
                    None
                }
            })
            .sum()
    }
    
    pub fn get_blockchain(&self) -> &Blockchain {
        &self.blockchain
    }
    
    pub fn get_blockchain_mut(&mut self) -> &mut Blockchain {
        &mut self.blockchain
    }
    
    // Privacy-related methods
    pub fn create_anonymous_identity(&mut self, sector: SectorType) -> Result<String, String> {
        self.privacy_manager.create_anonymous_identity(sector)
    }
    
    pub fn generate_privacy_proof(&mut self, transaction_hash: String, anonymous_id: String) -> Result<String, String> {
        self.privacy_manager.generate_zero_knowledge_proof(transaction_hash, anonymous_id)
    }
    
    pub fn verify_privacy_proof(&self, proof_id: &str) -> bool {
        self.privacy_manager.verify_privacy_proof(proof_id)
    }
    
    pub fn get_privacy_summary(&self) -> crate::privacy_manager::PrivacySummary {
        self.privacy_manager.get_privacy_summary()
    }
    
    pub fn is_identity_compliant(&self, anonymous_id: &str, sector: &SectorType) -> bool {
        self.privacy_manager.is_compliant_for_sector(anonymous_id, sector)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlockchainStats {
    pub total_blocks: usize,
    pub total_transactions: usize,
    pub marketplace_transactions: usize,
    pub carbon_credits_issued: f64,
    pub average_sustainability_score: f64,
    pub total_carbon_footprint: f64,
}

impl Default for LightChainIntegrationService {
    fn default() -> Self {
        Self::new()
    }
}
