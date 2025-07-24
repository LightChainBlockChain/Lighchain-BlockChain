use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceProposal {
    pub id: String,
    pub proposer: String,
    pub title: String,
    pub description: String,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub created_at: u64,
    pub voting_deadline: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Expired,
}

impl GovernanceProposal {
    pub fn new(id: String, proposer: String, title: String, description: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        GovernanceProposal {
            id,
            proposer,
            title,
            description,
            status: ProposalStatus::Active,
            votes_for: 0,
            votes_against: 0,
            created_at: now,
            voting_deadline: now + (7 * 24 * 60 * 60), // 7 days from now
        }
    }
    
    pub fn vote(&mut self, in_favor: bool) {
        if in_favor {
            self.votes_for += 1;
        } else {
            self.votes_against += 1;
        }
    }
    
    pub fn get_total_votes(&self) -> u64 {
        self.votes_for + self.votes_against
    }
    
    pub fn get_approval_percentage(&self) -> f64 {
        let total = self.get_total_votes();
        if total == 0 {
            0.0
        } else {
            (self.votes_for as f64 / total as f64) * 100.0
        }
    }
    
    pub fn is_expired(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        now > self.voting_deadline
    }
    
    pub fn finalize(&mut self) {
        if self.is_expired() {
            self.status = ProposalStatus::Expired;
        } else if self.get_approval_percentage() > 50.0 {
            self.status = ProposalStatus::Passed;
        } else {
            self.status = ProposalStatus::Rejected;
        }
    }
}

impl std::fmt::Display for GovernanceProposal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Proposal {}: {} - Status: {:?}, Votes: {} for, {} against",
            self.id, self.title, self.status, self.votes_for, self.votes_against
        )
    }
}
