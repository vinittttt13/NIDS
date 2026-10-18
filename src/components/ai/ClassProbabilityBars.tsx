import React from 'react';
import { ClassProbability } from '../../types/ai';
import { BarChart3 } from 'lucide-react';

const isBenignLabel = (label: string) => /benign|normal/i.test(label);

export const ClassProbabilityBars: React.FC<{ probabilities: ClassProbability[] }> = ({ probabilities }) => {
  return (
    <div className="bg-ink-800 border border-line-700 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-line-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">AI multi-class probabilities</h3>
        </div>
        <span className="text-[11px] font-mono text-paper-600">Softmax layer output</span>
      </div>

      <div className="mt-4 space-y-3">
        {probabilities.map((item) => {
          const pct = (item.probability * 100).toFixed(1);
          // Dominant benign/normal reads healthy; a dominant attack class is
          // the one row that genuinely matters — everything else in the
          // long tail stays neutral rather than a rainbow per class name.
          const tone = isBenignLabel(item.label) ? 'phos' : item.isDominant ? 'critical' : 'neutral';
          const textClass = tone === 'phos' ? 'text-phos-400' : tone === 'critical' ? 'text-sev-critical' : 'text-paper-600';
          const barClass = tone === 'phos' ? 'bg-phos-400' : tone === 'critical' ? 'bg-sev-critical' : 'bg-line-500';

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-[12px] font-mono">
                <div className="flex items-center gap-2">
                  <span className={item.isDominant ? 'text-paper-100' : 'text-paper-400'}>{item.label}</span>
                  {item.isDominant && <span className="text-[10px] text-paper-600 border border-line-600 px-1 py-0.5">DOMINANT</span>}
                </div>
                <span className={textClass}>{pct}%</span>
              </div>

              <div className="w-full bg-ink-900 h-[3px]">
                <div
                  className={`h-full transition-all duration-700 ease-out ${barClass}`}
                  style={{ width: `${Math.max(item.probability * 100, item.probability > 0 ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-line-700 flex items-center justify-between text-[11px] font-mono text-paper-600">
        <span>Loss function: multi-logloss</span>
        <span>Confidence threshold: 85%</span>
      </div>
    </div>
  );
};
