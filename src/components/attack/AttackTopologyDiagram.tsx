import React from 'react';
import { useNids } from '../../context/NidsContext';
import { 
  Crosshair, 
  Server, 
  Cpu, 
  Lock, 
  Radio, 
  ArrowRight, 
  ArrowDown, 
  ShieldAlert, 
  Network,
  Activity,
  Zap
} from 'lucide-react';
import { LAB_ATTACKER_IP, LAB_TARGET_IP, LAB_SENSOR_IP } from '../../services/attackService';

export const AttackTopologyDiagram: React.FC = () => {
  const { activeAttack, activeTransport, systemDiagnostics, networkInterfaces } = useNids();

  const isTransmitting = activeAttack?.status === 'TRANSMITTING' || activeAttack?.status === 'INITIALIZING';
  const primaryIface = networkInterfaces.find(i => i.isPrimary || i.status === 'Connected');
  const pc1Ip = systemDiagnostics.clientIp || primaryIface?.ip || 'NOT DETECTED';
  const pc2Ip = systemDiagnostics.nidsServerIp?.split(':')[0] || 'NOT DETECTED';

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Physical Lab Topology & Controlled Test Flow</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                🔒 ISOLATED CYBER RANGE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Two physical machines operating over <strong className="text-cyan-300">{activeTransport}</strong>
            </p>
          </div>
        </div>

        {/* Locked Target Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080d17] border border-[#1b273d] text-xs font-mono">
          <span className="text-slate-400">LAB TARGET:</span>
          <span className="font-bold text-emerald-400">{LAB_TARGET_IP} (LAB-VICTIM)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">LOCKED</span>
        </div>
      </div>

      {/* Interactive Topology Graphic */}
      <div className="mt-6 p-6 rounded-xl bg-[#080d17] border border-[#162238] relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
          {/* PC 1: ATTACK LAB */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${
            isTransmitting
              ? 'bg-[#180e1b] border-red-500/60 alert-glow-red'
              : 'bg-[#0e1626] border-[#1b283d]'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#182438]">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase">PHYSICAL MACHINE 1</span>
              <Crosshair className="w-4 h-4 text-red-400" />
            </div>

            <div className="mt-3">
              <h4 className="font-bold text-white text-sm">ATTACK LAB CONTROLLER</h4>
              <div className="font-mono text-xs text-red-300 mt-1 font-bold">{pc1Ip}</div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">Remote Scenario Dispatcher</p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#182438] flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Transport Link</span>
              <span className={isTransmitting ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}>
                {isTransmitting ? 'TRANSMITTING' : 'IDLE / READY'}
              </span>
            </div>
          </div>

          {/* ISOLATED NETWORK LINK (CENTER) */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0b1220] border border-blue-500/30 text-center relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-2">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-xs font-mono">NETWORK TRANSPORT</h4>
            <span className="text-[10px] text-cyan-300 font-mono mt-0.5">{activeTransport} Communication Link</span>

            {/* Port Mirror SPAN Tag */}
            <div className="mt-3 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{activeTransport === 'WI-FI' ? 'Direct Wi-Fi / REST C2' : 'Ethernet / SPAN Tap'}</span>
            </div>
          </div>

          {/* PC 2: AI-NIDS SENSOR & SOC */}
          <div className="p-4 rounded-xl border bg-[#0e1626] border-cyan-500/40 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-[#182438]">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">PHYSICAL MACHINE 2</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="mt-3">
              <h4 className="font-bold text-white text-sm">AI-NIDS SENSOR & SOC</h4>
              <div className="font-mono text-xs text-cyan-300 mt-1 font-bold">{pc2Ip}</div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">Detection Authority :8000</p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#182438] flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Detection Pipeline</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* VICTIM TARGET (LAB-VICTIM) */}
        <div className="mt-6 pt-6 border-t border-[#162238] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isTransmitting ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">LAB-VICTIM TEST SERVER</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {LAB_TARGET_IP}
                </span>
              </div>
              <p className="text-xs text-slate-400">Ubuntu 22.04 LTS (SSH :22, Web :80, DNS :53, App :8080)</p>
            </div>
          </div>

          {/* Distinction Banner: Path A vs Path B */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>PATH A: Real Mirrored Test Traffic</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>PATH B: Controller REST/WebSocket C2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
