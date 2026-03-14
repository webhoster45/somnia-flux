import hre from "hardhat";
// Hardhat injects ethers into hre in v3

import { createPublicClient, http, parseEther, formatEther } from "viem";

// Custom chain representation for Somnia Shannon Testnet
const somniaShannonTestnet = {
    id: 50312,
    name: "Somnia Shannon Testnet",
    network: "somnia-shannon",
    nativeCurrency: {
        decimals: 18,
        name: "STT",
        symbol: "STT",
    },
    rpcUrls: {
        default: { http: ["https://dream-rpc.somnia.network"] },
        public: { http: ["https://dream-rpc.somnia.network"] },
    },
};

async function main() {
    // 1. Setup Deployer Wallet
    const [deployer] = await hre.ethers.getSigners();
    console.log("==========================================");
    console.log("Starting Reactive Firewall Deployment...");
    console.log("Deploying from Neural Link:", deployer.address);
    // User Address targeted for ownership: 0x7B2050a36ec38889C648157F12D9Dc72709991a2
    console.log("==========================================");

    const publicClient = createPublicClient({
        chain: somniaShannonTestnet,
        transport: http()
    });

    const balance = await publicClient.getBalance({ address: deployer.address });
    const balanceInSTT = parseFloat(formatEther(balance));
    console.log(`Deployer Fuel: ${balanceInSTT} STT`);

    // 2. Deploy the FluxVault contract with initial state
    const initialThreshold = parseEther("500"); // Start with a default threat threshold of 500 STT
    
    // We will use the deployer's address as the "Cold Storage Wallet" for the Hackathon demo
    const coldStorageWallet = deployer.address; 
    
    const FluxVault = await hre.ethers.getContractFactory("FluxVault");
    
    console.log("Deploying FluxVault to Somnia Shannon Testnet...");
    const fluxVault = await FluxVault.deploy(initialThreshold, coldStorageWallet);
    await fluxVault.waitForDeployment();
    const vaultAddress = await fluxVault.getAddress();
    
    console.log("✅ FluxVault anchored at:", vaultAddress);
    console.log("\nDeployment Phase Complete!");
    console.log("Next Step: Run the subscribe.js script to activate Reactivity.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment crashed:", error);
        process.exit(1);
    });
