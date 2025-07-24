use serde::{Deserialize, Serialize};
use crate::transaction::{Transaction, TransactionType};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    pub owner_address: String,
    pub commission_rate: f64,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommissionTransaction {
    pub transaction_id: String,
    pub original_transaction_id: String,
    pub wallet_address: String,
    pub commission_amount: f64,
    pub original_amount: f64,
    pub timestamp: u64,
}

pub struct WalletIntegration {
    config: WalletConfig,
    total_earnings: f64,
    commission_transactions: Vec<CommissionTransaction>,
}

impl WalletIntegration {
    pub fn new(owner_address: String, commission_rate: f64) -> Self {
        WalletIntegration {
            config: WalletConfig {
                owner_address,
                commission_rate,
                enabled: true,
            },
            total_earnings: 0.0,
            commission_transactions: Vec::new(),
        }
    }

    pub fn calculate_commission(&self, transaction_amount: f64) -> f64 {
        if !self.config.enabled {
            return 0.0;
        }
        transaction_amount * self.config.commission_rate
    }

    pub fn process_commission(
        &mut self,
        original_transaction_id: String,
        transaction_amount: f64,
    ) -> Result<CommissionTransaction, String> {
        if !self.config.enabled {
            return Err("Wallet integration is disabled".to_string());
        }

        let commission_amount = self.calculate_commission(transaction_amount);
        
        let commission_tx = CommissionTransaction {
            transaction_id: format!("comm_{}", rand::random::<u32>()),
            original_transaction_id,
            wallet_address: self.config.owner_address.clone(),
            commission_amount,
            original_amount: transaction_amount,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        self.total_earnings += commission_amount;
        self.commission_transactions.push(commission_tx.clone());

        Ok(commission_tx)
    }

    pub fn create_commission_blockchain_transaction(
        &self,
        commission_tx: &CommissionTransaction,
    ) -> Transaction {
        Transaction::new(
            "system".to_string(),
            TransactionType::CommissionPayment {
                commission_id: commission_tx.transaction_id.clone(),
                wallet_address: commission_tx.wallet_address.clone(),
                commission_amount: commission_tx.commission_amount,
                original_transaction_id: commission_tx.original_transaction_id.clone(),
                original_amount: commission_tx.original_amount,
            },
        )
    }

    pub fn get_total_earnings(&self) -> f64 {
        self.total_earnings
    }

    pub fn get_commission_transactions(&self) -> &Vec<CommissionTransaction> {
        &self.commission_transactions
    }

    pub fn get_wallet_address(&self) -> &str {
        &self.config.owner_address
    }

    pub fn get_commission_rate(&self) -> f64 {
        self.config.commission_rate
    }

    pub fn is_enabled(&self) -> bool {
        self.config.enabled
    }

    pub fn toggle_enabled(&mut self) {
        self.config.enabled = !self.config.enabled;
    }

    pub fn get_earnings_summary(&self) -> WalletEarningsSummary {
        WalletEarningsSummary {
            wallet_address: self.config.owner_address.clone(),
            total_earnings: self.total_earnings,
            commission_rate: self.config.commission_rate,
            total_transactions: self.commission_transactions.len(),
            average_commission: if self.commission_transactions.is_empty() {
                0.0
            } else {
                self.total_earnings / self.commission_transactions.len() as f64
            },
            enabled: self.config.enabled,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletEarningsSummary {
    pub wallet_address: String,
    pub total_earnings: f64,
    pub commission_rate: f64,
    pub total_transactions: usize,
    pub average_commission: f64,
    pub enabled: bool,
}

impl Default for WalletIntegration {
    fn default() -> Self {
        WalletIntegration::new(
            "0x568b65e3C2572f355d08c284348C492856a95F88".to_string(),
            0.10, // 10% commission
        )
    }
}
