import { createPublicClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";

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
    console.log("Starting Reactive Subscription Registration...");
    console.log("==========================================");

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        console.error("❌ PRIVATE_KEY missing in .env");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    console.log("Using Neural Link:", account.address);

    const publicClient = createPublicClient({
        chain: somniaShannonTestnet,
        transport: http()
    });

    const balance = await publicClient.getBalance({ address: account.address });
    const balanceInSTT = formatEther(balance);
    console.log(`Deployer Fuel: ${balanceInSTT} STT`);

    // Safety check: Requires 32 STT to register a subscription on the Reactivity Network
    if (parseFloat(balanceInSTT) < 32.1) {
        console.error("❌ INSUFFICIENT NATIVE TOKEN: You require > 32 STT to register Reactive subscriptions (32 STT fee + gas).");
        process.exit(1);
    }

    // --- MUST UPDATE THIS WITH THE DEPLOYED VAULT ADDRESS ---
    const vaultAddress = process.env.VAULT_ADDRESS || "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
    if (vaultAddress === "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
        console.error("❌ VAULT ADDRESS MISSING: Please set VAULT_ADDRESS in your .env file or update subscribe.js.");
        process.exit(1);
    }
    
    console.log(`Targeting FluxVault anchored at: ${vaultAddress}`);

    // 2. Register a Reactive Subscription
    console.log("\nInitiating Reactive Subscription via @somnia-chain/streams...");
    
    /* 
     // HACKATHON LIVE CODE - Un-comment this block when you add your `.env` PRIVATE_KEY //
     
     import { StreamClient } from "@somnia-chain/streams";
     
     const streamClient = new StreamClient({ 
          rpcUrl: "https://dream-rpc.somnia.network", 
          privateKey: PRIVATE_KEY
     });
     
     const subscriptionRequest = {
          // Configuration: Listen for Transfer events on the STT native network
          source: {
              chainId: 50312,
              eventType: "Transfer",
              // Target is left to match network wide native transfers acting as an anomaly detector
          },
          // Trigger: Set the destination to newly deployed FluxVault's onEvent handler
          destination: {
              address: vaultAddress,
              functionSelector: "0x8848a529" // Signature for 'onEvent(bytes32,bytes)'
          },
          fee: parseEther("32") // The on-chain Reactivity cost
     };
     
     console.log("Registering Stream...");
     const tx = await streamClient.registerSubscription(subscriptionRequest);
     console.log("✅ Reactive Subscription Active! Shield is ONLINE. Tx:", tx.hash);
     */

    console.log("\nReactivity Engine Configuration fully complete! (Pending uncomment)");
}

main().catch(console.error);
