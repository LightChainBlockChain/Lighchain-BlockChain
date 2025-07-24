use serde::{Deserialize, Serialize};
use crate::environment::EnvironmentalData;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub from: String,
    pub timestamp: u64,
    pub transaction_type: TransactionType,
    pub signature: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    CarbonCredit {
        amount: f64,
        project_id: String,
    },
    GovernanceVote {
        proposal_id: String,
        vote: String,
    },
    EnvironmentalData {
        data: EnvironmentalData,
    },
    MiningReward {
        amount: f64,
    },
    MarketplaceTransaction {
        transaction_id: String,
        buyer_did: String,
        seller_did: String,
        product_did: String,
        amount: f64,
        currency: String,
        status: String,
        carbon_footprint: Option<f64>,
        sustainability_score: Option<f64>,
    },
    CredentialVerification {
        credential_id: String,
        issuer_did: String,
        subject_did: String,
        credential_type: String,
        verification_result: bool,
    },
    EnvironmentalImpact {
        entity_id: String,
        impact_type: String,
        impact_value: f64,
        measurement_unit: String,
        location: Option<String>,
    },
    CommissionPayment {
        commission_id: String,
        wallet_address: String,
        commission_amount: f64,
        original_transaction_id: String,
        original_amount: f64,
    },
}

impl Transaction {
    pub fn new(from: String, transaction_type: TransactionType) -> Self {
        Transaction {
            id: Self::generate_id(),
            from,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            transaction_type,
            signature: None,
        }
    }
    
    pub fn new_marketplace_transaction(
        buyer_did: String,
        seller_did: String,
        product_did: String,
        transaction_id: String,
        amount: f64,
        currency: String,
        status: String,
    ) -> Self {
        Transaction::new(
            buyer_did.clone(),
            TransactionType::MarketplaceTransaction {
                transaction_id,
                buyer_did,
                seller_did,
                product_did,
                amount,
                currency,
                status,
                carbon_footprint: None,
                sustainability_score: None,
            }
        )
    }
    
    pub fn new_credential_verification(
        verifier: String,
        credential_id: String,
        issuer_did: String,
        subject_did: String,
        credential_type: String,
        verification_result: bool,
    ) -> Self {
        Transaction::new(
            verifier,
            TransactionType::CredentialVerification {
                credential_id,
                issuer_did,
                subject_did,
                credential_type,
                verification_result,
            }
        )
    }
    
    pub fn new_environmental_impact(
        entity_id: String,
        impact_type: String,
        impact_value: f64,
        measurement_unit: String,
        location: Option<String>,
    ) -> Self {
        Transaction::new(
            entity_id.clone(),
            TransactionType::EnvironmentalImpact {
                entity_id,
                impact_type,
                impact_value,
                measurement_unit,
                location,
            }
        )
    }
    
    fn generate_id() -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        format!("tx_{:x}", rng.gen::<u64>())
    }
    
    pub fn get_type_name(&self) -> &'static str {
        match self.transaction_type {
            TransactionType::CarbonCredit { .. } => "CarbonCredit",
            TransactionType::GovernanceVote { .. } => "GovernanceVote",
            TransactionType::EnvironmentalData { .. } => "EnvironmentalData",
            TransactionType::MiningReward { .. } => "MiningReward",
            TransactionType::MarketplaceTransaction { .. } => "MarketplaceTransaction",
            TransactionType::CredentialVerification { .. } => "CredentialVerification",
            TransactionType::EnvironmentalImpact { .. } => "EnvironmentalImpact",
            TransactionType::CommissionPayment { .. } => "CommissionPayment",
        }
    }
    
    pub fn is_marketplace_transaction(&self) -> bool {
        matches!(self.transaction_type, TransactionType::MarketplaceTransaction { .. })
    }
    
    pub fn get_marketplace_details(&self) -> Option<MarketplaceTransactionDetails> {
        if let TransactionType::MarketplaceTransaction {
            transaction_id,
            buyer_did,
            seller_did,
            product_did,
            amount,
            currency,
            status,
            carbon_footprint,
            sustainability_score,
        } = &self.transaction_type {
            Some(MarketplaceTransactionDetails {
                transaction_id: transaction_id.clone(),
                buyer_did: buyer_did.clone(),
                seller_did: seller_did.clone(),
                product_did: product_did.clone(),
                amount: *amount,
                currency: currency.clone(),
                status: status.clone(),
                carbon_footprint: *carbon_footprint,
                sustainability_score: *sustainability_score,
            })
        } else {
            None
        }
    }
    
    pub fn update_environmental_impact(&mut self, carbon_footprint: f64, sustainability_score: f64) {
        if let TransactionType::MarketplaceTransaction {
            carbon_footprint: ref mut cf,
            sustainability_score: ref mut ss,
            ..
        } = self.transaction_type {
            *cf = Some(carbon_footprint);
            *ss = Some(sustainability_score);
        }
    }
    
    pub fn sign(&mut self, _private_key: &str) {
        // This function could be used to sign a transaction if necessary.
    }

    pub fn verify_signature(&self, _public_key: &str) -> bool {
        // This function could be used to verify a transaction signature if necessary.
        true
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceTransactionDetails {
    pub transaction_id: String,
    pub buyer_did: String,
    pub seller_did: String,
    pub product_did: String,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub carbon_footprint: Option<f64>,
    pub sustainability_score: Option<f64>,
}

impl std::fmt::Display for Transaction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{} - {} ({})",
            self.id,
            self.get_type_name(),
            self.from
        )
    }
}
