import React from 'react';
import { ClassProbability } from '../../types/ai';
import { BarChart3 } from 'lucide-react';

export const ClassProbabilityBars: React.FC<{ probabilities: ClassProbability[] }> = ({ probabilities }) => {
  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-white">AI Multi-Class Probabilities</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Softmax Layer Output</span>
      </div>

      <div className="mt-4 space-y-3.5">
        {probabilities.map((item) => {
          const pct = (item.probability * 100).toFixed(1);

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={`font-semibold uppercase ${item.isDominant ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  {item.isDominant && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      DOMINANT
                    </span>
                  )}
                </div>

                <span className={`font-bold font-mono ${item.isDominant ? 'text-blue-400 text-sm' : 'text-slate-400'}`}>
                  {pct}%
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-[#080d17] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(item.probability * 100, item.probability > 0 ? 2 : 0)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-[#182438] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Loss Function: Multi-Logloss</span>
        <span className="text-slate-400">Confidence Threshold: 85%</span>
      </div>
    </div>
  );
};
