import React from 'react';
import { useNids } from '../../context/NidsContext';
import { 
  Network, 
  Binary, 
  Sliders, 
  Cpu, 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export const PipelineVisualizer: React.FC = () => {
  const { activeAttack, featureSchema, aiInference } = useNids();

  const isAttack = aiInference.predictedClass !== 'BENIGN';

  const stages = [
    {
      id: 'p1',
      title: 'Network Flow Ingestion',
      subtitle: 'Zeek Raw Mirror Stream',
      icon: Network,
      status: '✓ STREAMING',
      latency: '2ms',
      meta: 'SPAN Port 8 (192.168.100.30)',
      color: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    },
    {
      id: 'p2',
      title: 'Feature Extraction',
      subtitle: featureSchema === '78_FEATURES' ? '78 Statistical Features' : '41 Basic Flow Features',
      icon: Binary,
      status: '✓ EXTRACTED',
      latency: '42ms',
      meta: 'Bi-directional Flow Statistics',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    },
    {
      id: 'p3',
      title: 'Preprocessing & Scaling',
      subtitle: 'RobustScaler + Z-Score',
      icon: Sliders,
      status: '✓ NORMALIZED',
      latency: '3ms',
      meta: 'Normalized Vector Matrix',
      color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    },
    {
      id: 'p4',
      title: 'AI Classifier',
      subtitle: 'XGBoost v1.4 (Multi-class)',
      icon: Cpu,
      status: isAttack ? `✓ ${aiInference.predictedClass}` : '✓ BENIGN',
      latency: '14ms',
      meta: `Confidence: ${(aiInference.confidence * 100).toFixed(1)}%`,
      color: isAttack ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'p5',
      title: 'Anomaly Detector',
      subtitle: 'Isolation Forest Engine',
      icon: ShieldAlert,
      status: `✓ Score: ${aiInference.anomalyScore.toFixed(2)}`,
      latency: '8ms',
      meta: aiInference.anomalyScore > 0.6 ? 'Anomaly Outlier Flagged' : 'Within Baseline Variance',
      color: aiInference.anomalyScore > 0.6 ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    },
    {
      id: 'p6',
      title: 'Risk Scoring Engine',
      subtitle: 'Threat & Context Weighting',
      icon: Scale,
      status: `✓ Risk: ${aiInference.riskScore}/100`,
      latency: '4ms',
      meta: isAttack ? 'Critical Alert Trigger' : 'Normal Telemetry',
      color: aiInference.riskScore >= 75 ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
  ];

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base text-white font-mono">End-to-End AI Processing Pipeline</h3>
        </div>
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Total Pipeline Latency: <strong className="text-emerald-400">~73 ms</strong></span>
        </div>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div key={st.id} className="relative group">
              <div className={`p-4 rounded-xl border ${st.color} flex flex-col justify-between h-full shadow-md bg-[#0a101d] transition-transform hover:-translate-y-0.5`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">STEP 0{idx + 1}</span>
                    <Icon className="w-4 h-4" />
                  </div>

                  <h4 className="text-xs font-bold text-white mt-2 font-sans">{st.title}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#162238] space-y-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-300">{st.status}</span>
                    <span className="text-slate-400">{st.latency}</span>
                  </div>
                  <div className="text-slate-400 truncate">{st.meta}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
