import { privateKeyToAccount } from "viem/accounts";
const pk = "0x" + "f7edf5ecea0791d9bd017aa734d54258b571e1aaaf621334129914a146a08667".replace("0x", "");
const account = privateKeyToAccount(pk);
console.log(account.address);
