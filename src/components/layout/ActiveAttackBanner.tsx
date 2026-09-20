import React from 'react';
import { ShieldAlert, Crosshair, AlertTriangle, ArrowRight, CheckCircle2, Loader2, Square } from 'lucide-react';
import { useNids } from '../../context/NidsContext';

export const ActiveAttackBanner: React.FC<{ onNavigateToAttackLab: () => void }> = ({ onNavigateToAttackLab }) => {
  const { activeAttack, scenarios, stopAttackScenario } = useNids();

  if (!activeAttack) return null;

  const currentScenario = scenarios.find(s => s.id === activeAttack.scenarioId);
  const isRunning = activeAttack.status === 'TRANSMITTING' || activeAttack.status === 'INITIALIZING';

  return (
    <div className={`w-full px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4 transition-all duration-300 ${
      isRunning 
        ? 'bg-gradient-to-r from-red-950/60 via-[#1c0d18] to-[#0d131f] border-red-500/40' 
        : 'bg-gradient-to-r from-emerald-950/40 via-[#0d1c1a] to-[#0d131f] border-emerald-500/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg flex items-center justify-center ${
          isRunning ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {isRunning ? <Crosshair className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              {isRunning ? 'SIMULATION IN PROGRESS' : 'SIMULATION COMPLETED'}
            </span>
            <span className="font-semibold text-white text-sm">
              {currentScenario?.name || 'Active Attack'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-mono">
            <span>Attacker: <strong className="text-red-400">{currentScenario?.sourceIp}</strong></span>
            <span>→</span>
            <span>Target: <strong className="text-emerald-400">{currentScenario?.targetIp}</strong></span>
            <span className="text-slate-500">|</span>
            <span>Elapsed: <strong>{activeAttack.elapsedSec}s</strong> / {activeAttack.durationSec}s</span>
            <span className="text-slate-500">|</span>
            <span>Packets Injected: <strong className="text-blue-400">{activeAttack.packetsSent.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNavigateToAttackLab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all"
        >
          <span>View Attack Pipeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {isRunning && (
          <button
            onClick={stopAttackScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all shadow-md"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Test</span>
          </button>
        )}
      </div>
    </div>
  );
};
