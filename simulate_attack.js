import hre from "hardhat";
const { ethers } = hre;
import { createPublicClient, http, parseEther, formatEther } from "viem";

async function main() {
    // This script mocks a "Whale Alert" or "Exploit" on the Somnia Testnet by
    // transferring a massive amount of STT, which the Reactivity Engine will pick up
    // and route gaslessly to your FluxVault to trigger the Auto-Rescue.

    const [attacker] = await hre.ethers.getSigners();
    
    console.log("==========================================");
    console.log("☠️  INITIATING SIMULATED NETWORK ATTACK ☠️");
    console.log("Attacker Wallet:", attacker.address);
    console.log("==========================================");

    // We generate a random "burn" address to send funds to, mimicking a hacker moving assets.
    // In a real demo, you're just moving STT from yourself to a random address.
    const burnAddress = "0x000000000000000000000000000000000000dEaD";

    // Grab the baseline threshold from your environment/Vault.
    // If your threshold is 50 STT, a transfer of 250 STT (5x) triggers the CRITICAL Defcon.
    // Ensure the deployer wallet actually has this much STT to spend for the demo!
    const exploitAmountSTT = "260"; 
    const transferAmount = parseEther(exploitAmountSTT);

    const balanceBefore = await hre.ethers.provider.getBalance(attacker.address);
    console.log(`Current Balance: ${formatEther(balanceBefore)} STT`);
    
    if (balanceBefore < transferAmount) {
        console.error(`\n❌ INSUFFICIENT FUNDS: You need ${exploitAmountSTT} STT to simulate this exploit!`);
        console.log("For the hackathon demo, ensure your connected wallet is heavily funded from the faucet.");
        process.exit(1);
    }

    console.log(`\n🚀 Broadcasting massive anomalous transfer of ${exploitAmountSTT} STT to the network...`);
    console.log("Watch your React Dashboard! It should react to the on-chain event instantly.");

    const tx = await attacker.sendTransaction({
        to: burnAddress,
        value: transferAmount
    });

    console.log("⏳ Transaction mining...");
    await tx.wait();

    console.log(`\n✅ Exploit Transfer Confirmed! (TxHash: ${tx.hash})`);
    console.log("The Somnia Reactivity Engine is now parsing the block data...");
    console.log("Check the frontend dashboard to see the Auto-Rescue execute ZERO-GAS!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Simulation failed:", error);
        process.exit(1);
    });
