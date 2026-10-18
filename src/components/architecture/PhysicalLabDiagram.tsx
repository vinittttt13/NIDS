import React from 'react';
import { Crosshair, Cpu, Radio, GitBranch } from 'lucide-react';

export const PhysicalLabDiagram: React.FC = () => {
  return (
    <div className="bg-ink-800 border border-line-700 p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-700">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <div>
            <h3 className="text-[14px] text-paper-100">Full physical & logical architecture</h3>
            <p className="text-[12px] text-paper-600">Designed two-PC deployment with port mirroring and a decoupled AI pipeline</p>
          </div>
        </div>
        <span className="text-[12px] font-mono text-paper-600">Isolated subnet 192.168.100.0/24</span>
      </div>

      {/* Layer 1: Physical Machines & Network */}
      <div className="p-5 bg-ink-850 border border-line-700 space-y-4">
        <div className="text-[11px] font-mono text-phos-600 uppercase tracking-wide">Physical hardware layer</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line-700 font-mono text-[12px]">
          <div className="p-4 bg-ink-900">
            <div className="flex items-center justify-between pb-2 border-b border-line-700">
              <span className="text-paper-100">PC 1: Attack lab</span>
              <Crosshair className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
            </div>
            <div className="mt-2 text-paper-300 space-y-1 text-[11px]">
              <div>IP <span className="text-paper-100">192.168.100.10</span></div>
              <div>OS: Kali Linux 2024.1</div>
              <div>Stack: Python, nmap, hping3, hydra</div>
              <div>Role: controlled test generator</div>
            </div>
          </div>

          <div className="p-4 bg-ink-900 text-center flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-line-700">
              <span className="text-paper-100">Managed switch</span>
              <Radio className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
            </div>
            <div className="mt-2 text-paper-300 space-y-1 text-[11px] text-left">
              <div>Cisco SG350-10P gigabit</div>
              <div>Port 1: PC 1 (attacker)</div>
              <div>Port 2: lab target (victim)</div>
              <div className="text-phos-400">Port 8: SPAN mirror out → PC 2</div>
            </div>
          </div>

          <div className="p-4 bg-ink-900">
            <div className="flex items-center justify-between pb-2 border-b border-line-700">
              <span className="text-paper-100">PC 2: AI-NIDS sensor</span>
              <Cpu className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
            </div>
            <div className="mt-2 text-paper-300 space-y-1 text-[11px]">
              <div>IP <span className="text-paper-100">192.168.100.30</span></div>
              <div>OS: Ubuntu 22.04 LTS</div>
              <div>Stack: Zeek, Suricata, XGBoost, FastAPI</div>
              <div>Role: sensor, ML inference & SOC host</div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 2: Complete Data Flow Pipeline */}
      <div className="p-5 bg-ink-850 border border-line-700 space-y-4">
        <div className="text-[11px] font-mono text-phos-600 uppercase tracking-wide">PC 2 internal processing pipeline</div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line-700 font-mono text-[12px]">
          <div className="p-3.5 bg-ink-900">
            <div className="text-[10px] text-paper-600 uppercase">Stage 1: capture & sensor</div>
            <h4 className="text-paper-100 mt-1">Zeek + Suricata</h4>
            <p className="text-[10px] text-paper-600 font-sans mt-1">Passive raw frame capture on a promiscuous SPAN interface; reassembles TCP flows.</p>
          </div>

          <div className="p-3.5 bg-ink-900">
            <div className="text-[10px] text-paper-600 uppercase">Stage 2: feature engine</div>
            <h4 className="text-paper-100 mt-1">78-feature extractor</h4>
            <p className="text-[10px] text-paper-600 font-sans mt-1">Calculates packet IAT, flag ratios, entropy, and directional byte statistics per window.</p>
          </div>

          <div className="p-3.5 bg-ink-900">
            <div className="text-[10px] text-paper-600 uppercase">Stage 3: AI inference</div>
            <h4 className="text-phos-400 mt-1">XGBoost + IsoForest</h4>
            <p className="text-[10px] text-paper-600 font-sans mt-1">Multi-class classification and unsupervised anomaly detection in ~14ms.</p>
          </div>

          <div className="p-3.5 bg-ink-900">
            <div className="text-[10px] text-paper-600 uppercase">Stage 4: real-time SOC</div>
            <h4 className="text-phos-400 mt-1">FastAPI & WebSocket</h4>
            <p className="text-[10px] text-paper-600 font-sans mt-1">Broadcasts threat detections and XAI explanations to the React SOC dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
