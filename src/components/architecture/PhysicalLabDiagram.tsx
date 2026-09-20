import React from 'react';
import { 
  Crosshair, 
  Server, 
  Cpu, 
  Lock, 
  Radio, 
  ArrowRight, 
  ArrowDown, 
  ShieldAlert, 
  Activity, 
  Database,
  Binary,
  Layers,
  Sparkles,
  GitBranch
} from 'lucide-react';

export const PhysicalLabDiagram: React.FC = () => {
  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-base text-white">Full Physical & Logical Cybersecurity Architecture</h3>
            <p className="text-xs text-slate-400">Two-PC hardware deployment with hardware port mirroring and decoupled AI pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Isolated Subnet: 192.168.100.0/24
          </span>
        </div>
      </div>

      {/* Layer 1: Physical Machines & Network */}
      <div className="p-5 rounded-xl bg-[#080d17] border border-[#162238] space-y-4">
        <div className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Physical Hardware Layer</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* PC 1 */}
          <div className="p-4 rounded-xl bg-[#0d1424] border border-red-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-[#182438]">
              <span className="text-red-400 font-bold">PC 1: ATTACK LAB</span>
              <Crosshair className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-2 text-slate-300 space-y-1 text-[11px]">
              <div>IP: <strong className="text-white">192.168.100.10</strong></div>
              <div>OS: Kali Linux 2024.1</div>
              <div>Stack: Python, nmap, hping3, hydra</div>
              <div>Role: Controlled Test Generator</div>
            </div>
          </div>

          {/* Switch */}
          <div className="p-4 rounded-xl bg-[#0d1424] border border-blue-500/30 text-center flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#182438]">
              <span className="text-blue-400 font-bold">MANAGED SWITCH</span>
              <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div className="mt-2 text-slate-300 space-y-1 text-[11px]">
              <div>Cisco SG350-10P Gigabit</div>
              <div>Port 1: PC 1 (Attacker)</div>
              <div>Port 2: Lab Target (Victim)</div>
              <div className="text-cyan-400 font-bold">Port 8: SPAN Mirror Out → PC 2</div>
            </div>
          </div>

          {/* PC 2 */}
          <div className="p-4 rounded-xl bg-[#0d1424] border border-cyan-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-[#182438]">
              <span className="text-cyan-400 font-bold">PC 2: AI-NIDS SENSOR</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-slate-300 space-y-1 text-[11px]">
              <div>IP: <strong className="text-white">192.168.100.30</strong></div>
              <div>OS: Ubuntu 22.04 LTS</div>
              <div>Stack: Zeek, Suricata, XGBoost, FastAPI</div>
              <div>Role: Sensor, ML Inference & SOC Host</div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 2: Complete Data Flow Pipeline */}
      <div className="p-5 rounded-xl bg-[#080d17] border border-[#162238] space-y-4">
        <div className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>PC 2 Internal Processing Pipeline Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-[#1b2a45]">
            <div className="text-[10px] text-slate-400 uppercase">Stage 1: Capture & Sensor</div>
            <h4 className="font-bold text-white mt-1">Zeek + Suricata</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Passive raw frame capture on promiscuous SPAN interface. Reassembles TCP flows.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-[#1b2a45]">
            <div className="text-[10px] text-slate-400 uppercase">Stage 2: Feature Engine</div>
            <h4 className="font-bold text-white mt-1">78-Feature Extractor</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Calculates packet IAT, flag ratios, entropy, and directional byte statistics per window.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-[#1b2a45]">
            <div className="text-[10px] text-slate-400 uppercase">Stage 3: AI Inference</div>
            <h4 className="font-bold text-blue-400 mt-1">XGBoost + IsoForest</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Performs multi-class classification and unsupervised anomaly detection in 14ms.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1424] border border-[#1b2a45]">
            <div className="text-[10px] text-slate-400 uppercase">Stage 4: Real-Time SOC</div>
            <h4 className="font-bold text-emerald-400 mt-1">FastAPI & WebSocket</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              Broadcasts threat detections and XAI explanations to React SOC dashboard under 438ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
