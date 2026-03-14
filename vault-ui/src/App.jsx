import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent, useConnect, useDisconnect } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, RefreshCw, Activity, Terminal, ExternalLink, Settings, Brain, Globe, Info, Fingerprint, Power } from 'lucide-react';
import './App.css';

const CONTRACT_ADDRESS = '0x2f1ca27ebca50119ddd20920ad2ddb9d551c8b5e';

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

  const [amount, setAmount] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab ] = useState('DASHBOARD');
  const [lastAttacker, setLastAttacker] = useState('NONE DETECTED');
  const [gasSaved, setGasSaved] = useState(0);

  const { writeContract: executeWrite } = useWriteContract();

  const { data: defconLevel, refetch: refetchDefcon } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'currentDefcon' });
  const { data: isPaused } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'paused' });
  const { data: threshold } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'threatThreshold' });
  const { data: unlockTime } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'unlockTime' });

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

  useEffect(() => { 
    if (isConnected) addLog(`Neural link established with ${address?.slice(0, 8)}...`, 'success');
  }, [isConnected, address]);

  const handleWalletAction = () => {
    if (isConnected) {
      disconnect();
      addLog("Neural link severed.", "error");
    } else {
      connect({ connector: connectors[0] });
    }
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
            { id: 'NETWORK', icon: <Globe size={14}/>, label: 'NODE' }
          ].map(t => (
            <button key={t.id} className={`nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="header-stats">
          <button 
            className={`wallet-btn ${isConnected ? 'active' : ''}`} 
            onClick={handleWalletAction}
          >
            {isConnected ? <Power size={14} /> : <Zap size={14} />}
            <span>{isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'CONNECT WALLET'}</span>
          </button>
        </div>
      </header>

      <main className="dashboard">
        <AnimatePresence mode="wait">
          {activeTab === 'DASHBOARD' && (
            <motion.div key="db" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="dashboard-content">
              <section className="dashboard-column">
                <div className="shield-card" style={{ borderColor: defcon.color, boxShadow: defcon.glow }}>
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
                    {logs.length === 0 ? (
                      <div className="log-placeholder">WAITING FOR NEURAL SIGNALS...</div>
                    ) : (
                      logs.map(l => <div key={l.id} className={`log-entry ${l.type}`}><span className="log-time">{l.time}</span> » {l.msg}</div>)
                    )}
                    <div className="terminal-cursor" />
                  </div>
                </div>
              </section>
              <section className="dashboard-column">
                <div className="action-card">
                  <h3>VAULT TRANSFERS <span style={{ opacity: 0.5, fontSize: '0.66rem', marginLeft: '10px' }}>// THRESHOLD: {formatEther(threshold || 0n)} STT</span></h3>
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
              <div className="action-card">
                <h2>NEURAL POLICY ENGINE</h2>
                <div className="policy-grid">
                  <div className="policy-item">
                    <label>Anomaly Detection Sensitivity</label>
                    <p>Assets will be restricted/rescued if a network transfer exceeds this value.</p>
                    <div className="input-with-button">
                      <input type="number" placeholder="STT Allowance" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} />
                      <button className="btn-primary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'updateThreshold', args: [parseEther(newThreshold || '0')] })}>APPLY POLICY</button>
                    </div>
                  </div>
                  <div className="policy-card-info">
                    <Brain size={30} color={defcon.color} />
                    <div>
                      <h4>Safety Strategy</h4>
                      <p>Auto-Rescue Target Wallet: <br/> <strong>{address || 'DISCONNECTED'}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'NETWORK' && (
            <motion.div key="net" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content single-col">
              <div className="action-card">
                <h2>SOMNIA NETWORK NODE</h2>
                <div className="node-stats">
                  <div className="node-item"><span>Status</span><strong>SYNCHRONIZED</strong></div>
                  <div className="node-item"><span>Chain ID</span><strong>50312</strong></div>
                  <div className="node-item"><span>System Address</span><strong title="Somnia Reactivity Engine">0x841b...4223</strong></div>
                </div>
                <div className="network-map-placeholder"><div className="ping-ring" style={{borderColor: defcon.color}} /><span>LISTENING TO SOMNIA SHANNON EVENT STREAM...</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="footer-stats">
          <div className="health-stat">
            <span>NETWORK HEALTH</span>
            <div className="health-meter">
              <motion.div 
                className="health-fill" 
                animate={{ width: `${defcon.health}%` }} 
                transition={{ type: 'spring', stiffness: 50 }}
                style={{ background: defcon.color, boxShadow: `0 0 10px ${defcon.color}` }}
              />
            </div>
            <span style={{ minWidth: '40px' }}>{defcon.health}%</span>
          </div>
          <div className="node-identity">
            LAST ATTACKER: <span style={{ color: lastAttacker !== 'NONE DETECTED' ? '#ef4444' : '#fff' }}>{lastAttacker === 'NONE DETECTED' ? lastAttacker : `${lastAttacker.slice(0, 10)}...`}</span>
          </div>
          <div className="node-identity">
            GAS SAVED: <span style={{ color: '#10b981' }}>{gasSaved} GWEI</span>
          </div>
        </div>
        <p>© 2026 SOMNIA FLUX // NATIVE REACTIVITY active</p>
      </footer>
    </div>
  );
}
