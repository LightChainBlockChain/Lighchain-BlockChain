// Bridge API to integrate EcoGov-Chain with Sideline_Pinas marketplace

use warp::Filter;
use eco_gov_chain::blockchain::Blockchain;
use eco_gov_chain::transaction::Transaction;
use eco_gov_chain::transaction::TransactionType;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Deserialize)]
struct MarketplaceTransactionInput {
    buyer_did: String,
    seller_did: String,
    product_did: String,
    transaction_id: String,
    amount: f64,
    currency: String,
    status: String,
}

#[derive(Serialize)]
struct ApiResponse {
    status: String,
    message: String,
}

#[tokio::main]
async fn main() {
    let blockchain = Arc::new(Mutex::new(Blockchain::new()));

    let add_transaction = warp::post()
        .and(warp::path("add_transaction"))
        .and(warp::body::json())
        .and(with_blockchain(blockchain.clone()))
        .and_then(handle_add_transaction);

    let routes = warp::path("api").and(add_transaction);

    println!("🚀 EcoGov-Chain Bridge API is running on http://localhost:3030/api/add_transaction");

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}

fn with_blockchain(
    blockchain: Arc<Mutex<Blockchain>>,
) -> impl Filter<Extract = (Arc<Mutex<Blockchain>>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || blockchain.clone())
}

async fn handle_add_transaction(
    input: MarketplaceTransactionInput,
    blockchain: Arc<Mutex<Blockchain>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    let transaction = Transaction::new_marketplace_transaction(
        input.buyer_did.clone(),
        input.seller_did.clone(),
        input.product_did.clone(),
        input.transaction_id.clone(),
        input.amount,
        input.currency.clone(),
        input.status.clone(),
    );

    let mut blockchain = blockchain.lock().unwrap();
    blockchain.add_transaction(transaction);

    Ok(warp::reply::json(&ApiResponse {
        status: "success".to_string(),
        message: "Transaction added to the blockchain.".to_string(),
    }))
}

