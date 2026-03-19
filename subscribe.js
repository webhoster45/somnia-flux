import { createPublicClient, createWalletClient, http, parseEther, formatEther, getAddress } from "viem";
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
        default: { http: ["https://api.infra.testnet.somnia.network/"] },
        public: { http: ["https://api.infra.testnet.somnia.network/"] },
    },
};

// Somnia Reactivity Precompile Address (Shannon Testnet)
const PRECOMPILE_ADDRESS = getAddress("0x0000000000000000000000000000000000000100");
const PRECOMPILE_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "bytes32[4]", "name": "eventTopics", "type": "bytes32[4]" },
                    { "internalType": "address", "name": "origin", "type": "address" },
                    { "internalType": "address", "name": "caller", "type": "address" },
                    { "internalType": "address", "name": "emitter", "type": "address" },
                    { "internalType": "address", "name": "handlerContractAddress", "type": "address" },
                    { "internalType": "bytes4", "name": "handlerFunctionSelector", "type": "bytes4" },
                    { "internalType": "uint64", "name": "priorityFeePerGas", "type": "uint64" },
                    { "internalType": "uint64", "name": "maxFeePerGas", "type": "uint64" },
                    { "internalType": "uint64", "name": "gasLimit", "type": "uint64" },
                    { "internalType": "bool", "name": "isGuaranteed", "type": "bool" },
                    { "internalType": "bool", "name": "isCoalesced", "type": "bool" }
                ],
                "internalType": "struct SubscriptionData",
                "name": "subData",
                "type": "tuple"
            }
        ],
        "name": "subscribe",
        "outputs": [
            { "internalType": "uint256", "name": "subscriptionId", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function main() {
    console.log("==========================================");
    console.log("🚀 ACTIVATING NEURAL RECEPTOR (SUBSCRIPTION) V2");
    console.log("==========================================");

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

    if (!PRIVATE_KEY || !VAULT_ADDRESS) {
        console.error("❌ ERROR: PRIVATE_KEY or VAULT_ADDRESS missing in .env");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    const CLEAN_VAULT_ADDRESS = getAddress(VAULT_ADDRESS.trim());
    
    const publicClient = createPublicClient({ chain: somniaShannonTestnet, transport: http(undefined, { timeout: 60000 }) });
    const walletClient = createWalletClient({ account, chain: somniaShannonTestnet, transport: http(undefined, { timeout: 60000 }) });

    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Wallet Balance: ${formatEther(balance)} STT`);

    if (balance < parseEther("32.1")) {
        console.error("❌ INSUFFICIENT FUNDS: Reactivity subscription requires owner to hold 32 STT fee + gas.");
        process.exit(1);
    }

    console.log(`\nNeural Anchor: ${VAULT_ADDRESS}`);

    // The function selector for onEvent(address,bytes32[],bytes) is 0x53edf33d
    const transferEvent = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const emptyTopic = "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    const subData = {
        eventTopics: [transferEvent, emptyTopic, emptyTopic, emptyTopic],
        origin: "0x0000000000000000000000000000000000000000",
        caller: "0x0000000000000000000000000000000000000000",
        emitter: "0x0000000000000000000000000000000000000000",
        handlerContractAddress: CLEAN_VAULT_ADDRESS,
        handlerFunctionSelector: "0x53edf33d", // onEvent(address,bytes32[],bytes)
        priorityFeePerGas: 0n,         // Recommended default
        maxFeePerGas: 10000000000n,    // 10 gwei
        gasLimit: 3000000n,            // Safe limit
        isGuaranteed: true,
        isCoalesced: false
    };

    console.log("\nBroadcasting subscription to Somnia Precompile (0x100)...");
    
    try {
        const { request: callRequest } = await publicClient.simulateContract({
            account,
            address: PRECOMPILE_ADDRESS,
            abi: PRECOMPILE_ABI,
            functionName: "subscribe",
            args: [subData]
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
    }
}

main().catch(console.error);
