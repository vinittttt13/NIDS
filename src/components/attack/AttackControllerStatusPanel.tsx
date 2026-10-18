import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Terminal, CheckCircle2, AlertTriangle, ShieldCheck, Crosshair, Gauge } from 'lucide-react';
import { LAB_ATTACKER_IP, LAB_TARGET_IP } from '../../services/attackService';

export const AttackControllerStatusPanel: React.FC = () => {
  const { activeAttack, connectionStatus, activeTransport, systemDiagnostics, networkInterfaces } = useNids();

  const isTransmitting = Boolean(activeAttack && activeAttack.status !== 'STOPPED');
  const primaryInterface = networkInterfaces.find(i => i.isPrimary || i.status === 'Connected');
  const controllerIp = systemDiagnostics.clientIp || (primaryInterface ? primaryInterface.ip : LAB_ATTACKER_IP);
  const nidsServerHost = systemDiagnostics.nidsServerIp || `${import.meta.env.VITE_NIDS_HOST || '127.0.0.1'}:8000`;

  return (
    <div className="bg-ink-800 border border-line-700 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line-700">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">PC 1 remote attack controller status</h3>
        </div>

        <span className="flex items-center gap-1.5 text-[12px] font-mono">
          <span
            className={`w-[6px] h-[6px] rounded-full ${isTransmitting ? 'bg-sev-critical' : 'bg-phos-400 shadow-live'}`}
            aria-hidden="true"
          />
          <span className={isTransmitting ? 'text-sev-critical' : 'text-phos-400'}>
            {isTransmitting ? 'CONTROL ACTION DISPATCHED' : 'CONTROLLER READY / IDLE'}
          </span>
        </span>
      </div>

      {/* Controller Hardware & Network Target Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line-700 font-mono text-[12px]">
        <div className="p-3 bg-ink-900 space-y-1">
          <span className="text-paper-600 text-[10px] uppercase">Controller IP (PC 1)</span>
          <div className="text-paper-100 text-[13px]">{controllerIp}</div>
          <span className="text-[10px] text-phos-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active host
          </span>
        </div>

        <div className="p-3 bg-ink-900 space-y-1">
          <span className="text-paper-600 text-[10px] uppercase">Target host (locked)</span>
          <div className="text-paper-100 text-[13px]">{LAB_TARGET_IP}</div>
          <span className="text-[10px] text-phos-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Private lab target
          </span>
        </div>

        <div className="p-3 bg-ink-900 space-y-1">
          <span className="text-paper-600 text-[10px] uppercase">PC 2 NIDS backend</span>
          <div className="text-[13px]">
            {connectionStatus.nidsApiConnected ? (
              <span className="text-phos-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reachable
              </span>
            ) : (
              <span className="text-sev-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Standby
              </span>
            )}
          </div>
          <span className="text-[10px] text-paper-600">{nidsServerHost}</span>
        </div>

        <div className="p-3 bg-ink-900 space-y-1">
          <span className="text-paper-600 text-[10px] uppercase">Network transport</span>
          <div className="text-paper-100 text-[13px]">{activeTransport}</div>
          <span className="text-[10px] text-paper-600">{activeTransport === 'WI-FI' ? 'Wi-Fi interface' : 'Ethernet link'}</span>
        </div>
      </div>

      {/* Active Transmission Telemetry Card */}
      {isTransmitting && activeAttack ? (
        <div className="p-4 bg-ink-900 border border-sev-critical/40 space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-sev-critical" strokeWidth={1.75} />
              <span className="text-paper-100">Active scenario</span>
              <span className="px-1.5 py-0.5 text-sev-critical border border-sev-critical/30 text-[11px]">{activeAttack.scenarioId}</span>
            </div>
            <div className="flex items-center gap-2 text-paper-300">
              <Gauge className="w-3.5 h-3.5 text-phos-400" strokeWidth={1.75} />
              <span>Intensity <strong className="text-paper-100">{activeAttack.intensity || 'MEDIUM'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-line-700 text-[12px]">
            <div className="p-2.5 bg-ink-850">
              <span className="text-[10px] text-paper-600 block">Elapsed / duration</span>
              <span className="text-[13px] text-paper-100 mt-0.5 block">{activeAttack.elapsedSec}s / {activeAttack.durationSec}s</span>
            </div>
            <div className="p-2.5 bg-ink-850">
              <span className="text-[10px] text-paper-600 block">Estimated packets transmitted</span>
              <span className="text-[13px] text-paper-100 mt-0.5 block">{activeAttack.packetsSent.toLocaleString()} pkts</span>
            </div>
            <div className="p-2.5 bg-ink-850">
              <span className="text-[10px] text-paper-600 block">Safety rate ceiling</span>
              <span className="text-[13px] text-phos-400 mt-0.5 block">Bounded (enforced)</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Controller Dispatch Logs */}
      <div className="space-y-1.5 font-mono text-[12px]">
        <span className="text-[11px] text-paper-600 uppercase">Controller action & dispatch log</span>
        <div className="p-3 bg-ink-900 border border-line-700 max-h-36 overflow-y-auto space-y-1 text-[11px] text-paper-100">
          {activeAttack && activeAttack.logs && activeAttack.logs.length > 0 ? (
            activeAttack.logs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-phos-600">&gt;</span>
                <span>{log}</span>
              </div>
            ))
          ) : (
            <div className="text-paper-600 italic">
              Awaiting attack execution command. Select a scenario above and click Start test to dispatch traffic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
