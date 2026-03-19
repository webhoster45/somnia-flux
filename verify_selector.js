import { getFunctionSelector } from "viem";

const selector = getFunctionSelector("onEvent(address,bytes32[],bytes)");
console.log(`Selector: ${selector}`);
