import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Crosshair, Server, Cpu, Lock, Radio, Network } from 'lucide-react';
import { LAB_TARGET_IP } from '../../services/attackService';

export const AttackTopologyDiagram: React.FC = () => {
  const { activeAttack, activeTransport, systemDiagnostics, networkInterfaces } = useNids();

  const isTransmitting = activeAttack?.status === 'TRANSMITTING' || activeAttack?.status === 'INITIALIZING';
  const primaryIface = networkInterfaces.find(i => i.isPrimary || i.status === 'Connected');
  const pc1Ip = systemDiagnostics.clientIp || primaryIface?.ip || 'NOT DETECTED';
  const pc2Ip = systemDiagnostics.nidsServerIp?.split(':')[0] || 'NOT DETECTED';

  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-ink-900 border border-line-600 text-sev-high">
            <Lock className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] text-paper-100">Physical lab topology & controlled test flow</h3>
              <span className="text-[10px] font-mono text-sev-high border border-sev-high/30 px-1.5 py-0.5">
                ISOLATED CYBER RANGE
              </span>
            </div>
            <p className="text-[12px] text-paper-400 mt-0.5">
              Two physical machines operating over <strong className="text-phos-400">{activeTransport}</strong>
            </p>
          </div>
        </div>

        {/* Locked Target Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-ink-900 border border-line-600 text-[12px] font-mono">
          <span className="text-paper-600">Lab target</span>
          <span className="text-paper-100">{LAB_TARGET_IP} (LAB-VICTIM)</span>
          <span className="text-[10px] px-1.5 py-0.5 text-paper-600 border border-line-600">LOCKED</span>
        </div>
      </div>

      {/* Interactive Topology Graphic */}
      <div className="mt-5 p-5 bg-ink-850 border border-line-700 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line-700 items-stretch relative z-10">
          {/* PC 1: ATTACK LAB */}
          <div className={`p-4 border ${isTransmitting ? 'bg-ink-800 border-sev-critical/50 alert-glow-red' : 'bg-ink-800 border-line-700'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-line-700">
              <span className="text-[10px] font-mono text-paper-600 uppercase">Physical machine 1</span>
              <Crosshair className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
            </div>

            <div className="mt-3">
              <h4 className="text-[13px] text-paper-100">Attack lab controller</h4>
              <div className="font-mono text-[12px] text-paper-100 mt-1">{pc1Ip}</div>
              <p className="text-[11px] text-paper-600 font-mono mt-1">Remote scenario dispatcher</p>
            </div>

            <div className="mt-4 pt-2 border-t border-line-700 flex items-center justify-between text-[10px] font-mono">
              <span className="text-paper-600">Transport link</span>
              <span className={isTransmitting ? 'text-sev-critical' : 'text-phos-400'}>
                {isTransmitting ? 'TRANSMITTING' : 'IDLE / READY'}
              </span>
            </div>
          </div>

          {/* ISOLATED NETWORK LINK (CENTER) */}
          <div className="flex flex-col items-center justify-center p-4 bg-ink-800 border border-line-700 text-center">
            <div className="w-9 h-9 bg-ink-900 border border-phos-700 flex items-center justify-center text-phos-400 mb-2">
              <Network className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h4 className="text-[12px] text-paper-100 font-mono">Network transport</h4>
            <span className="text-[10px] text-paper-400 font-mono mt-0.5">{activeTransport} communication link</span>

            <div className="mt-3 px-2 py-1 bg-ink-900 border border-line-600 text-[10px] font-mono text-paper-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-phos-400" strokeWidth={1.75} />
              <span>{activeTransport === 'WI-FI' ? 'Direct Wi-Fi / REST C2' : 'Ethernet / SPAN tap'}</span>
            </div>
          </div>

          {/* PC 2: AI-NIDS SENSOR & SOC */}
          <div className="p-4 bg-ink-800 border border-line-700">
            <div className="flex items-center justify-between pb-2 border-b border-line-700">
              <span className="text-[10px] font-mono text-paper-600 uppercase">Physical machine 2</span>
              <Cpu className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
            </div>

            <div className="mt-3">
              <h4 className="text-[13px] text-paper-100">AI-NIDS sensor & SOC</h4>
              <div className="font-mono text-[12px] text-paper-100 mt-1">{pc2Ip}</div>
              <p className="text-[11px] text-paper-600 font-mono mt-1">Detection authority :8000</p>
            </div>

            <div className="mt-4 pt-2 border-t border-line-700 flex items-center justify-between text-[10px] font-mono">
              <span className="text-paper-600">Detection pipeline</span>
              <span className="text-phos-400">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* VICTIM TARGET (LAB-VICTIM) */}
        <div className="mt-5 pt-5 border-t border-line-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 border ${isTransmitting ? 'bg-ink-900 border-sev-critical/30 text-sev-critical' : 'bg-ink-900 border-phos-700 text-phos-400'}`}>
              <Server className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-paper-100 font-mono">LAB-VICTIM test server</span>
                <span className="text-[10px] font-mono px-2 py-0.5 text-paper-600 border border-line-600">{LAB_TARGET_IP}</span>
              </div>
              <p className="text-[12px] text-paper-400">Ubuntu 22.04 LTS (SSH :22, Web :80, DNS :53, App :8080)</p>
            </div>
          </div>

          {/* Distinction Banner: simulated test traffic vs. controller signaling */}
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 border border-line-600 text-paper-400">
              <span className="w-1.5 h-1.5 bg-sev-low" />
              <span>Path A: simulated test traffic</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 border border-line-600 text-paper-400">
              <span className="w-1.5 h-1.5 bg-phos-400" />
              <span>Path B: controller REST/WebSocket C2</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
