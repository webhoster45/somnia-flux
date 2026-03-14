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

async function main() {
    console.log("==========================================");
    console.log("☠️  INITIATING SIMULATED NETWORK ATTACK (Viem) ☠️");
    console.log("==========================================");

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        console.error("❌ PRIVATE_KEY missing in .env");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    console.log("Attacker Wallet:", account.address);

    const publicClient = createPublicClient({
        chain: somniaShannonTestnet,
        transport: http()
    });

    const walletClient = createWalletClient({
        account,
        chain: somniaShannonTestnet,
        transport: http()
    });

    const balanceBefore = await publicClient.getBalance({ address: account.address });
    console.log(`Current Balance: ${formatEther(balanceBefore)} STT`);

    const burnAddress = "0x000000000000000000000000000000000000dEaD";
    const exploitAmountSTT = "5"; 
    const transferAmount = parseEther(exploitAmountSTT);
    
    if (balanceBefore < transferAmount) {
        console.error(`\n❌ INSUFFICIENT FUNDS: You need ${exploitAmountSTT} STT to simulate this exploit!`);
        process.exit(1);
    }

    console.log(`\n🚀 Broadcasting massive anomalous transfer of ${exploitAmountSTT} STT to the network...`);
    console.log("Watch your React Dashboard! It should react to the on-chain event instantly.");

    const hash = await walletClient.sendTransaction({
        to: burnAddress,
        value: transferAmount
    });

    console.log("⏳ Transaction broadcast! Hash:", hash);
    console.log("Waiting for confirmation...");

    await publicClient.waitForTransactionReceipt({ hash });

    console.log(`\n✅ Exploit Transfer Confirmed!`);
    console.log("The Somnia Reactivity Engine is now parsing the block data...");
    console.log("Check the frontend dashboard to see the Auto-Rescue execute ZERO-GAS!");
}

main().catch(console.error);
