import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther, formatEther } from 'viem';

// Updated ABI matching the new V2 FluxVault with Defcon Levels & Pausing
const FLUX_VAULT_ABI = [
  "function currentDefcon() view returns (uint8)",
  "function threatThreshold() view returns (uint256)",
  "function owner() view returns (address)",
  "function coldStorageWallet() view returns (address)",
  "function paused() view returns (bool)",
  "function updateThreshold(uint256 _newThreshold) external",
  "function resetVault() external",
  "function manualPause() external",
  "function panicRescue() external"
];

// ⚠️ Hackathon Replace: Insert your freshly deployed FluxVault address here
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";

export default function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [inputThreshold, setInputThreshold] = useState("");

  // 1. Read: Defcon Level (0=Normal, 1=Elevated, 2=High, 3=Critical)
  const { data: defconLevelRaw, refetch: refetchDefcon } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FLUX_VAULT_ABI,
    functionName: 'currentDefcon',
  });
  
  const defconLevel = defconLevelRaw !== undefined ? Number(defconLevelRaw) : 0;

  // 2. Read: threatThreshold
  const { data: currentThreshold, refetch: refetchThreshold } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FLUX_VAULT_ABI,
    functionName: 'threatThreshold',
  });

  // 3. Read: isPaused
  const { data: isPaused, refetch: refetchPaused } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FLUX_VAULT_ABI,
    functionName: 'paused',
  });

  // 4. Write actions
  const { writeContract: updateThresholdTx, isPending: isUpdating } = useWriteContract();
  const { writeContract: resetVaultTx, isPending: isResetting } = useWriteContract();
  const { writeContract: rescueTx, isPending: isRescuing } = useWriteContract();

  const handleUpdateThreshold = (e) => {
    e.preventDefault();
    if (!inputThreshold) return;
    updateThresholdTx({
      address: CONTRACT_ADDRESS,
      abi: FLUX_VAULT_ABI,
      functionName: 'updateThreshold',
      args: [parseEther(inputThreshold)],
    });
  };

  const handleResetVault = () => {
    resetVaultTx({
      address: CONTRACT_ADDRESS,
      abi: FLUX_VAULT_ABI,
      functionName: 'resetVault',
    });
  };

  const handlePanicRescue = () => {
    rescueTx({
      address: CONTRACT_ADDRESS,
      abi: FLUX_VAULT_ABI,
      functionName: 'panicRescue',
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refetchDefcon();
        refetchThreshold();
        refetchPaused();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isConnected, refetchDefcon, refetchThreshold, refetchPaused]);

  // Derived styling based on Defcon Level
  const getDefconStyle = () => {
    switch(defconLevel) {
      case 0: return { color: "emerald", label: "DEFCON 5: NORMAL", border: "border-emerald-500", text: "text-emerald-500", shadow: "drop-shadow-[0_0_40px_rgba(52,211,153,0.6)]" };
      case 1: return { color: "yellow", label: "DEFCON 3: ELEVATED", border: "border-yellow-500", text: "text-yellow-500", shadow: "drop-shadow-[0_0_40px_rgba(234,179,8,0.8)]" };
      case 2: return { color: "orange", label: "DEFCON 2: HIGH THREAT", border: "border-orange-500", text: "text-orange-500", shadow: "drop-shadow-[0_0_50px_rgba(249,115,22,0.9)]" };
      case 3: return { color: "red", label: "DEFCON 1: CRITICAL EXPLOIT", border: "border-red-600", text: "text-red-500", shadow: "drop-shadow-[0_0_60px_rgba(220,38,38,1)]" };
      default: return { color: "emerald", label: "SYSTEM SECURE", border: "border-emerald-500", text: "text-emerald-500", shadow: "" };
    }
  };

  const defconUI = getDefconStyle();

  return (
    <div className="min-h-screen bg-neutral-950 text-emerald-400 font-mono p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Dynamic Background Warning based on Pause/Defcon state */}
      <div className={`absolute inset-0 transition-colors duration-1000 -z-10 ${defconLevel > 1 ? 'bg-[radial-gradient(ellipse_at_center,_rgba(120,0,0,0.2)_0%,_transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,_rgba(0,100,50,0.1)_0%,_transparent_70%)]'}`}></div>

      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-12 border-b border-emerald-500/30 pb-6 z-10">
        <div className="mb-4 md:mb-0">
          <h1 className="text-4xl font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">
            SOMNIA FLUX //
          </h1>
          <p className="text-sm text-cyan-500 tracking-widest mt-1">NATIVE EVENT-DRIVEN FIREWALL</p>
        </div>
        
        <div>
          {isConnected ? (
            <button 
              onClick={() => disconnect()}
              className="px-6 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] backdrop-blur-sm"
            >
              DISCONNECT {address?.slice(0,6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="px-6 py-2 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] backdrop-blur-sm font-bold tracking-wider"
            >
              CONNECT NEURAL LINK
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        
        {/* Shield Status Component */}
        <section className={`bg-neutral-900/80 backdrop-blur-md p-8 rounded-2xl flex flex-col items-center justify-center relative shadow-2xl transition-all duration-500 border-2 ${defconUI.border}`}>
          <div className="absolute top-0 right-0 p-4 opacity-50">
            <div className={`w-3 h-3 rounded-full ${defconLevel > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
          </div>
          
          <h2 className="text-xl mb-6 text-neutral-400 tracking-[0.15em] text-center font-semibold">
            REACTIVITY SHIELD
          </h2>
          
          <div className={`w-48 h-48 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${defconUI.border} ${defconLevel > 1 ? 'animate-pulse' : ''} ${defconUI.shadow}`}>
            <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border-2 border-dashed ${defconUI.border} ${defconLevel > 0 ? 'animate-[spin_2s_linear_infinite_reverse]' : 'animate-[spin_10s_linear_infinite]'}`}>
               <div className="animate-none absolute text-center">
                 <span className={`text-2xl font-black tracking-widest ${defconUI.text}`}>
                   {defconUI.label.split(':')[0]}
                 </span>
               </div>
            </div>
          </div>

          <div className="mt-8 text-center w-full">
            <div className="flex justify-between items-center text-xs text-neutral-500 mb-4 px-4 border-b border-neutral-800 pb-2 uppercase tracking-widest">
              <span>Reaction Engine</span>
              <span className="text-cyan-400 font-bold">ZERO-GAS MONITORING</span>
            </div>
            
            <p className={`text-sm mb-4 font-bold tracking-widest ${defconUI.text}`}>
              {defconUI.label.split(':')[1]}
            </p>

            <div className="flex gap-2 w-full justify-center">
                {defconLevel > 0 || isPaused ? (
                <button 
                  onClick={handleResetVault}
                  disabled={isResetting}
                  className="w-1/2 px-4 py-3 bg-neutral-800 border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 transition-all font-bold tracking-widest text-xs uppercase"
                >
                  {isResetting ? 'SYNC...' : 'RESET SHIELD'}
                </button>
                ) : null}

                <button 
                  onClick={handlePanicRescue}
                  disabled={isRescuing}
                  className="w-1/2 px-4 py-3 bg-red-900/30 border border-red-500 text-red-500 hover:bg-red-500/30 transition-all font-bold tracking-widest text-xs uppercase shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  {isRescuing ? 'EXECUTING...' : 'PANIC RESCUE'}
                </button>
            </div>
          </div>
        </section>

        {/* Intent Parameters Component */}
        <section className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-8 rounded-2xl relative shadow-2xl group hover:border-cyan-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-2xl"></div>
          
          <h2 className="text-xl mb-8 text-neutral-400 tracking-[0.15em] font-semibold">
            DYNAMIC THREAT PARAMETERS
          </h2>
          
          <div className="mb-8 bg-black/40 p-6 rounded-xl border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-2 tracking-widest">BASE THRESHOLD (STT)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                {currentThreshold ? formatEther(currentThreshold) : "0.0"}
              </p>
              <span className="text-cyan-600 font-bold">STT</span>
            </div>
            
            <div className="mt-4 space-y-2 text-xs text-neutral-500 font-sans tracking-wide">
                <p className="border-l-2 border-yellow-500/50 pl-2">
                  <span className="text-yellow-500">≥ {currentThreshold ? formatEther(currentThreshold) : "0"} STT:</span> Alerts triggered, 10% withdrawal limits enforced.
                </p>
                <p className="border-l-2 border-orange-500/50 pl-2">
                  <span className="text-orange-500">≥ {currentThreshold ? formatEther(currentThreshold * 2n) : "0"} STT:</span> High Threat, vault frozen entirely.
                </p>
                <p className="border-l-2 border-red-500/50 pl-2">
                  <span className="text-red-500">≥ {currentThreshold ? formatEther(currentThreshold * 5n) : "0"} STT:</span> Exploit Level, initiates Auto-Rescue to Cold Storage.
                </p>
            </div>
          </div>

          <form onSubmit={handleUpdateThreshold} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-3 tracking-widest uppercase">
                Update Base Intent (STT)
              </label>
              <div className="flex shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <input 
                  type="number"
                  step="0.01"
                  value={inputThreshold}
                  onChange={(e) => setInputThreshold(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-neutral-950 border border-emerald-500/40 text-emerald-400 p-4 outline-none focus:border-cyan-400 transition-all font-bold text-lg rounded-l-lg"
                />
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="px-8 bg-cyan-500/10 border-y border-r border-cyan-500 text-cyan-400 hover:bg-cyan-500/30 transition-all font-black tracking-widest rounded-r-lg"
                >
                  {isUpdating ? 'SYNC...' : 'SET'}
                </button>
              </div>
            </div>
            <div className="pt-2">
               <span className="inline-block bg-neutral-800 text-neutral-400 text-[10px] px-2 py-1 rounded tracking-wider border border-neutral-700">
                 SOMNIA REACTIVITY POWERED
               </span>
            </div>
          </form>
        </section>

      </main>
      
      {/* Footer / Info */}
      <footer className="w-full max-w-5xl mt-16 text-center text-neutral-600 text-[10px] sm:text-xs border-t border-neutral-800 pt-8 z-10 flex flex-col md:flex-row justify-between items-center tracking-widest">
        <div className="mb-2 md:mb-0">
          <span className="text-neutral-500">NETWORK:</span> SOMNIA SHANNON TESTNET <span className="text-emerald-700 ml-2">ID_50312</span>
        </div>
        <div>
          <span className="text-neutral-500">ENGINE_ADDR:</span> 0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223
        </div>
      </footer>
    </div>
  );
}
