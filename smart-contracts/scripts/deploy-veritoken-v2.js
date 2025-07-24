const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting VeriToken V2 deployment...\n");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy VeriToken V2
    console.log("🔨 Deploying VeriToken V2...");
    const VeriTokenV2 = await ethers.getContractFactory("VeriTokenV2");
    const veriToken = await VeriTokenV2.deploy();
    await veriToken.deployed();

    console.log("✅ VeriToken V2 deployed to:", veriToken.address);
    console.log("🏗️ Transaction hash:", veriToken.deployTransaction.hash);

    // Wait for a few block confirmations
    console.log("\n⏳ Waiting for block confirmations...");
    await veriToken.deployTransaction.wait(2);

    // Get contract info
    const name = await veriToken.name();
    const symbol = await veriToken.symbol();
    const decimals = await veriToken.decimals();
    const totalSupply = await veriToken.totalSupply();
    const maxSupply = await veriToken.MAX_SUPPLY();
    const developerAddress = await veriToken.DEVELOPER_ADDRESS();
    const developerAllocation = await veriToken.DEVELOPER_ALLOCATION();

    console.log("\n📊 Token Information:");
    console.log("│");
    console.log("├─ Name:", name);
    console.log("├─ Symbol:", symbol);
    console.log("├─ Decimals:", decimals);
    console.log("├─ Total Supply:", ethers.utils.formatEther(totalSupply), "VERI");
    console.log("├─ Max Supply:", ethers.utils.formatEther(maxSupply), "VERI");
    console.log("├─ Developer Address:", developerAddress);
    console.log("└─ Developer Allocation:", ethers.utils.formatEther(developerAllocation), "VERI");

    // Check developer balance
    const developerBalance = await veriToken.balanceOf(developerAddress);
    console.log("\n💰 Developer Balance:", ethers.utils.formatEther(developerBalance), "VERI");

    // Get allocation info
    const allocationInfo = await veriToken.getAllocationInfo(developerAddress);
    console.log("\n📈 Developer Allocation Info:");
    console.log("│");
    console.log("├─ Allocated:", ethers.utils.formatEther(allocationInfo.allocated), "VERI");
    console.log("├─ Claimed:", ethers.utils.formatEther(allocationInfo.claimed), "VERI");
    console.log("├─ Remaining:", ethers.utils.formatEther(allocationInfo.remaining), "VERI");
    console.log("└─ Is Eligible:", allocationInfo.isEligible);

    // Get commission configuration
    const commissionConfig = await veriToken.commissionConfig();
    console.log("\n⚙️ Commission Configuration:");
    console.log("│");
    console.log("├─ Developer Rate:", (commissionConfig.developerCommissionRate / 100).toFixed(1) + "%");
    console.log("├─ Marketplace Rate:", (commissionConfig.marketplaceCommissionRate / 100).toFixed(1) + "%");
    console.log("├─ Staking Rate:", (commissionConfig.stakingRewardRate / 100).toFixed(1) + "%");
    console.log("├─ Burn Rate:", (commissionConfig.burnRate / 100).toFixed(1) + "%");
    console.log("└─ Commission Active:", commissionConfig.commissionActive);

    // Get developer commission info
    const devCommissionInfo = await veriToken.getDeveloperCommissionInfo();
    console.log("\n💸 Developer Commission Info:");
    console.log("│");
    console.log("├─ Total Earned:", ethers.utils.formatEther(devCommissionInfo.totalEarned), "VERI");
    console.log("├─ Total Claimed:", ethers.utils.formatEther(devCommissionInfo.totalClaimed), "VERI");
    console.log("├─ Pending:", ethers.utils.formatEther(devCommissionInfo.pending), "VERI");
    console.log("├─ Last Claim Time:", new Date(devCommissionInfo.lastClaimTime * 1000).toISOString());
    console.log("└─ Transaction Count:", devCommissionInfo.transactionCount.toString());

    // Get token statistics
    const stats = await veriToken.getTokenStatistics();
    console.log("\n📊 Token Statistics:");
    console.log("│");
    console.log("├─ Total Supply:", ethers.utils.formatEther(stats._totalSupply), "VERI");
    console.log("├─ Total Minted:", ethers.utils.formatEther(stats._totalMinted), "VERI");
    console.log("├─ Total Burned:", ethers.utils.formatEther(stats._totalBurned), "VERI");
    console.log("├─ Total Staked:", ethers.utils.formatEther(stats._totalStaked), "VERI");
    console.log("├─ Total Transactions:", stats._totalTransactions.toString());
    console.log("├─ Active Stakers:", stats._activeStakers.toString());
    console.log("├─ Total Commissions Paid:", ethers.utils.formatEther(stats._totalCommissionsPaid), "VERI");
    console.log("└─ Total Marketplace Volume:", ethers.utils.formatEther(stats._totalMarketplaceVolume), "VERI");

    // Calculate and display health score
    const healthScore = await veriToken.calculateHealthScore();
    console.log("\n🏥 Token Health Score:", healthScore.toString() + "/100");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: veriToken.address,
        deployerAddress: deployer.address,
        developerAddress: developerAddress,
        transactionHash: veriToken.deployTransaction.hash,
        blockNumber: veriToken.deployTransaction.blockNumber,
        gasUsed: veriToken.deployTransaction.gasLimit.toString(),
        timestamp: new Date().toISOString(),
        tokenInfo: {
            name: name,
            symbol: symbol,
            decimals: decimals,
            totalSupply: ethers.utils.formatEther(totalSupply),
            maxSupply: ethers.utils.formatEther(maxSupply),
            developerAllocation: ethers.utils.formatEther(developerAllocation)
        },
        commissionConfig: {
            developerCommissionRate: commissionConfig.developerCommissionRate.toString(),
            marketplaceCommissionRate: commissionConfig.marketplaceCommissionRate.toString(),
            stakingRewardRate: commissionConfig.stakingRewardRate.toString(),
            burnRate: commissionConfig.burnRate.toString(),
            commissionActive: commissionConfig.commissionActive
        }
    };

    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `veritoken-v2-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", filepath);

    // Verification instructions
    console.log("\n🔍 Verification Instructions:");
    console.log("To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${veriToken.address}`);

    console.log("\n🎉 Deployment Complete!");
    console.log("═══════════════════════════════════════");
    console.log("📍 Contract Address:", veriToken.address);
    console.log("👨‍💻 Developer Address:", developerAddress);
    console.log("💰 Developer Allocation:", ethers.utils.formatEther(developerAllocation), "VERI");
    console.log("⚙️ Commission Rate: 10%");
    console.log("✅ Ready for marketplace integration!");
    console.log("═══════════════════════════════════════");

    return {
        contractAddress: veriToken.address,
        contract: veriToken,
        deploymentInfo: deploymentInfo
    };
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;
