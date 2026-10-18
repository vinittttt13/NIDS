import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Network, Binary, Sliders, Cpu, ShieldAlert, Scale, CheckCircle2 } from 'lucide-react';

type Tone = 'phos' | 'critical' | 'medium';

const TONE_TEXT: Record<Tone, string> = {
  phos: 'text-phos-400',
  critical: 'text-sev-critical',
  medium: 'text-sev-medium',
};

const TONE_EDGE: Record<Tone, string> = {
  phos: 'before:bg-phos-400',
  critical: 'before:bg-sev-critical',
  medium: 'before:bg-sev-medium',
};

export const PipelineVisualizer: React.FC = () => {
  const { featureSchema, aiInference } = useNids();

  const isAttack = aiInference.predictedClass !== 'BENIGN';
  const isElevatedAnomaly = aiInference.anomalyScore > 0.6;
  const isHighRisk = aiInference.riskScore >= 75;

  const stages: { id: string; title: string; subtitle: string; icon: typeof Network; status: string; latency: string; meta: string; tone: Tone }[] = [
    {
      id: 'p1',
      title: 'Network flow ingestion',
      subtitle: 'Simulated mirror stream',
      icon: Network,
      status: 'STREAMING',
      latency: '2ms',
      meta: 'SPAN port 8 (simulated)',
      tone: 'phos',
    },
    {
      id: 'p2',
      title: 'Feature extraction',
      subtitle: featureSchema === '78_FEATURES' ? '78 statistical features' : '41 basic flow features',
      icon: Binary,
      status: 'EXTRACTED',
      latency: '42ms',
      meta: 'Bi-directional flow statistics',
      tone: 'phos',
    },
    {
      id: 'p3',
      title: 'Preprocessing & scaling',
      subtitle: 'RobustScaler + z-score',
      icon: Sliders,
      status: 'NORMALIZED',
      latency: '3ms',
      meta: 'Normalized vector matrix',
      tone: 'phos',
    },
    {
      id: 'p4',
      title: 'AI classifier',
      subtitle: 'XGBoost v1.4 (multi-class)',
      icon: Cpu,
      status: isAttack ? aiInference.predictedClass : 'BENIGN',
      latency: '14ms',
      meta: `Confidence ${(aiInference.confidence * 100).toFixed(1)}%`,
      tone: isAttack ? 'critical' : 'phos',
    },
    {
      id: 'p5',
      title: 'Anomaly detector',
      subtitle: 'Isolation forest engine',
      icon: ShieldAlert,
      status: `Score ${aiInference.anomalyScore.toFixed(2)}`,
      latency: '8ms',
      meta: isElevatedAnomaly ? 'Anomaly outlier flagged' : 'Within baseline variance',
      tone: isElevatedAnomaly ? 'medium' : 'phos',
    },
    {
      id: 'p6',
      title: 'Risk scoring engine',
      subtitle: 'Threat & context weighting',
      icon: Scale,
      status: `Risk ${aiInference.riskScore}/100`,
      latency: '4ms',
      meta: isAttack ? 'Critical alert trigger' : 'Normal telemetry',
      tone: isHighRisk ? 'critical' : 'phos',
    },
  ];

  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">End-to-end AI processing pipeline</h3>
        </div>
        <span className="text-[12px] font-mono text-paper-600">
          Total pipeline latency <span className="text-phos-400">~73 ms</span>
        </span>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-px bg-line-700">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              className={`relative before:absolute before:inset-y-0 before:left-0 before:w-[2px] ${TONE_EDGE[st.tone]} bg-ink-900 p-3.5 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-phos-600">STEP 0{idx + 1}</span>
                  <Icon className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
                </div>

                <h4 className="text-[12px] text-paper-100 mt-2">{st.title}</h4>
                <p className="text-[11px] text-paper-600 font-mono mt-0.5">{st.subtitle}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-line-700 space-y-1 font-mono text-[10px]">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 ${TONE_TEXT[st.tone]}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {st.status}
                  </span>
                  <span className="text-paper-600">{st.latency}</span>
                </div>
                <div className="text-paper-600 truncate">{st.meta}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
