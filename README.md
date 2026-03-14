# 🌩️ Somnia Flux: Autonomous Neural Firewall

> **Autonomous. Reactive. Zero-Gas.**
> Protecting Total Value Locked (TVL) on the Somnia Shannon Testnet with Real-Time Neural Intelligence.

---

## 🛡️ The Problem: The Block-Time Gap
In traditional DeFi, exploits happen in milliseconds. Human response (multisigs, manual pauses) take minutes or hours. By then, the vault is empty.

## ⚡ The Solution: Somnia Flux
**Somnia Flux** is a sentient security layer. It doesn't just wait for an attack—it monitors the **entire Somnia state network** for anomalies and reacts *before* the attacker can finalize their drain.

### 💎 Key Innovations
- **Neural Protection (Anomaly Detection)**: Unlike standard vaults that only watch their own balance, Somnia Flux monitors global network activity. If a massive drain (e.g., 500+ STT) occurs anywhere on the network, the firewall enters high-alert.
- **Atomic Auto-Rescue**: In a CRITICAL breach, the vault automatically migrates 100% of its assets to a secure cold storage wallet in the same block as the detected threat.
- **Zero-Gas Reactivity**: The Somnia Reactivity Engine triggers the firewall's logic gaslessly, ensuring that peak network congestion never slows down the defense.

---

## 🧩 Security Tiers (DEFCON)

We follow the standard military DEFCON system for clarity:

| Level | State | Trigger Condition | System Response |
| :--- | :--- | :--- | :--- |
| **5** | **SECURE** | Standard Activity | Shield Active |
| **4** | **GUARD** | Large Transfer Detected | 10% Withdrawal Limit Imposed |
| **3** | **SENTINEL** | Sequential Anomalies | **Vault Frozen (Paused)** |
| **1** | **LOCKDOWN** | Massive Drain Detected | **Auto-Rescue: TVL Transferred to Cold Storage** |

---

## 🚀 Live Simulation: How to Test the Shield

To prove the power of Somnia's reactivity, we have provided a simulation script that triggers a global network anomaly.

### 1. The Setup
Ensure your `.env` has your `PRIVATE_KEY` and `VAULT_ADDRESS`.
```bash
npm install
node subscribe.js # Anchors the Neural Receptor to the network
```

### 2. The Attack
Run the simulation script. This script sends a massive anomalous transfer to a burn address to simulate a network-wide liquidity drain.
```bash
node simulate_attack.js
```

### 3. The Result
Watch your **Vite Dashboard**. 
1. The **Neural Map** will shift from Green to Red.
2. The **Receptor Logs** will identify the anomaly depth.
3. The **Auto-Rescue** event will fire, securing your vault's TVL instantly.

---

## 🛠️ Technical Stack
- **Network**: Somnia Shannon Testnet (Chain ID: 50312)
- **Engine**: Somnia Reactivity Engine (@somnia-chain/streams)
- **UI**: Vite + React + Framer Motion (Michroma & Space Grotesk Typography)
- **Library**: Viem + Wagmi

Built for the **Somnia Reactivity Mini Hackathon**.
