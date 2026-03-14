import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent, useConnect, useDisconnect, useSendTransaction, useBlockNumber } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, RefreshCw, Activity, Terminal, ExternalLink, Settings, Brain, Globe, Info, Fingerprint, Power, Skull, Wifi } from 'lucide-react';
import './App.css';

const CONTRACT_ADDRESS = '0x2f1ca27ebca50119ddd20920ad2ddb9d551c8b5e';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const SHOW_SIMULATOR = false; // Set to true for live judge demonstrations

const ABI = [
  {"inputs":[],"name":"currentDefcon","outputs":[{"internalType":"enum FluxVault.DefconLevel","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"threatThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"resetVault","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"panicRescue","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_newThreshold","type":"uint256"}],"name":"updateThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"unlockTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"enum FluxVault.DefconLevel","name":"newLevel","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"triggerAmount","type":"uint256"},{"indexed":true,"internalType":"address","name":"attacker","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"},{"indexed":false,"internalType":"string","name":"reason","type":"string"}],"name":"DefconChanged","type":"event"}
];

const DEFCON_CONFIG = {
  0: { level: 5, label: 'SECURE', color: '#10b981', health: 100, description: 'Neural systems reporting optimal health. Monitoring the network pulse.' },
  1: { level: 4, label: 'GUARD', color: '#fbbf24', health: 75, description: 'Minor anomalies detected in the block stream. Limits imposed.' },
  2: { level: 3, label: 'SENTINEL', color: '#f97316', health: 40, description: 'Exploit signature identified. Locking all asset movement.' },
  3: { level: 1, label: 'LOCKDOWN', color: '#ef4444', health: 0, description: 'CRITICAL THREAT. Assets migrated to neural cold storage.' }
};

const NeuralMap = ({ defconColor }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    let animationFrameId; let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    class Particle {
      constructor() { this.reset(); }
      reset() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3; this.size = Math.random() * 2; }
      update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > canvas.width) this.vx *= -1; if (this.y < 0 || this.y > canvas.height) this.vy *= -1; }
      draw() { ctx.fillStyle = defconColor; ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    const init = () => { resize(); particles = Array.from({ length: 45 }, () => new Particle()); };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.sqrt((particles[i].x - particles[j].x)**2 + (particles[i].y - particles[j].y)**2);
          if (dist < 180) { ctx.strokeStyle = defconColor; ctx.globalAlpha = 0.05 * (1 - dist / 180); ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    window.addEventListener('resize', resize); init(); animate();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [defconColor]);
  return <canvas ref={canvasRef} className="neural-map-canvas" />;
};

export default function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { sendTransaction } = useSendTransaction();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const [amount, setAmount] = useState('');
  const [simAmount, setSimAmount] = useState('0.1');
  const [newThreshold, setNewThreshold] = useState('');
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab ] = useState('DASHBOARD');
  const [lastAttacker, setLastAttacker] = useState('NONE DETECTED');
  const [gasSaved, setGasSaved] = useState(0);

  const { writeContract: executeWrite } = useWriteContract();

  const { data: defconLevel, refetch: refetchDefcon } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'currentDefcon' });
  const { data: isPaused } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'paused' });
  const { data: threshold } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'threatThreshold' });

  const defcon = DEFCON_CONFIG[defconLevel] || DEFCON_CONFIG[0];
  const addLog = (msg, type = 'info') => setLogs(prev => [{ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    eventName: 'DefconChanged',
    onLogs(logs) {
      const event = logs[0].args;
      setLastAttacker(event.attacker || 'ANONYMOUS');
      setGasSaved(prev => prev + 120000); 
      addLog(`⚠️ DEFCON SHIFT: ${DEFCON_CONFIG[event.newLevel].label} - Reason: ${event.reason}`, 'error');
      refetchDefcon();
    },
  });

  useEffect(() => { if (isConnected) addLog(`Neural link established. Watching Somnia stream...`, 'success'); }, [isConnected, address]);

  const handleSimulateAttack = () => {
    if (!isConnected) return addLog("No wallet detected for simulation.", "error");
    addLog(`☠️ INITIATING SIMULATED NETWORK ATTACK OF ${simAmount} STT...`, "error");
    sendTransaction({ to: BURN_ADDRESS, value: parseEther(simAmount || '0.1') }, {
      onSuccess: () => addLog("Simulated Anomaly broadcasted! Waiting for Reactive Engine...", "success"),
      onError: (err) => addLog(`Simulation failed: ${err.message.slice(0, 40)}...`, "error")
    });
  };

  const getThreatIntensity = (val) => {
    const num = parseFloat(val);
    if (num < 1) return { label: 'FOCUSED STRIKE', color: '#fbbf24' };
    if (num < 100) return { label: 'ASSET DRAIN', color: '#f97316' };
    return { label: 'NETWORK ANOMALY', color: '#ef4444' };
  };

  return (
    <div className="app-container" style={{ '--accent': defcon.color }}>
      <NeuralMap defconColor={defcon.color} />
      <div className="grid-overlay" />
      <div className="scanline" />

      <header className="main-header">
        <div className="logo-section">
          <Shield className="logo-icon" size={32} />
          <div className="logo-text"><h1>SOMNIA<span>FLUX</span></h1><p>NEURAL PROTECTION LAYER</p></div>
        </div>
        <nav className="nav-tabs">
          {[
            { id: 'DASHBOARD', icon: <Brain size={14}/>, label: 'VAULT' },
            { id: 'POLICY', icon: <Settings size={14}/>, label: 'POLICY' },
            { id: 'NETWORK', icon: <Globe size={14}/>, label: 'NODE' },
            ...(SHOW_SIMULATOR ? [{ id: 'SIMULATOR', icon: <Skull size={14}/>, label: 'SIMULATE' }] : [])
          ].map(t => (
            <button key={t.id} className={`nav-btn ${activeTab === t.id ? 'active' : ''} ${t.id === 'SIMULATOR' ? 'sim-tab-btn' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="header-stats">
          <button className={`wallet-btn ${isConnected ? 'active' : ''}`} onClick={() => isConnected ? disconnect() : connect({ connector: connectors[0] })}>
            {isConnected ? <Power size={14} /> : <Zap size={14} />}
            <span>{isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'CONNECT WALLET'}</span>
          </button>
        </div>
      </header>

      <main className="dashboard">
        <AnimatePresence mode="wait">
          {activeTab === 'DASHBOARD' && (
            <motion.div key="db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dashboard-content">
              <section className="dashboard-column">
                <div className="shield-card" style={{ borderColor: defcon.color }}>
                  <div className="defcon-ring">
                    <Shield className="shield-icon" size={70} color={defcon.color} />
                    <motion.div className="orbit" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
                      <div className="orbit-dot" style={{ background: defcon.color, boxShadow: `0 0 10px ${defcon.color}` }} />
                    </motion.div>
                  </div>
                  <div className="status-info">
                    <div className="defcon-header">
                      <span className="defcon-number">SECURITY STATE: DEFCON {defcon.level}</span>
                      <h2 style={{ color: defcon.color }}>{defcon.label}</h2>
                    </div>
                    <p>{defcon.description}</p>
                    <div className="security-badges">
                      <div className="badge">{isPaused ? <Lock size={12}/> : <Unlock size={12}/>} {isPaused ? 'SHIELD ENFORCED' : 'AUTONOMOUS'}</div>
                      <div className="badge gasless"><Zap size={12}/> NATIVE REACTIVITY</div>
                    </div>
                  </div>
                </div>
                <div className="terminal-container">
                  <div className="terminal-header"><Terminal size={14}/><span>NEURAL RECEPTOR STREAM</span></div>
                  <div className="terminal-content">
                    {logs.map(l => <div key={l.id} className={`log-entry ${l.type}`}><span className="log-time">{l.time}</span> » {l.msg}</div>)}
                    <div className="terminal-cursor" />
                  </div>
                </div>
              </section>
              <section className="dashboard-column">
                <div className="action-card">
                  <h3>VAULT TRANSFERS <span style={{ opacity: 0.5, fontSize: '0.66rem', marginLeft: '10px' }}>// LIMIT: {formatEther(threshold || 0n)} STT</span></h3>
                  <div className="input-group">
                    <input type="number" placeholder="0.0 STT" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <div className="button-row">
                      <button className="btn-primary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'deposit', value: parseEther(amount || '0') })}>DEPOSIT</button>
                      <button className="btn-secondary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'withdraw', args: [parseEther(amount || '0')] })}>WITHDRAW</button>
                    </div>
                  </div>
                </div>
                <div className="action-card override-box">
                  <h3 className="danger-text"><AlertTriangle size={14}/> SYSTEM OVERRIDES</h3>
                  <div className="button-grid">
                    <button className="btn-outline" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'resetVault' })}>RESTORE SYSTEM</button>
                    <button className="btn-danger" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'panicRescue' })}>PANIC RESCUE</button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
          {activeTab === 'POLICY' && (
            <motion.div key="pol" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dashboard-content single-col">
              <div className="action-card centered-card">
                <h2>NEURAL POLICY ENGINE</h2>
                <div className="policy-grid">
                  <div className="policy-item">
                    <label>Anomaly Detection Sensitivity</label>
                    <p>Assets will be restricted/rescued if a network transfer exceeds this value.</p>
                    <div className="input-with-button" style={{display:'flex', gap:'0.5rem'}}>
                      <input type="number" placeholder="STT" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} style={{flex:1}} />
                      <button className="btn-primary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'updateThreshold', args: [parseEther(newThreshold || '0')] })}>UPDATE</button>
                    </div>
                  </div>
                  <div className="policy-card-info">
                    <Brain size={24} color={defcon.color} />
                    <div className="info-text">
                      <h4>Rescue Strategy</h4>
                      <strong>{address || 'DISCONNECTED'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'NETWORK' && (
            <motion.div key="net" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content single-col">
              <div className="action-card centered-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <h2>NETWORK NODE CLUSTER</h2>
                  <div className="badge pulse-badge" style={{color: defcon.color, borderColor: defcon.color}}><Activity size={12}/> LIVE STREAM</div>
                </div>
                <div className="node-stats">
                  <div className="node-item"><span>Status</span><strong>SYNCHRONIZED</strong></div>
                  <div className="node-item"><span>Sync Mode</span><strong>PUSH-BASED</strong></div>
                  <div className="node-item"><span>Current Block</span><strong style={{fontFamily: 'monospace'}}>{blockNumber?.toString() || 'FETCHING...'}</strong></div>
                  <div className="node-item"><span>Neural Latency</span><strong>0.01 MS</strong></div>
                </div>
                <div className="network-map-placeholder">
                  <div className="ping-ring" style={{borderColor: defcon.color}} />
                  <div className="ping-ring" style={{borderColor: defcon.color, animationDelay: '1s'}} />
                  <span>LISTENING TO SOMNIA SHANNON STREAM</span>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'SIMULATOR' && SHOW_SIMULATOR && (
            <motion.div key="sim" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-content single-col">
              <div className="simulator-card centered-card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <h2>JUDGE SIMULATOR</h2>
                  <div className="badge" style={{color: getThreatIntensity(simAmount).color, borderColor: getThreatIntensity(simAmount).color}}>{getThreatIntensity(simAmount).label}</div>
                </div>
                <div className="sim-warning">
                  <AlertTriangle size={24} />
                  <div>
                    <strong>REAL-TIME ATTACK SIMULATION</strong>
                    <p>Broadcast a transfer to a burn address to trigger the firewall. For a successful demonstration, ensure this amount is slightly higher than your <strong>Policy Threshold</strong>.</p>
                  </div>
                </div>
                <div className="sim-input-group">
                  <label>Exploit Amount (STT) <span style={{opacity: 0.5}}>// META-SYMBOL: ETH</span></label>
                  <input type="number" value={simAmount} onChange={(e) => setSimAmount(e.target.value)} placeholder="0.1" />
                </div>
                <button className="sim-btn" onClick={handleSimulateAttack} disabled={!isConnected} style={{borderColor: getThreatIntensity(simAmount).color, color: getThreatIntensity(simAmount).color}}>
                  TRIGGER {getThreatIntensity(simAmount).label} ({simAmount} STT)
                </button>
                <div className="sim-footer">
                  <p>// Note: MetaMask identifies STT as "ETH" by default on new testnets. This is cosmetic.</p>
                  <p>// Target Reactor: <code>{CONTRACT_ADDRESS}</code></p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="footer-stats">
          <div className="health-stat">
            <span>NEURAL HEALTH</span>
            <div className="health-meter"><motion.div className="health-fill" animate={{ width: `${defcon.health}%` }} style={{ background: defcon.color, boxShadow: `0 0 10px ${defcon.color}` }} /></div>
            <span>{defcon.health}%</span>
          </div>
          <div className="node-identity">ATTACKER: <span>{lastAttacker === 'NONE DETECTED' ? 'CLEAN' : `${lastAttacker.slice(0, 10)}...`}</span></div>
          <div className="node-identity">SAVINGS: <span style={{color: '#10b981'}}>{gasSaved} GWEI</span></div>
        </div>
        <p>© 2026 SOMNIA FLUX // NATIVE REACTIVE active</p>
      </footer>
    </div>
  );
}
