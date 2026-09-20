import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Sparkles, BarChart2 } from 'lucide-react';

export const FeatureImportanceChart: React.FC = () => {
  const { features } = useNids();

  // Top features sorted by importance
  const topFeatures = [...features].sort((a, b) => b.importance - a.importance).slice(0, 6);

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white">Feature Importance (SHAP / Gini Gain)</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Model Explainability</span>
      </div>

      <div className="mt-4 space-y-3">
        {topFeatures.map((feat) => (
          <div key={feat.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{feat.name}</span>
                <span className="text-[10px] text-slate-400">({feat.category})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Observed: <strong className="text-white">{String(feat.value)}</strong></span>
                <span className="font-bold text-blue-400 w-10 text-right">{feat.importance}%</span>
              </div>
            </div>

            <div className="w-full bg-[#080d17] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${feat.importance * 2.8}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#182438] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Global Explainer: TreeSHAP (Lundberg et al.)</span>
        <span className="text-blue-400">Normalized Weight</span>
      </div>
    </div>
  );
};
