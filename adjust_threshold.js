import { createPublicClient, createWalletClient, http, parseEther, formatEther, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";
import fs from "fs";
import path from "path";

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
    try {
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        const VAULT_ADDRESS = getAddress(process.env.VAULT_ADDRESS.trim());

        console.log(`Vault Address: ${VAULT_ADDRESS}`);

        const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
        const publicClient = createPublicClient({ chain: somniaShannonTestnet, transport: http() });
        const walletClient = createWalletClient({ account, chain: somniaShannonTestnet, transport: http() });

        console.log("Loading ABI from artifact...");
        const artifactPath = path.resolve("./artifacts/contracts/FluxVault.sol/FluxVault.json");
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

        console.log("Current Threshold Checking...");
        const currentThreshold = await publicClient.readContract({
            address: VAULT_ADDRESS,
            abi: artifact.abi,
            functionName: 'threatThreshold'
        });
        console.log(`Current Threshold: ${formatEther(currentThreshold)} STT`);

        console.log("Setting Threshold to 1 STT for testing...");
        const { request } = await publicClient.simulateContract({
            account,
            address: VAULT_ADDRESS,
            abi: artifact.abi,
            functionName: 'updateThreshold',
            args: [parseEther("1")]
        });

        const hash = await walletClient.writeContract(request);
        console.log(`Transaction Hash: ${hash}`);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log("✅ Threshold updated to 1 STT");
    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    }
}

main();
