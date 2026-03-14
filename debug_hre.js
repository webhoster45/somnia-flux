import hre from "hardhat";

async function main() {
    console.log("HRE check:");
    console.log("Keys in HRE:", Object.keys(hre));
    if (hre.ethers) {
        console.log("Ethers is present in HRE");
    } else {
        console.log("Ethers is MISSING in HRE");
    }
}

main().catch(console.error);
