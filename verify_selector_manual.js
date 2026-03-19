import { keccak256, toHex } from "viem";

const sig = "onEvent(address,bytes32[],bytes)";
const hash = keccak256(Buffer.from(sig));
console.log(`Signature: ${sig}`);
console.log(`Hash: ${hash}`);
console.log(`Selector: ${hash.slice(0, 10)}`);
