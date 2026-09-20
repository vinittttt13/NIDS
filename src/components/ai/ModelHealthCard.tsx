import React from 'react';
import { ModelMetricStats } from '../../types/ai';
import { Cpu, CheckCircle2, Zap, Clock, Database, Layers } from 'lucide-react';

export const ModelHealthCard: React.FC<{ stats: ModelMetricStats }> = ({ stats }) => {
  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">AI Detection Engine Health</h3>
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MODEL ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400">Hybrid XGBoost Classifier + Isolation Forest Anomaly Engine</p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Loaded Version: <strong className="text-white">{stats.modelVersion}</strong>
        </div>
      </div>

      {/* Model Spec Grid */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-[#080d17] border border-[#152033]">
          <span className="text-slate-400 text-[10px] uppercase">Primary Classifier</span>
          <div className="font-bold text-white mt-1">XGBoost v1.4</div>
          <span className="text-slate-400 text-[10px]">100 Gradient Estimators</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d17] border border-[#152033]">
          <span className="text-slate-400 text-[10px] uppercase">Anomaly Engine</span>
          <div className="font-bold text-amber-400 mt-1">Isolation Forest</div>
          <span className="text-slate-400 text-[10px]">Contamination Rate 0.03</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d17] border border-[#152033]">
          <span className="text-slate-400 text-[10px] uppercase">Inference Latency</span>
          <div className="font-bold text-emerald-400 mt-1">{stats.averageInferenceTimeMs} ms / sample</div>
          <span className="text-slate-400 text-[10px]">C++ SIMD Vectorized</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d17] border border-[#152033]">
          <span className="text-slate-400 text-[10px] uppercase">Total Inferences</span>
          <div className="font-bold text-cyan-400 mt-1">{stats.totalInferences.toLocaleString()}</div>
          <span className="text-slate-400 text-[10px]">{stats.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};
