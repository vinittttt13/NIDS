import React, { useState } from 'react';
import { AttackScenario, AttackIntensity } from '../../types/attack';
import { ThreatBadge } from '../common/ThreatBadge';
import { StatusPill } from '../common/Table';
import { Play, Square, Crosshair, Terminal, Clock, ShieldCheck, Gauge, Users } from 'lucide-react';
import { useNids } from '../../context/NidsContext';

interface AttackCardProps {
  scenario: AttackScenario;
}

export const AttackCard: React.FC<AttackCardProps> = ({ scenario }) => {
  const { activeAttack, startAttackScenario, stopAttackScenario } = useNids();
  const [intensity, setIntensity] = useState<AttackIntensity>('MEDIUM');

  const isCurrentActive = activeAttack?.scenarioId === scenario.id;
  const isAnyActive = Boolean(activeAttack && (activeAttack.status === 'TRANSMITTING' || activeAttack.status === 'INITIALIZING'));
  const isDDoS = scenario.id === 'DDOS_DISTRIBUTED_FLOOD';

  const INTENSITY_ACTIVE: Record<AttackIntensity, string> = {
    LOW: 'bg-phos-500 text-ink-950',
    MEDIUM: 'bg-sev-medium text-ink-950',
    HIGH: 'bg-sev-high text-ink-950',
  };

  return (
    <div
      className={`p-5 border transition-colors flex flex-col justify-between ${
        isCurrentActive ? 'bg-ink-800 border-sev-critical/50 alert-glow-red' : 'bg-ink-800 border-line-700 hover:border-line-500'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-line-700">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill tone="neutral">{scenario.category}</StatusPill>
              <ThreatBadge severity={scenario.expectedSeverity} showIcon={false} />
              {isDDoS && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-paper-600 border border-line-600 px-1.5 py-0.5">
                  <Users className="w-3 h-3" />
                  <span>4 cluster nodes</span>
                </span>
              )}
            </div>
            <h3 className="text-[15px] text-paper-100 mt-1.5">{scenario.name}</h3>
          </div>

          <div className="p-2 bg-ink-900 border border-line-600 text-phos-400">
            <Crosshair className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-paper-300 mt-3 leading-relaxed">{scenario.description}</p>

        {/* Intensity Selection Presets */}
        <div className="mt-3 p-2.5 bg-ink-900 border border-line-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-paper-400">
            <Gauge className="w-3.5 h-3.5 text-phos-400" strokeWidth={1.75} />
            <span>Preset intensity</span>
          </div>
          <div className="flex items-center gap-1">
            {(['LOW', 'MEDIUM', 'HIGH'] as AttackIntensity[]).map((level) => (
              <button
                key={level}
                onClick={() => setIntensity(level)}
                disabled={isCurrentActive || isAnyActive}
                className={`px-2 py-0.5 text-[10px] font-mono font-medium transition-colors ${
                  intensity === level ? INTENSITY_ACTIVE[level] : 'bg-ink-800 text-paper-400 hover:text-paper-200 border border-line-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Command */}
        <div className="mt-2.5 p-2.5 bg-ink-900 border border-line-700 font-mono text-[11px] text-paper-100 flex items-center gap-2 overflow-x-auto">
          <Terminal className="w-3.5 h-3.5 text-phos-400 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{scenario.commandSimulated}</span>
        </div>

        {/* Attack Parameters */}
        <div className="mt-3 grid grid-cols-2 gap-px bg-line-700">
          {scenario.parameters.map((p, idx) => (
            <div key={idx} className="p-2 bg-ink-900 font-mono">
              <span className="text-[10px] text-paper-600 block">{p.label}</span>
              <span className="text-paper-100 text-[11px] truncate block mt-0.5">{p.value}</span>
            </div>
          ))}
        </div>

        {/* Safety & Expected AI Classification */}
        <div className="mt-3 p-2.5 bg-ink-900 border border-line-700 text-[12px] space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-paper-600">Expected AI output</span>
            <span className="text-phos-400">{scenario.expectedClass}</span>
          </div>
          {scenario.safetyLimit && (
            <div className="flex items-center justify-between text-[10px] text-phos-400/80 pt-1.5 border-t border-line-700">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-phos-400" strokeWidth={1.75} />
                <span>Safety rate ceiling</span>
              </span>
              <span>{scenario.safetyLimit.rateCeiling}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 pt-3 border-t border-line-700 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-paper-600">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Duration ~{scenario.estimatedDurationSec}s</span>
        </div>

        {isCurrentActive ? (
          <button
            onClick={stopAttackScenario}
            className="flex items-center gap-1.5 px-4 py-2 bg-sev-critical hover:opacity-90 text-ink-950 text-[12px] font-medium transition-opacity"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop test</span>
          </button>
        ) : (
          <button
            onClick={() => startAttackScenario(scenario.id, intensity)}
            disabled={isAnyActive}
            className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium transition-colors ${
              isAnyActive
                ? 'bg-ink-900 text-paper-600 cursor-not-allowed border border-line-600'
                : 'bg-phos-400 hover:bg-phos-500 text-ink-950'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start test</span>
          </button>
        )}
      </div>
    </div>
  );
};
