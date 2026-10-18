import React from 'react';
import { useNids } from '../../context/NidsContext';

export const AttackExecutionTimeline: React.FC = () => {
  const { timeline, clientRole } = useNids();

  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-700">
        <h3 className="text-[14px] text-paper-100">Detection timeline</h3>
        {timeline.length > 0 && (
          <span className="text-[12px] font-mono text-paper-600">
            {timeline[timeline.length - 1]?.elapsedMs || 0}ms total
          </span>
        )}
      </div>

      <div className="mt-5">
        {timeline.length === 0 ? (
          <p className="py-6 text-[12px] text-paper-600">
            {clientRole === 'ATTACK_LAB'
              ? 'Start a scenario above to see its detection sequence here.'
              : 'Nothing to show yet — launch a scenario from the attack lab to populate this.'}
          </p>
        ) : (
          <ol className="relative border-l border-line-700 ml-1.5">
            {timeline.map((event) => (
              <li key={event.id} className="pl-5 pb-5 last:pb-0 relative">
                <span
                  className={`absolute -left-[3.5px] top-1 w-[6px] h-[6px] rounded-full ${
                    event.stage === 'ALERT_GENERATED' ? 'bg-sev-critical' : 'bg-sev-clear'
                  }`}
                />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] text-paper-100">{event.title}</span>
                  <span className="text-[11px] font-mono text-paper-600">+{event.elapsedMs}ms</span>
                </div>
                <p className="text-[12px] text-paper-400 mt-0.5 max-w-[70ch]">{event.description}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
