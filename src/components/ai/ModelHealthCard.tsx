import React from 'react';
import { ModelMetricStats } from '../../types/ai';
import { Cpu } from 'lucide-react';

export const ModelHealthCard: React.FC<{ stats: ModelMetricStats }> = ({ stats }) => {
  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ink-900 border border-line-600 text-phos-400">
            <Cpu className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] text-paper-100">AI detection engine health</h3>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-phos-400">
                <span className="w-[6px] h-[6px] rounded-full bg-phos-400 shadow-live" />
                MODEL ONLINE
              </span>
            </div>
            <p className="text-[12px] text-paper-400">Hybrid XGBoost classifier + isolation forest anomaly engine</p>
          </div>
        </div>

        <div className="text-[12px] font-mono text-paper-600">
          Loaded version <span className="text-paper-100">{stats.modelVersion}</span>
        </div>
      </div>

      {/* Model Spec Grid */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-px bg-line-700 text-[12px] font-mono">
        <div className="p-3 bg-ink-900">
          <span className="text-paper-600 text-[10px] uppercase">Primary classifier</span>
          <div className="text-paper-100 mt-1">XGBoost v1.4</div>
          <span className="text-paper-600 text-[10px]">100 gradient estimators</span>
        </div>

        <div className="p-3 bg-ink-900">
          <span className="text-paper-600 text-[10px] uppercase">Anomaly engine</span>
          <div className="text-paper-100 mt-1">Isolation forest</div>
          <span className="text-paper-600 text-[10px]">Contamination rate 0.03</span>
        </div>

        <div className="p-3 bg-ink-900">
          <span className="text-paper-600 text-[10px] uppercase">Inference latency</span>
          <div className="text-phos-400 mt-1">{stats.averageInferenceTimeMs} ms / sample</div>
          <span className="text-paper-600 text-[10px]">Vectorized evaluation</span>
        </div>

        <div className="p-3 bg-ink-900">
          <span className="text-paper-600 text-[10px] uppercase">Total inferences</span>
          <div className="text-paper-100 mt-1">{stats.totalInferences.toLocaleString()}</div>
          <span className="text-paper-600 text-[10px]">{stats.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};
