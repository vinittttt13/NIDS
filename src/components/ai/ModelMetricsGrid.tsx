import React from 'react';
import { ModelMetricStats } from '../../types/ai';
import { Target, CheckCircle, Flame, ShieldAlert, Cpu, AlertCircle } from 'lucide-react';

export const ModelMetricsGrid: React.FC<{ stats: ModelMetricStats }> = ({ stats }) => {
  const metrics = [
    {
      label: 'Accuracy',
      value: `${stats.accuracy.toFixed(1)}%`,
      desc: 'Overall Classification Match',
      color: 'text-emerald-400',
      bg: 'border-emerald-500/20 bg-emerald-500/5',
      icon: Target,
    },
    {
      label: 'Precision',
      value: `${stats.precision.toFixed(1)}%`,
      desc: 'True Positive / Predicted Positives',
      color: 'text-blue-400',
      bg: 'border-blue-500/20 bg-blue-500/5',
      icon: CheckCircle,
    },
    {
      label: 'Recall (Sensitivity)',
      value: `${stats.recall.toFixed(1)}%`,
      desc: 'Detected Attacks / Total Actual Attacks',
      color: 'text-cyan-400',
      bg: 'border-cyan-500/20 bg-cyan-500/5',
      icon: Flame,
    },
    {
      label: 'F1 Score',
      value: `${stats.f1Score.toFixed(1)}%`,
      desc: 'Harmonic Mean Precision & Recall',
      color: 'text-purple-400',
      bg: 'border-purple-500/20 bg-purple-500/5',
      icon: ShieldAlert,
    },
    {
      label: 'False Positive Rate',
      value: `${stats.falsePositiveRate.toFixed(1)}%`,
      desc: 'Benign Flows Flagged in Error',
      color: 'text-amber-400',
      bg: 'border-amber-500/20 bg-amber-500/5',
      icon: AlertCircle,
    },
    {
      label: 'Inference Time',
      value: `${stats.averageInferenceTimeMs}ms`,
      desc: 'Mean Per-Flow XGBoost Evaluation',
      color: 'text-emerald-400',
      bg: 'border-emerald-500/20 bg-emerald-500/5',
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono font-bold uppercase text-slate-400">
          Supervised Model Validation Performance
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
          MODEL / DEMO METRICS
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`p-3.5 rounded-xl border ${m.bg} flex flex-col justify-between shadow-sm transition-transform hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">{m.label}</span>
                <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
              <div className="my-2">
                <span className={`text-2xl font-extrabold font-mono ${m.color}`}>
                  {m.value}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {m.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
