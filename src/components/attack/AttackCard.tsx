import React, { useState } from 'react';
import { AttackScenario, AttackIntensity } from '../../types/attack';
import { ThreatBadge } from '../common/ThreatBadge';
import { Play, Square, Crosshair, Terminal, Clock, ShieldCheck, Gauge, Server, Users } from 'lucide-react';
import { useNids } from '../../context/NidsContext';

interface AttackCardProps {
  scenario: AttackScenario;
}

export const AttackCard: React.FC<AttackCardProps> = ({ scenario }) => {
  const { activeAttack, startAttackScenario, stopAttackScenario } = useNids();
  const [intensity, setIntensity] = useState<AttackIntensity>(scenario.safetyLimit?.rateCeiling ? 'MEDIUM' : 'MEDIUM');

  const isCurrentActive = activeAttack?.scenarioId === scenario.id;
  const isAnyActive = Boolean(activeAttack && (activeAttack.status === 'TRANSMITTING' || activeAttack.status === 'INITIALIZING'));
  const isDDoS = scenario.id === 'DDOS_DISTRIBUTED_FLOOD';

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-xl ${
      isCurrentActive
        ? 'bg-[#180f1e] border-red-500/50 alert-glow-red scale-[1.01]'
        : 'bg-[#0e1626] border-[#1a273d] hover:border-[#283b5e]'
    }`}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#182438]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                scenario.category === 'Network Availability'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : scenario.category === 'Credential Attacks'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : scenario.category === 'Reconnaissance'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              }`}>
                {scenario.category}
              </span>
              <ThreatBadge severity={scenario.expectedSeverity} showIcon={false} />
              {isDDoS && (
                <span className="flex items-center gap-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                  <Users className="w-3 h-3" />
                  <span>4 CLUSTER NODES</span>
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1.5 font-sans">{scenario.name}</h3>
          </div>

          <div className="p-2 rounded-xl bg-[#131e33] border border-[#1d2d4c] text-red-400">
            <Crosshair className="w-5 h-5" />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
          {scenario.description}
        </p>

        {/* Intensity Selection Presets */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#070b14] border border-[#162238] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>Preset Intensity:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['LOW', 'MEDIUM', 'HIGH'] as AttackIntensity[]).map((level) => (
              <button
                key={level}
                onClick={() => setIntensity(level)}
                disabled={isCurrentActive || isAnyActive}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  intensity === level
                    ? level === 'HIGH'
                      ? 'bg-red-600 text-white shadow-sm'
                      : level === 'MEDIUM'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#101827] text-slate-400 hover:text-slate-200 border border-[#1a273e]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Command */}
        <div className="mt-2.5 p-2.5 rounded-lg bg-[#070b14] border border-[#162238] font-mono text-[11px] text-emerald-400 flex items-center gap-2 overflow-x-auto">
          <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{scenario.commandSimulated}</span>
        </div>

        {/* Attack Parameters */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
          {scenario.parameters.map((p, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-[#0a101d] border border-[#162238]">
              <span className="text-[10px] text-slate-400 block">{p.label}</span>
              <span className="text-slate-200 font-semibold text-[11px] truncate block mt-0.5">{p.value}</span>
            </div>
          ))}
        </div>

        {/* Safety & Expected AI Classification */}
        <div className="mt-3 p-2.5 rounded-lg bg-[#0a1120] border border-[#15233d] text-xs space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">Expected AI Output:</span>
            <span className="font-bold text-blue-400">{scenario.expectedClass}</span>
          </div>
          {scenario.safetyLimit && (
            <div className="flex items-center justify-between font-mono text-[10px] text-emerald-400/80 pt-1 border-t border-[#131f36]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Safety Rate Ceiling:</span>
              </span>
              <span>{scenario.safetyLimit.rateCeiling}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 pt-3 border-t border-[#182438] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Duration: ~{scenario.estimatedDurationSec}s</span>
        </div>

        {isCurrentActive ? (
          <button
            onClick={stopAttackScenario}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono transition-all shadow-lg animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>STOP TEST</span>
          </button>
        ) : (
          <button
            onClick={() => startAttackScenario(scenario.id, intensity)}
            disabled={isAnyActive}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-md ${
              isAnyActive
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>START TEST</span>
          </button>
        )}
      </div>
    </div>
  );
};
