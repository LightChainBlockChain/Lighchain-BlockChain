use crate::block::Block;
use crate::transaction::Transaction;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Blockchain {
    chain: Vec<Block>,
    difficulty: usize,
    pending_transactions: Vec<Transaction>,
    mining_reward: f64,
    // validator_stakes: HashMap<String, f64>,
}

impl Blockchain {
    pub fn new() -> Self {
        let mut blockchain = Blockchain {
            chain: Vec::new(),
            difficulty: 4,
            pending_transactions: Vec::new(),
            mining_reward: 100.0,
        };
        
        // Create the genesis block
        blockchain.create_genesis_block();
        blockchain
    }
    
    fn create_genesis_block(&mut self) {
        let genesis_block = Block::new(
            0,
            "0".to_string(),
            Vec::new(),
            1640995200, // January 1, 2022 (EcoGov-Chain launch date)
        );
        
        self.chain.push(genesis_block);
    }
    
    pub fn get_latest_block(&self) -> Option<&Block> {
        self.chain.last()
    }
    
    pub fn add_transaction(&mut self, transaction: Transaction) {
        self.pending_transactions.push(transaction);
    }
    
    pub fn mine_pending_transactions(&mut self, mining_reward_address: String) {
        // Add mining reward transaction
        let reward_tx = Transaction::new(
            mining_reward_address,
            crate::transaction::TransactionType::MiningReward {
                amount: self.mining_reward,
            },
        );
        self.pending_transactions.push(reward_tx);
        
        // Create new block
        let index = self.chain.len();
        let previous_hash = self.get_latest_block().unwrap().hash.clone();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let mut new_block = Block::new(
            index,
            previous_hash,
            self.pending_transactions.clone(),
            timestamp,
        );
        
        // Mine the block (Proof of Work)
        new_block.mine_block(self.difficulty);
        
        // Add to chain and clear pending transactions
        self.chain.push(new_block);
        self.pending_transactions.clear();
    }
    
    pub fn get_balance(&self, address: &str) -> f64 {
        let mut balance = 0.0;
        
        for block in &self.chain {
            for transaction in &block.transactions {
                match &transaction.transaction_type {
                    crate::transaction::TransactionType::CarbonCredit { amount, .. } => {
                        if transaction.from == address {
                            balance += amount;
                        }
                    }
                    crate::transaction::TransactionType::MiningReward { amount } => {
                        if transaction.from == address {
                            balance += amount;
                        }
                    }
                    _ => {}
                }
            }
        }
        
        balance
    }
    
    pub fn is_chain_valid(&self) -> bool {
        for i in 1..self.chain.len() {
            let current_block = &self.chain[i];
            let previous_block = &self.chain[i - 1];
            
            // Check if current block's hash is valid
            if current_block.hash != current_block.calculate_hash() {
                return false;
            }
            
            // Check if current block points to previous block
            if current_block.previous_hash != previous_block.hash {
                return false;
            }
        }
        
        true
    }
    
    pub fn get_chain_length(&self) -> usize {
        self.chain.len()
    }
    
    pub fn get_difficulty(&self) -> usize {
        self.difficulty
    }
    
    pub fn add_validator(&mut self, _address: String, _stake: f64) {
        // Validator functionality can be implemented here if needed
    }
    
    pub fn get_validator_stake(&self, _address: &str) -> f64 {
        // Validator functionality can be implemented here if needed
        0.0
    }
    
    pub fn get_all_transactions(&self) -> Vec<&Transaction> {
        self.chain.iter()
            .flat_map(|block| &block.transactions)
            .collect()
    }
    
    pub fn get_environmental_data(&self) -> Vec<crate::environment::EnvironmentalData> {
        let mut env_data = Vec::new();
        
        for block in &self.chain {
            for transaction in &block.transactions {
                if let crate::transaction::TransactionType::EnvironmentalData { data } = &transaction.transaction_type {
                    env_data.push(data.clone());
                }
            }
        }
        
        env_data
    }
}

impl Default for Blockchain {
    fn default() -> Self {
        Self::new()
    }
}
