# 🌩️ Somnia Flux: The Neural Protection Layer

[![Somnia Network](https://img.shields.io/badge/Somnia-Shannon--Testnet-blueviolet)](https://somnia.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Reactivity: Active](https://img.shields.io/badge/Reactivity-Native%20Enabled-green)](https://somnia.network)

> **Autonomous. Reactive. Secure.**
> Protecting capital on the Somnia Shannon Testnet with real-time neural intelligence.

---

## 🛡️ The Core Innovation

In DeFi, exploits happen at block speed. Traditional security (manual pauses, multisig bots) suffers from the **"Response Latency Gap"**—by the time a threat is noticed, the vault is empty.

**Somnia Flux** closes this gap by using **Somnia's Native Reactivity**. It transforms your smart contract from a passive container into an active immune system that listens to the network's pulse and reacts *block-atomically*.

---

## 📡 Live Deployment

| Parameter | Value |
| :--- | :--- |
| **Network** | Somnia Shannon Testnet (Chain ID: `50312`) |
| **Vault Address** | `0x42052bcaf7c305f458d9c52428a31881d74768ce` |
| **Reactivity Registry** | `0x0000000000000000000000000000000000000101` |
| **Engine Callback Address** | `0x0000000000000000000000000000000000000100` |
| **RPC URL** | `https://dream-rpc.somnia.network` |

---

## ⚡ Technical Superpowers

### 🧠 1. Neural Anomaly Detection
`FluxVault` subscribes to a global stream of native transfers via Somnia's Reactivity Registry. When the Somnia Engine detects an anomaly (large drain, exploit signature), it calls `onEvent()` on the vault block-atomically.

### 🚀 2. Zero-Gas Autonomous Defense
The Somnia Reactivity Engine pushes events directly to the vault:
- **No Bots Required:** The network itself triggers the defense.
- **Zero-Gas Mitigation:** The attacker's transaction triggers the code that stops them.
- **Congestion Immunity:** Defense logic is prioritized alongside the event execution.

### 🔴 3. Atomic Auto-Rescue Sequence
On a **CRITICAL** threat, the vault doesn't just lock—it autonomously migrates 100% of TVL to a secure **Neural Cold Storage** wallet in the same block.

---

## 🛸 DEFCON Matrix

| Level | Status | Policy | Response |
| :--- | :--- | :--- | :--- |
| **DEFCON 5** | 🟢 SECURE | Open | Monitoring the network pulse. Optimal health. |
| **DEFCON 4** | 🟡 ELEVATED | Alert | Large transfer detected. Withdrawals capped at 10% TVL. |
| **DEFCON 3** | 🟠 HIGH | Locked | Exploit match. All asset movement frozen. |
| **DEFCON 1** | 🔴 CRITICAL | Rescue | Massive drain. **TVL auto-migrated to cold storage.** |

---

## 🛠️ Developer Setup

### Prerequisites
Add to your `.env`:
```
PRIVATE_KEY=your_wallet_private_key
VAULT_ADDRESS=0x42052bcaf7c305f458d9c52428a31881d74768ce
```

### Redeployment (if needed)
```bash
npx hardhat compile
node deploy.js
```

### Activate Neural Receptor (Reactivity Subscription)
```bash
node subscribe.js
```
> Requires **32.1 STT** (32 for registry fee + gas). Get testnet STT from the [Somnia Faucet](https://faucet.somnia.network/).

### Threshold Adjustment for Demo
```bash
node adjust_threshold.js   # Sets threshold to 1 STT for easy testing
```

### Attack Simulation

**Option 1 — UI Simulator (instant feedback):**
Open the `SIMULATE` tab in the dashboard and click the button. MetaMask will confirm two transactions:
1. A real STT burn to the dead address (triggers the Somnia Reactive Engine)
2. A direct `simulateAttack()` call that updates the on-chain DEFCON level immediately

**Option 2 — CLI:**
```bash
node simulate_attack.js
```

---

## 🏗️ System Architecture

```
User Action → STT Transfer → Somnia Network
                                  │
                    Reactivity Engine (0x...0100) detects event
                                  │
                                  ▼ calls onEvent()
                          FluxVault Smart Contract
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
          ≥ threshold        ≥ 2x threshold      ≥ 5x threshold
              │                   │                   │
        DEFCON ELEVATED      DEFCON HIGH        CRITICAL + Auto-Rescue
```

---

## 🔑 Key Addresses (Shannon Testnet)

- **Reactivity Registry** (register subscriptions): `0x0000000000000000000000000000000000000101`
- **Somnia Engine** (callback `msg.sender`): `0x0000000000000000000000000000000000000100`
- **Multicall3** (infra only, NOT the registry): `0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223`

> **Note**: The `onlySomniaEngine` modifier strictly checks for `0x...0100`. The `simulateAttack(uint256 amount)` owner-function mirrors this logic for demo purposes without waiting for the engine.

---

## 💎 Built for the Somnia Reactivity Hackathon

Somnia Flux proves on-chain security can be proactive, autonomous, and blazing fast. By leveraging native reactivity, we've built a vault that doesn't just survive—it fights back.

---
© 2026 Somnia Flux // Powered by Somnia Shannon Testnet
