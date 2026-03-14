import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, RefreshCw, Activity, Terminal, ExternalLink, Settings, Brain, Globe, Info } from 'lucide-react';
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
  {"inputs":[],"name":"unlockTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// Industry Standard Defcon Mapping (5 is Safe, 1 is Crisis)
const DEFCON_CONFIG = {
  0: { level: 5, label: 'SECURE', color: '#10b981', glow: '0 0 40px rgba(16, 185, 129, 0.4)', description: 'System integrity optimal. Shield active and monitoring network streams.' },
  1: { level: 4, label: 'GUARD', color: '#fbbf24', glow: '0 0 40px rgba(251, 191, 36, 0.4)', description: 'Increased anomaly signals. Automated withdrawal limits imposed.' },
  2: { level: 3, label: 'SENTINEL', color: '#f97316', glow: '0 0 40px rgba(249, 115, 22, 0.4)', description: 'High-risk exploit detected. All asset movements frozen.' },
  3: { level: 1, label: 'LOCKDOWN', color: '#ef4444', glow: '0 0 40px rgba(239, 68, 68, 0.4)', description: 'CRITICAL BREACH. Auto-Rescue Protocol initialized.' }
};

const NeuralMap = ({ defconColor }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 0.5;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.fillStyle = defconColor; ctx.globalAlpha = 0.15;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    const init = () => { resize(); particles = Array.from({ length: 45 }, () => new Particle()); };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.strokeStyle = defconColor; ctx.globalAlpha = 0.08 * (1 - dist / 180);
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    window.addEventListener('resize', resize);
    init(); animate();
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, [defconColor]);
  return <canvas ref={canvasRef} className="neural-map-canvas" />;
};

export default function App() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab ] = useState('DASHBOARD');
  const { writeContract: executeWrite } = useWriteContract();

  const { data: defconLevel } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'currentDefcon' });
  const { data: isPaused } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'paused' });
  const { data: threshold } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'threatThreshold' });
  const { data: unlockTime } = useReadContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'unlockTime' });

  const defcon = DEFCON_CONFIG[defconLevel] || DEFCON_CONFIG[0];
  const addLog = (msg, type = 'info') => setLogs(prev => [{ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));

  useEffect(() => { if (isConnected) addLog(`Node connection verified. Monitoring secure.`, 'success'); }, [isConnected, address]);

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
          <div className="stat-item connection">
            <div className={`status-dot ${isConnected ? 'active' : ''}`} />
            <span>{isConnected ? 'NODE LINKED' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <AnimatePresence mode="wait">
          {activeTab === 'DASHBOARD' && (
            <motion.div key="db" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="dashboard-content">
              <section className="dashboard-column">
                <div className="shield-card" style={{ borderColor: defcon.color }}>
                  <div className="defcon-ring">
                    <Shield className="shield-icon" size={70} color={defcon.color} />
                    <motion.div className="orbit" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                      <div className="orbit-dot" style={{ background: defcon.color }} />
                    </motion.div>
                  </div>
                  <div className="status-info">
                    <div className="defcon-header">
                      <span className="defcon-number">DEFCON {defcon.level}</span>
                      <h2 style={{ color: defcon.color }}>{defcon.label}</h2>
                    </div>
                    <p>{defcon.description}</p>
                    <div className="security-badges">
                      <div className="badge">{isPaused ? <Lock size={12}/> : <Unlock size={12}/>} {isPaused ? 'ENFORCED' : 'NORMAL'}</div>
                      <div className="badge gasless"><Zap size={12}/> REACTIVE-PULSE</div>
                    </div>
                  </div>
                </div>
                <div className="terminal-container">
                  <div className="terminal-header"><Terminal size={14}/><span>RECEPTOR STREAM</span></div>
                  <div className="terminal-content">
                    {logs.map(l => <div key={l.id} className={`log-entry ${l.type}`}><span className="log-time">{l.time}</span> » {l.msg}</div>)}
                    <div className="terminal-cursor" />
                  </div>
                </div>
              </section>
              <section className="dashboard-column">
                <div className="action-card">
                  <h3>TRANSFERS <span className="helper-text">(Simulate your interaction)</span></h3>
                  <div className="input-group">
                    <input type="number" placeholder="0.0 STT" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <div className="button-row">
                      <button className="btn-primary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'deposit', value: parseEther(amount || '0') })}>DEPOSIT</button>
                      <button className="btn-secondary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'withdraw', args: [parseEther(amount || '0')] })}>WITHDRAW</button>
                    </div>
                  </div>
                </div>
                <div className="action-card override-section">
                  <h3 className="danger-text"><AlertTriangle size={14}/> OVERRIDE PROTOCOLS</h3>
                  <div className="button-grid">
                    <button className="btn-outline" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'resetVault' })}>RESTORE SYSTEM</button>
                    <button className="btn-danger" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'panicRescue' })}>EMERGENCY RESCUE</button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
          {activeTab === 'POLICY' && (
            <motion.div key="pol" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="dashboard-content single-col">
              <div className="action-card">
                <h2><Settings size={20} /> POLICY ENGINE</h2>
                <p className="subtitle">Configure automated threat detection thresholds.</p>
                <div className="policy-grid">
                  <div className="policy-item">
                    <label>Anomaly Limit</label>
                    <p>Triggers security levels if network transfers exceed this amount.</p>
                    <div className="input-with-button">
                      <input type="number" placeholder="500 STT" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} />
                      <button className="btn-primary" onClick={() => executeWrite({ address: CONTRACT_ADDRESS, abi: ABI, functionName: 'updateThreshold', args: [parseEther(newThreshold || '0')] })}>UPDATE</button>
                    </div>
                  </div>
                  <div className="policy-card-info">
                    <Brain size={30} color={defcon.color} />
                    <div>
                      <h4>Active Strategy</h4>
                      <p>Migration Target: <br/> <strong>{address}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'NETWORK' && (
            <motion.div key="net" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-content single-col">
              <div className="action-card">
                <h2><Globe size={20} /> NODE SYNC</h2>
                <div className="node-stats">
                  <div className="node-item"><span>Status</span><strong>SYNCHRONIZED</strong></div>
                  <div className="node-item"><span>Chain</span><strong>Somnia Shannon</strong></div>
                  <div className="node-item"><span>Sync Latency</span><strong>0.4s</strong></div>
                </div>
                <div className="network-map-placeholder">
                  <div className="ping-ring" style={{borderColor: defcon.color}} />
                  <p>Connected to Somnia Reactive Node // Native PUSH Protocol Active</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="footer"><div className="footer-line" /><p>© 2026 SOMNIA FLUX // NATIVE ON-CHAIN PROTECTION</p></footer>
    </div>
  );
}
