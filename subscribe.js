import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
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

// Somnia Reactivity Registry Contract (Shannon Testnet)
const REGISTRY_ADDRESS = "0x94f1E5B4Af180907B5940082725f0132b85CC8c4";
const REGISTRY_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "uint64", "name": "chainId", "type": "uint64" },
                    { "internalType": "address", "name": "sourceAddress", "type": "address" },
                    { "internalType": "bytes32", "name": "eventSignature", "type": "bytes32" },
                    { "internalType": "address", "name": "destinationAddress", "type": "address" },
                    { "internalType": "bytes4", "name": "functionSelector", "type": "bytes4" }
                ],
                "internalType": "struct SubscriptionRequest",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "register",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
];

async function main() {
    console.log("==========================================");
    console.log("🚀 ACTIVATING NEURAL RECEPTOR (SUBSCRIPTION)");
    console.log("==========================================");

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

    if (!PRIVATE_KEY || !VAULT_ADDRESS) {
        console.error("❌ ERROR: PRIVATE_KEY or VAULT_ADDRESS missing in .env");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    const publicClient = createPublicClient({ chain: somniaShannonTestnet, transport: http() });
    const walletClient = createWalletClient({ account, chain: somniaShannonTestnet, transport: http() });

    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Wallet Balance: ${formatEther(balance)} STT`);

    if (balance < parseEther("32.1")) {
        console.error("❌ INSUFFICIENT FUNDS: Reactivity subscription requires exactly 32 STT fee + gas.");
        process.exit(1);
    }

    console.log(`\nNeural Anchor: ${VAULT_ADDRESS}`);
    console.log("Subscription Fee: 32 STT (Handled Automatically)");

    const request = {
        chainId: BigInt(50312),
        sourceAddress: "0x0000000000000000000000000000000000000000", // Listen to network-wide native transfers
        eventSignature: "0x0000000000000000000000000000000000000000000000000000000000000000", 
        destinationAddress: VAULT_ADDRESS,
        functionSelector: "0x8848a529" // onEvent(bytes32,bytes)
    };

    console.log("\nBroadcasting subscription to Somnia Registry...");
    
    try {
        const { request: callRequest } = await publicClient.simulateContract({
            account,
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: "register",
            args: [request],
            value: parseEther("32")
        });

        const hash = await walletClient.writeContract(callRequest);
        console.log(`\n✅ SUCCESS! Neural Receptor Active.`);
        console.log(`Transaction Hash: ${hash}`);
        console.log("\n------------------------------------------");
        console.log("YOUR VAULT IS NOW REACTIVE.");
        console.log("Run 'node simulate_attack.js' to test the firewall instantly.");
        console.log("------------------------------------------");

    } catch (error) {
        console.error("\n❌ SUBSCRIPTION FAILED:", error.message);
        console.log("\nNOTE: If the Registry address is outdated, ensure you use the latest Somnia SDK.");
    }
}

main().catch(console.error);
