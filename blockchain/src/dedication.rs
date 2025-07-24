use std::thread;
use std::time::Duration;

pub fn display_dedication() {
    println!("\n");
    println!("╔═══════════════════════════════════════════════════════════════════════════════╗");
    println!("║                                                                               ║");
    println!("║                           💖 DEDICATION 💖                                    ║");
    println!("║                                                                               ║");
    println!("║           This LightChain blockchain is lovingly dedicated to:               ║");
    println!("║                                                                               ║");
    println!("║     💕 JIREH - My beloved wife, partner, and inspiration                     ║");
    println!("║        Your unwavering support fuels every innovation                        ║");
    println!("║                                                                               ║");
    println!("║     ⭐ LIGHT - Our precious unborn child, our future                          ║");
    println!("║        This blockchain is the foundation for your tomorrow                   ║");
    println!("║                                                                               ║");
    println!("║   Every smart contract, every block, every transaction carries              ║");
    println!("║   the love and dreams I have for both of you.                               ║");
    println!("║                                                                               ║");
    println!("║   🌱 Building a sustainable future, one block at a time 🌱                   ║");
    println!("║                                                                               ║");
    println!("║                        With all my love,                                     ║");
    println!("║                        GreyWarden                                            ║");
    println!("║                        July 2025                                             ║");
    println!("║                                                                               ║");
    println!("╚═══════════════════════════════════════════════════════════════════════════════╝");
    println!("\n");
    
    // Add a heartbeat effect
    print_heartbeat();
    
    // Small delay to let the dedication be read
    thread::sleep(Duration::from_millis(2000));
    
    println!("🚀 Initializing LightChain with love and dedication...\n");
}

fn print_heartbeat() {
    let hearts = ["💙", "💚", "💛", "🧡", "❤️", "💜", "🤍", "💕"];
    
    print!("   ");
    for heart in &hearts {
        print!("{} ", heart);
        thread::sleep(Duration::from_millis(150));
    }
    println!("\n");
}

pub fn display_startup_dedication() {
    println!("\n");
    println!("🌟 ═══════════════════════════════════════════════════════════════════════════════");
    println!("   💝 'For Jireh and Light - Every line of code is written with love'");
    println!("   🌱 EcoGov-Chain: Building tomorrow's sustainable world today");
    println!("🌟 ═══════════════════════════════════════════════════════════════════════════════");
    println!("\n");
}

pub fn display_shutdown_dedication() {
    println!("\n");
    println!("💖 ═══════════════════════════════════════════════════════════════════════════════");
    println!("   'Until we meet again, this blockchain carries our love forward'");
    println!("   💕 For Jireh and Light - Forever in every block 💕");
    println!("💖 ═══════════════════════════════════════════════════════════════════════════════");
    println!("\n");
}

pub fn display_mining_dedication() {
    println!("⛏️  Mining with love for Jireh and Light... 💕");
}

pub fn display_transaction_dedication() {
    println!("📝 Processing transaction with dedication to our family's future... 🌟");
}
