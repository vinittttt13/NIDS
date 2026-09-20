import React from 'react';
import { useNids } from '../../context/NidsContext';
import { 
  Server, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Crosshair, 
  Gauge, 
  Activity,
  Radio
} from 'lucide-react';
import { LAB_ATTACKER_IP, LAB_TARGET_IP, LAB_SENSOR_IP } from '../../services/attackService';

export const AttackControllerStatusPanel: React.FC = () => {
  const { activeAttack, connectionStatus, activeTransport, systemDiagnostics, networkInterfaces } = useNids();

  const isTransmitting = Boolean(activeAttack && activeAttack.status !== 'STOPPED');
  const primaryInterface = networkInterfaces.find(i => i.isPrimary || i.status === 'Connected');
  const controllerIp = systemDiagnostics.clientIp || (primaryInterface ? primaryInterface.ip : LAB_ATTACKER_IP);
  const nidsServerHost = systemDiagnostics.nidsServerIp || `${import.meta.env.VITE_NIDS_HOST || '10.64.157.145'}:8000`;

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#182438]">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-red-400" />
          <h3 className="font-bold text-base text-white font-mono">
            PC 1 Remote Attack Controller Status & Telemetry
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2.5 py-1 rounded border font-bold flex items-center gap-1.5 ${
            isTransmitting 
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isTransmitting ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{isTransmitting ? 'CONTROL ACTION DISPATCHED' : 'CONTROLLER READY / IDLE'}</span>
          </span>
        </div>
      </div>

      {/* Controller Hardware & Network Target Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">Controller IP (PC 1)</span>
          <div className="font-bold text-white text-sm">{controllerIp}</div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active Host
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">Target Host (Locked)</span>
          <div className="font-bold text-white text-sm">{LAB_TARGET_IP}</div>
          <span className="text-[10px] text-amber-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Private Lab Target
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">PC 2 NIDS Backend</span>
          <div className="font-bold text-sm">
            {connectionStatus.nidsApiConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reachable
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Standby
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">{nidsServerHost}</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
          <span className="text-slate-400 text-[10px] uppercase">Network Transport</span>
          <div className="font-bold text-white text-sm">{activeTransport}</div>
          <span className="text-[10px] text-cyan-400">{activeTransport === 'WI-FI' ? 'Wi-Fi Interface' : 'Ethernet Link'}</span>
        </div>
      </div>

      {/* Active Transmission Telemetry Card */}
      {isTransmitting && activeAttack ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-[#10192e] to-[#080d17] border border-red-500/40 space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-red-400" />
              <span className="font-bold text-white uppercase tracking-wider">Active Scenario:</span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-xs">{activeAttack.scenarioId}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Intensity: <strong className="text-white">{activeAttack.intensity || 'MEDIUM'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#162238]">
              <span className="text-[10px] text-slate-400 block">Elapsed / Duration:</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{activeAttack.elapsedSec}s / {activeAttack.durationSec}s</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#162238]">
              <span className="text-[10px] text-slate-400 block">Estimated Packets Transmitted:</span>
              <span className="text-sm font-bold text-cyan-400 mt-0.5 block">{activeAttack.packetsSent.toLocaleString()} pkts</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-[#162238]">
              <span className="text-[10px] text-slate-400 block">Safety Rate Ceiling:</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">Bounded (Enforced)</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Controller Dispatch Logs */}
      <div className="space-y-1.5 font-mono text-xs">
        <span className="text-[11px] text-slate-400 uppercase">Controller Action & Dispatch Log:</span>
        <div className="p-3 rounded-xl bg-[#060a12] border border-[#141e30] max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-300">
          {activeAttack && activeAttack.logs && activeAttack.logs.length > 0 ? (
            activeAttack.logs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2 text-emerald-400">
                <span className="text-slate-500">▶</span>
                <span>{log}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic">
              Awaiting attack execution command. Select a scenario above and click START TEST to dispatch traffic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
