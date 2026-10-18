import React from 'react';
import { Crosshair, CheckCircle2, Square } from 'lucide-react';
import { useNids } from '../../context/NidsContext';

export const ActiveAttackBanner: React.FC<{ onNavigateToAttackLab: () => void }> = ({ onNavigateToAttackLab }) => {
  const { activeAttack, scenarios, stopAttackScenario } = useNids();

  if (!activeAttack) return null;

  const currentScenario = scenarios.find(s => s.id === activeAttack.scenarioId);
  const isRunning = activeAttack.status === 'TRANSMITTING' || activeAttack.status === 'INITIALIZING';

  return (
    <div
      className={`w-full px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-4 bg-ink-900 ${
        isRunning ? 'border-sev-critical/40' : 'border-sev-clear/40'
      }`}
    >
      <div className="flex items-center gap-3">
        {isRunning ? (
          <Crosshair className="w-4 h-4 text-sev-critical" strokeWidth={1.75} />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-sev-clear" strokeWidth={1.75} />
        )}

        <div className="flex items-center gap-3 text-[13px]">
          <span className="text-paper-100">{currentScenario?.name || 'Active simulation'}</span>
          <span className="text-paper-600">{isRunning ? 'running' : 'completed'}</span>
          <span className="hidden sm:inline font-mono text-[12px] text-paper-400">
            {currentScenario?.sourceIp} → {currentScenario?.targetIp}
          </span>
          <span className="hidden md:inline font-mono text-[12px] text-paper-600">
            {activeAttack.elapsedSec}s / {activeAttack.durationSec}s
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onNavigateToAttackLab}
          className="text-[12px] text-paper-400 hover:text-paper-200 transition-colors"
        >
          View pipeline
        </button>

        {isRunning && (
          <button
            onClick={stopAttackScenario}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-sev-critical/50 text-sev-critical text-[12px] hover:bg-sev-critical/10 transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};
