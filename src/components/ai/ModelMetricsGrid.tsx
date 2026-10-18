import React from 'react';
import { ModelMetricStats } from '../../types/ai';
import { Target, CheckCircle, Flame, ShieldAlert, Cpu, AlertCircle } from 'lucide-react';
import { StatusPill } from '../common/Table';

export const ModelMetricsGrid: React.FC<{ stats: ModelMetricStats }> = ({ stats }) => {
  const metrics = [
    { label: 'Accuracy', value: `${stats.accuracy.toFixed(1)}%`, desc: 'Overall classification match', icon: Target },
    { label: 'Precision', value: `${stats.precision.toFixed(1)}%`, desc: 'True positive / predicted positives', icon: CheckCircle },
    { label: 'Recall', value: `${stats.recall.toFixed(1)}%`, desc: 'Detected attacks / total actual attacks', icon: Flame },
    { label: 'F1 score', value: `${stats.f1Score.toFixed(1)}%`, desc: 'Harmonic mean of precision & recall', icon: ShieldAlert },
    { label: 'False positive rate', value: `${stats.falsePositiveRate.toFixed(1)}%`, desc: 'Benign flows flagged in error', icon: AlertCircle },
    { label: 'Inference time', value: `${stats.averageInferenceTimeMs}ms`, desc: 'Mean per-flow evaluation', icon: Cpu },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-phos-600 uppercase tracking-wide">
          Supervised model validation performance
        </span>
        <StatusPill tone="neutral">DEMO METRICS</StatusPill>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-line-700">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-3.5 bg-ink-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-paper-600 uppercase">{m.label}</span>
                <Icon className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
              </div>
              <div className="my-2">
                <span className="text-[22px] font-mono font-medium text-phos-400">{m.value}</span>
              </div>
              <p className="text-[10px] text-paper-600 leading-tight">{m.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
