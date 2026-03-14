import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, RefreshCw, Activity, Terminal, ExternalLink } from 'lucide-react';
import './App.css';

const CONTRACT_ADDRESS = '0x1C6f83CFdAa5495B21bAE8E3982bdC373029EeC0';

const ABI = [
  {"inputs":[],"name":"currentDefcon","outputs":[{"internalType":"enum FluxVault.DefconLevel","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"threatThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"resetVault","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"panicRescue","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"manualPause","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"unlockTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

const DEFCON_CONFIG = {
  0: { label: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', glow: '0 0 20px rgba(16, 185, 129, 0.4)', description: 'System integrity optimal. Shield active.' },
  1: { label: 'ELEVATED', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', glow: '0 0 20px rgba(245, 158, 11, 0.4)', description: 'Anomalous transfer detected. Withdrawal limits imposed.' },
  2: { label: 'HIGH', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', glow: '0 0 20px rgba(249, 115, 22, 0.4)', description: 'High-risk exploit signature matched. Vault frozen.' },
  3: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', glow: '0 0 20px rgba(239, 68, 68, 0.4)', description: 'MASSIVE EXPLOIT DETECTED. AUTO-RESCUE INITIATED.' }
};

export default function App() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [logs, setLogs] = useState([]);

  // Contract Reads (v2 hook names)
  const { data: defconLevel, refetch: refetchDefcon } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'currentDefcon' });
  const { data: isPaused, refetch: refetchPaused } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'paused' });
  const { data: threshold } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'threatThreshold' });
  const { data: unlockTime } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'unlockTime' });

  const defcon = DEFCON_CONFIG[defconLevel] || DEFCON_CONFIG[0];

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (isConnected) addLog(`Neural link established: ${address?.slice(0, 6)}...${address?.slice(-4)}`, 'success');
  }, [isConnected, address]);

  // Contract Writes (v2 Hook patterns)
  const { writeContract: executeWrite, data: hash } = useWriteContract();

  const handleDeposit = () => {
    executeWrite({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'deposit',
      value: parseEther(amount || '0')
    }, {
      onSuccess: () => addLog('Deposit sequence initiated...', 'info'),
      onError: (e) => addLog(`Deposit failed: ${e.message.split('\n')[0]}`, 'error'),
    });
  };

  const handleWithdraw = () => {
    executeWrite({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'withdraw',
      args: [parseEther(amount || '0')]
    }, {
      onSuccess: () => addLog('Withdrawal sequence initiated...', 'info'),
    });
  };

  const handleReset = () => {
    executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'resetVault' });
  };

  const handlePanic = () => {
    executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'panicRescue' });
  };

  return (
    <div className="app-container" style={{ '--accent': defcon.color }}>
      <div className="grid-overlay" />
      <div className="scanline" />

      {/* Header */}
      <header className="main-header">
        <div className="logo-section">
          <Shield className="logo-icon" size={32} />
          <div className="logo-text">
            <h1>SOMNIA<span>FLUX</span></h1>
            <p>AUTONOMOUS REACTIVE FIREWALL</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <Activity size={16} />
            <span>SHANNON TESTNET: ONLINE</span>
          </div>
          <div className="stat-item connection">
            <div className={`status-dot ${isConnected ? 'active' : ''}`} />
            <span>{isConnected ? 'NODE LINKED' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </header>

      <main className="dashboard">
        {/* Left Column: Status & Shield */}
        <section className="dashboard-column status-column">
          <motion.div 
            className="shield-card"
            animate={{ 
              boxShadow: defcon.glow,
              borderColor: defcon.color
            }}
          >
            <div className="defcon-ring">
              <motion.div 
                className="ring-inner"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <Shield className="shield-icon" size={64} color={defcon.color} />
            </div>
            <div className="status-info">
              <h2 style={{ color: defcon.color }}>DEFCON {Number(defconLevel ?? 0) + 1}: {defcon.label}</h2>
              <p>{defcon.description}</p>
            </div>
            <div className="security-badges">
              <div className={`badge ${isPaused ? 'warning' : 'secure'}`}>
                {isPaused ? <Lock size={14} /> : <Unlock size={14} />}
                {isPaused ? 'SYSTEM PAUSED' : 'LIVE MONITORING'}
              </div>
              <div className="badge gasless">
                <Zap size={14} /> ZERO-GAS REACTIVITY
              </div>
            </div>
          </motion.div>

          {/* Terminal / Logs */}
          <div className="terminal-container">
            <div className="terminal-header">
              <Terminal size={14} />
              <span>LIVE RECEPTOR LOGS</span>
            </div>
            <div className="terminal-content">
              <AnimatePresence>
                {logs.map(log => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`log-entry ${log.type}`}
                  >
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-msg">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="terminal-cursor" />
            </div>
          </div>
        </section>

        {/* Right Column: Actions */}
        <section className="dashboard-column actions-column">
          {/* Main Controls */}
          <div className="action-card main-controls">
            <h3>VAULT INTERACTOR</h3>
            <div className="input-group">
              <input 
                type="number" 
                placeholder="AMOUNT (STT)" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="button-row">
                <button onClick={handleDeposit} className="btn-primary">
                  <ArrowDownCircle size={18} /> DEPOSIT
                </button>
                <button onClick={handleWithdraw} className="btn-secondary">
                  <ArrowUpCircle size={18} /> WITHDRAW
                </button>
              </div>
            </div>
          </div>

          {/* Emergency Panel */}
          <div className="action-card emergency-controls">
            <h3 className="warning-text"><AlertTriangle size={16} /> OVERRIDE PROTOCOLS</h3>
            <div className="button-grid">
              <button 
                onClick={handleReset} 
                className="btn-outline"
                title="Reset Defcon level and re-enable withdrawals (24h cooldown)"
              >
                <RefreshCw size={18} /> RESET SYSTEM
              </button>
              <button 
                onClick={handlePanic} 
                className="btn-danger"
                title="Immediate rescue of all funds to cold storage"
              >
                <Shield size={18} /> PANIC RESCUE
              </button>
            </div>
            <div className="info-box">
              <p>THRESHOLD: <span>{threshold ? formatEther(threshold) : '...' } STT</span></p>
              <p>COOLDOWN: <span>{unlockTime && Number(unlockTime) > 0 ? new Date(Number(unlockTime) * 1000).toLocaleString() : 'CLEAR'}</span></p>
            </div>
          </div>

          {/* Link Section */}
          <div className="link-cards">
            <a href={`https://dream-explorer.somnia.network/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" className="explorer-link">
              EXPLORER <ExternalLink size={14} />
            </a>
            <div className="reactive-badge">
              POWERED BY SOMNIA REACTIVITY
            </div>
          </div>
        </section>
      </main>

      {/* Footer Branding */}
      <footer className="footer">
        <div className="footer-line" />
        <p>© 2026 SOMNIA FLUX PROTOCOL // PROGRAMMABLE SECURITY LAYER</p>
      </footer>
    </div>
  );
}
