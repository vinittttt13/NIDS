import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Sparkles } from 'lucide-react';

export const FeatureImportanceChart: React.FC = () => {
  const { features } = useNids();

  // Top features sorted by importance
  const topFeatures = [...features].sort((a, b) => b.importance - a.importance).slice(0, 6);

  return (
    <div className="bg-ink-800 border border-line-700 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-line-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Feature importance (SHAP / Gini gain)</h3>
        </div>
        <span className="text-[11px] font-mono text-paper-600">Model explainability</span>
      </div>

      <div className="mt-4 space-y-3">
        {topFeatures.map((feat) => (
          <div key={feat.id} className="space-y-1">
            <div className="flex items-center justify-between text-[12px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-paper-100">{feat.name}</span>
                <span className="text-[10px] text-paper-600">({feat.category})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-paper-600 text-[11px]">Observed <strong className="text-paper-100">{String(feat.value)}</strong></span>
                <span className="text-phos-400 w-10 text-right">{feat.importance}%</span>
              </div>
            </div>

            <div className="w-full bg-ink-900 h-[3px]">
              <div className="bg-phos-400 h-full transition-all duration-500" style={{ width: `${feat.importance * 2.8}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-line-700 flex items-center justify-between text-[11px] font-mono text-paper-600">
        <span>Global explainer: TreeSHAP (Lundberg et al.)</span>
        <span>Normalized weight</span>
      </div>
    </div>
  );
};
