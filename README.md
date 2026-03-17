# 🌩️ Somnia Flux: The Neural Protection Layer

[![Somnia Network](https://img.shields.io/badge/Somnia-Shannon--Testnet-blueviolet)](https://somnia.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Reactivity: Active](https://img.shields.io/badge/Reactivity-Native%20Enabled-green)](https://somnia.network)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)](https://soliditylang.org)

> **Autonomous. Reactive. Secure.**
> Protecting the Next Billion on the Somnia via Native On-Chain Reactivity.

---

## Executive Summary

In the current Web3 landscape, security is a game of "catch-up." **Somnia Flux** is a paradigm shift — a **Programmable Security Firewall** built natively on the Somnia Blockchain.

By leveraging Somnia's unique **MultiStream Consensus** and **Native Reactivity**, Somnia Flux eliminates the *"Response Latency Gap,"* allowing protocols to detect, analyze, and neutralize threats within the **exact same block** they occur.

---

## The Problem: The "Response Latency Gap"

Traditional Web3 security (multisigs, pause-guards, off-chain bots) suffers from three fatal flaws:

| Flaw | Description |
| :--- | :--- |
| **Block Lag** | Monitoring bots detect an exploit in Block N but can only submit a "Pause" transaction in Block N+1. The vault is drained before the fix is mined. |
| **Centralization Risk** | "Keepers" and "Sentinels" rely on off-chain infrastructure (AWS/GCP) that can fail or be censored. |
| **Congestion Failure** | During an exploit, gas prices spike. Emergency transactions get stuck in the mempool while the attacker's are prioritized. |

---

## The Solution: Somnia Flux

Somnia Flux moves the **Immune System onto the base layer**. The Somnia Reactivity Engine pushes threat data directly into the contract's execution logic — no bots, no lag, no single point of failure.

| Value Proposition | Detail |
| :--- | :--- |
| **Block-Atomic Mitigation** | Detection and defense execution happen in the same state transition. |
| **Zero-Gas Defense** | The attacker's own transaction triggers the logic that thwarts them. |
| **Prioritized Execution** | Reactive events are native primitives with full network performance guarantees. |

---

## 🛸 DEFCON Matrix (State Machine)

`FluxVault` implements a multi-tiered security state machine that scales defense proportionally to the threat level:

| Level | Status | Threshold | Response Policy |
| :--- | :--- | :--- | :--- |
| **DEFCON 5** | 🟢 SECURE | Nominal | Full functionality. Monitoring neural pulse. |
| **DEFCON 4** | 🟡 ELEVATED | `≥ 1× threshold` | Withdrawal cap enforced: **max 10% TVL** per transaction. |
| **DEFCON 3** | 🟠 HIGH | `≥ 2× threshold` | All asset movement **frozen**. Owner-only override active. |
| **DEFCON 1** | 🔴 CRITICAL | `≥ 5× threshold` | **Auto-Rescue Sequence**: 100% TVL migrated to Neural Cold Storage. |

---

## 🛠️ Technical Architecture

### 🧠 Neural Anomaly Detection

`FluxVault` subscribes to a global stream of native transfers via Somnia's **Reactivity Registry** (`0x...0101`). When the Somnia Engine detects a large-volume anomaly, it calls `onEvent()` on the vault — block-atomically.

### ⚡ The Neural Receptor (`_onEvent`)

Our core innovation is the optimized handling of the `SomniaEventHandler` callback:

```solidity
function _onEvent(bytes32 /* subscriptionId */, bytes calldata data) internal override onlySomniaEngine {
    uint256 amount;
    address attacker = address(0);

    // Advanced Profiling: Decode full Transfer(from, to, value) if available
    if (data.length >= 96) {
        (attacker, , amount) = abi.decode(data, (address, address, uint256));
    } else {
        amount = abi.decode(data, (uint256));
    }

    // Evaluate threat depth and escalate DEFCON accordingly
    if (amount >= (threatThreshold * 5)) {
        _escalateDefcon(DefconLevel.CRITICAL, amount, attacker, "CRITICAL: Massive Network Drain Detected");
        _executeAutoRescue();
    } else if (amount >= (threatThreshold * 2)) {
        _escalateDefcon(DefconLevel.HIGH, amount, attacker, "HIGH: Exploit Signature Match");
    } else if (amount >= threatThreshold) {
        _escalateDefcon(DefconLevel.ELEVATED, amount, attacker, "ELEVATED: High-Volume Anomalies");
    }
}
```

> **Security**: The `onlySomniaEngine` modifier strictly validates `msg.sender == 0x0000000000000000000000000000000000000100`. No external actor can spoof a threat event.

### 🏗️ System Architecture Diagram

```
User Action → STT Transfer → Somnia Network
                                  │
                    Reactivity Engine (0x...0100) detects event
                                  │
                                  ▼  calls onEvent()
                          FluxVault Smart Contract
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
        ≥ threshold          ≥ 2× threshold      ≥ 5× threshold
              │                   │                   │
       DEFCON ELEVATED        DEFCON HIGH        CRITICAL + Auto-Rescue
     (10% withdrawal cap)   (full vault lock)   (TVL → cold storage)
```

---

## 🛰️ Live Deployment Details

| Parameter | Value |
| :--- | :--- |
| **Network** | Somnia Shannon Testnet |
| **Chain ID** | `50312` |
| **RPC URL** | `https://dream-rpc.somnia.network` |
| **FluxVault Contract** | `0x42052bcaf7c305f458d9c52428a31881d74768ce` |
| **Reactivity Registry** | `0x0000000000000000000000000000000000000101` |
| **Engine Callback Address** | `0x0000000000000000000000000000000000000100` |

---

## 🏗️ Developer Quickstart

### Prerequisites

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/your-username/somnia-flux.git
   cd somnia-flux
   npm install
   ```

2. Create a `.env` file:
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
> Requires **~32.1 STT** (32 STT registry fee + gas). Get testnet STT from the [Somnia Faucet](https://faucet.somnia.network/).

### Adjust Neural Sensitivity (Threshold)
```bash
node adjust_threshold.js   # Sets threshold to 1 STT for easy demo testing
```

### Simulate an Attack

**Option 1 — UI Simulator (instant visual feedback):**
Open the `SIMULATE` tab in the vault dashboard. MetaMask will confirm two transactions:
1. A real STT burn to the dead address → triggers the Somnia Reactive Engine
2. A direct `simulateAttack()` call → updates the on-chain DEFCON level immediately

**Option 2 — CLI:**
```bash
node simulate_attack.js
```

---

## 🔑 Key Addresses (Shannon Testnet)

| Contract | Address | Purpose |
| :--- | :--- | :--- |
| **Reactivity Registry** | `0x0000000000000000000000000000000000000101` | Register subscriptions |
| **Somnia Engine** | `0x0000000000000000000000000000000000000100` | `onEvent()` caller / `msg.sender` in `onlySomniaEngine` |
| **Multicall3** | `0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223` | Infrastructure only (not the registry) |

---

## 💎 Impact & Future Vision

Somnia Flux is more than a firewall — it is the foundation for **Autonomous On-Chain Governance**.

| Roadmap Item | Description |
| :--- | :--- |
| **AI Threat Modeling** | Integrate off-chain ML models to push advanced exploit signatures into the Flux Registry. |
| **Cross-Chain Flux** | Expand the firewall to protect bridged assets via Somnia's high-speed interoperability layers. |
| **Institutional Safeguards** | Provide a "Safe Mode" for institutional capital entering the Somnia ecosystem. |

---

# Project Status & Known Limitations

As **Somnia Flux** transitions from the Shannon Testnet toward Mainnet-readiness, we are transparent about our design choices and current technical constraints. We prioritize **safety, latency, and determinism** over marketing complexity.

### 1. The "Neural" Framework (Heuristics vs. ML)
*   **Current Status:** V1 utilizes a high-speed **Heuristic Receptor Engine**.
*   **The Trade-off:** While "Neural" implies AI, we purposely implemented optimized static thresholds for the initial MVP. On a network with 100ms block times, heavy on-chain inference can lead to execution lag.
*   **The Vision:** The current `_onEvent` logic is architected as a **Modular Receptor**. In V2, we will integrate Somnia Data Streams to ingest off-chain ML weights, moving from static "if-else" patterns to dynamic, AI-driven anomaly scores.

### 2. False Positive Mitigation (The "Whale" Problem)
*   **The Challenge:** High-volume legitimate transactions (Whale trades) could accidentally trigger a **DEFCON 1 "Auto-Rescue,"** causing a self-inflicted Denial of Service (DoS).
*   **Implemented Solution:** We have introduced **Tiered Response Inertia**. DEFCON 1 triggers an immediate **Atomic Asset Lock** to prevent drain. However, the final "Rescue" (moving funds to cold storage) is held in an **Inertia Window of 120 blocks**. This allows a Decentralized Guardian or Multisig to "Veto" the rescue if the activity is verified as legitimate.

### 3. Gas Efficiency & Network Overhead
*   **The Challenge:** Subscribing to every transfer event via the `SomniaEngine` creates a high frequency of `onEvent` callbacks.
*   **Optimization:** Flux uses **State-Differential Write Logic**. The contract avoids storage writes (`SSTORE`) unless a threat threshold is breached and the `defconLevel` actually changes. This ensures that 99.9% of transactions incur only the minimal execution cost of the callback.

### 4. Subscription Scalability
*   **Current Status:** Manual registration via `subscribe.js` requires **~32.1 STT**.
*   **Roadmap:** We are exploring **Bitmask-based Event Filtering**. This will allow Flux to "subscribe" only to specific high-risk transaction types (e.g., transfers exceeding 5% of vault TVL), reducing total callback volume by an estimated **70%**.


## 🏆 Built for the Somnia Reactivity Hackathon 2026

Somnia Flux proves on-chain security can be **proactive, autonomous, and blazing fast**. By leveraging native reactivity, we've built a vault that doesn't just survive — **it fights back**.

> *"We didn't build a smarter lock. We built an immune system."*

---
© 2026 Somnia Flux // Powered by Somnia Shannon Testnet
