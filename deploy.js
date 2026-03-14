import { createPublicClient, createWalletClient, http, parseEther, formatEther, getContractAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";
import fs from "fs";
import path from "path";

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
    console.log("==========================================");
    console.log("Starting Reactive Firewall Deployment (via Viem)...");
    console.log("==========================================");

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        console.error("❌ PRIVATE_KEY missing in .env");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    console.log("Deploying from Neural Link:", account.address);

    const publicClient = createPublicClient({
        chain: somniaShannonTestnet,
        transport: http()
    });

    const walletClient = createWalletClient({
        account,
        chain: somniaShannonTestnet,
        transport: http()
    });

    const balance = await publicClient.getBalance({ address: account.address });
    const balanceInSTT = formatEther(balance);
    console.log(`Deployer Fuel: ${balanceInSTT} STT`);

    // 1. Read Artifact
    const artifactPath = path.resolve("./artifacts/contracts/FluxVault.sol/FluxVault.json");
    if (!fs.existsSync(artifactPath)) {
        console.error("❌ FluxVault artifact not found. Run 'npx hardhat compile' first.");
        process.exit(1);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // 2. Deploy Params
    const initialThreshold = parseEther("500");
    const coldStorageWallet = account.address; // Default to self for demo

    console.log("Deploying FluxVault to Somnia Shannon Testnet...");

    const hash = await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        args: [initialThreshold, coldStorageWallet],
    });

    console.log("⏳ Transaction broadcast! Hash:", hash);
    console.log("Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const vaultAddress = receipt.contractAddress;

    console.log("✅ FluxVault anchored at:", vaultAddress);
    console.log("\nDeployment Phase Complete!");
    console.log("Next Step: Run the subscribe.js script to activate Reactivity.");
}

main().catch(console.error);
