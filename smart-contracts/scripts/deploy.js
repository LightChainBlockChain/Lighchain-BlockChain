const hre = require("hardhat");

async function main() {
    console.log("Starting deployment of LightGovernanceToken...");
    
    // Get the ContractFactory and Signers here
    const [deployer] = await hre.ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // Deploy LightGovernanceToken
    const LightGovernanceToken = await hre.ethers.getContractFactory("LightGovernanceToken");
    
    // Constructor parameters for LightGovernanceToken
    const initialOwner = deployer.address; // The deployer will be the initial owner
    
    console.log("Deploying LightGovernanceToken with initial owner:", initialOwner);
    
    const lightToken = await LightGovernanceToken.deploy(initialOwner);
    
    await lightToken.deployed();
    
    console.log("LightGovernanceToken deployed to:", lightToken.address);
    console.log("Initial owner:", initialOwner);
    
    // Verify deployment
    const tokenName = await lightToken.name();
    const tokenSymbol = await lightToken.symbol();
    const totalSupply = await lightToken.totalSupply();
    const maxSupply = await lightToken.maxSupply();
    
    console.log("\n=== Deployment Summary ===");
    console.log("Contract Address:", lightToken.address);
    console.log("Token Name:", tokenName);
    console.log("Token Symbol:", tokenSymbol);
    console.log("Total Supply:", hre.ethers.utils.formatEther(totalSupply), "LIGHT");
    console.log("Max Supply:", hre.ethers.utils.formatEther(maxSupply), "LIGHT");
    console.log("Owner Address:", await lightToken.owner());
    
    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: lightToken.address,
        deployer: deployer.address,
        blockNumber: lightToken.deployTransaction.blockNumber,
        transactionHash: lightToken.deployTransaction.hash,
        gasUsed: lightToken.deployTransaction.gasLimit.toString(),
        timestamp: new Date().toISOString(),
        contractDetails: {
            name: tokenName,
            symbol: tokenSymbol,
            totalSupply: totalSupply.toString(),
            maxSupply: maxSupply.toString()
        }
    };
    
    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir);
    }
    
    const deploymentFile = path.join(deploymentDir, `${hre.network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n=== Next Steps ===");
    console.log("1. Add the contract address to your frontend configuration");
    console.log("2. Add the contract address to MetaMask as a custom token:");
    console.log("   - Token Address:", lightToken.address);
    console.log("   - Token Symbol: LIGHT");
    console.log("   - Token Decimals: 18");
    console.log("3. Verify the contract on the block explorer (if on mainnet/testnet)");
    console.log("4. Set up governance proposals and voting mechanisms");
    console.log("\nDeployment info saved to:", deploymentFile);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
