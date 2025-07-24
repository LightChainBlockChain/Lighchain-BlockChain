use crate::transaction::Transaction;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: usize,
    pub timestamp: u64,
    pub previous_hash: String,
    pub hash: String,
    pub transactions: Vec<Transaction>,
    pub nonce: u64,
}

impl Block {
    pub fn new(index: usize, previous_hash: String, transactions: Vec<Transaction>, timestamp: u64) -> Self {
        let mut block = Block {
            index,
            timestamp,
            previous_hash,
            hash: String::new(),
            transactions,
            nonce: 0,
        };
        
        block.hash = block.calculate_hash();
        block
    }
    
    pub fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        
        // Create a string representation of the block data
        let block_data = format!(
            "{}{}{}{}{}",
            self.index,
            self.timestamp,
            self.previous_hash,
            self.serialize_transactions(),
            self.nonce
        );
        
        hasher.update(block_data.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }
    
    pub fn mine_block(&mut self, difficulty: usize) {
        let target = "0".repeat(difficulty);
        
        println!("⛏️  Mining block {} with difficulty {}...", self.index, difficulty);
        
        while !self.hash.starts_with(&target) {
            self.nonce += 1;
            self.hash = self.calculate_hash();
        }
        
        println!("✅ Block mined: {}", self.hash);
    }
    
    fn serialize_transactions(&self) -> String {
        self.transactions
            .iter()
            .map(|tx| tx.to_string())
            .collect::<Vec<String>>()
            .join(",")
    }
    
    pub fn get_transaction_count(&self) -> usize {
        self.transactions.len()
    }
    
    pub fn get_transactions_by_type(&self, transaction_type: &str) -> Vec<&Transaction> {
        self.transactions
            .iter()
            .filter(|tx| tx.get_type_name() == transaction_type)
            .collect()
    }
    
    pub fn get_marketplace_transactions(&self) -> Vec<&Transaction> {
        self.get_transactions_by_type("MarketplaceTransaction")
    }
}

impl std::fmt::Display for Block {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Block #{} [{}] - {} transactions, nonce: {}",
            self.index,
            &self.hash[..8],
            self.transactions.len(),
            self.nonce
        )
    }
}
