import React from 'react';
import { InferenceInspection } from '../../types/ai';
import { RiskGauge } from '../common/RiskGauge';
import { BrainCircuit } from 'lucide-react';

export const RealtimeInferenceCard: React.FC<{ inference: InferenceInspection }> = ({ inference }) => {
  const isAttack = inference.predictedClass !== 'BENIGN';
  const isElevatedAnomaly = inference.anomalyScore > 0.6;

  return (
    <div className={`p-6 border transition-colors ${isAttack ? 'bg-ink-800 border-sev-critical/40 alert-glow-red' : 'bg-ink-800 border-line-700'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 border ${isAttack ? 'bg-ink-900 border-sev-critical/30 text-sev-critical' : 'bg-ink-900 border-phos-700 text-phos-400'}`}>
            <BrainCircuit className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-phos-600 uppercase tracking-wide">
                Current flow under AI evaluation
              </span>
              <span className="text-[10px] font-mono text-paper-600">real-time inference</span>
            </div>
            <h2 className="text-[16px] text-paper-100 font-mono mt-0.5">
              Prediction: <span className={isAttack ? 'text-sev-critical' : 'text-phos-400'}>{inference.predictedClass}</span>
            </h2>
          </div>
        </div>

        <span className="text-[12px] font-mono text-paper-600">Evaluated at {inference.timestamp}</span>
      </div>

      {/* Content Columns */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-px bg-line-700">
        {/* Risk Gauge */}
        <div className="lg:col-span-1 flex items-center justify-center bg-ink-850 p-4">
          <RiskGauge score={inference.riskScore} label="Evaluated risk score" />
        </div>

        {/* Inference Attributes Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-px bg-line-700 font-mono">
          <div className="p-3.5 bg-ink-850 flex flex-col justify-between">
            <span className="text-[10px] text-phos-600 uppercase">Source IP</span>
            <div className="text-[13px] text-paper-100 mt-1 truncate">{inference.sourceIp}</div>
            <span className="text-[10px] text-paper-600">PC 1 (attacker lab)</span>
          </div>

          <div className="p-3.5 bg-ink-850 flex flex-col justify-between">
            <span className="text-[10px] text-phos-600 uppercase">Destination IP</span>
            <div className="text-[13px] text-paper-100 mt-1 truncate">{inference.destinationIp}</div>
            <span className="text-[10px] text-paper-600">LAB-VICTIM target</span>
          </div>

          <div className="p-3.5 bg-ink-850 flex flex-col justify-between">
            <span className="text-[10px] text-phos-600 uppercase">Protocol</span>
            <div className="text-[13px] text-paper-100 mt-1">{inference.protocol}</div>
            <span className="text-[10px] text-paper-600">Ingested stream</span>
          </div>

          <div className="p-3.5 bg-ink-850 flex flex-col justify-between">
            <span className="text-[10px] text-phos-600 uppercase">Confidence</span>
            <div className="text-[18px] text-phos-400 mt-1">{(inference.confidence * 100).toFixed(1)}%</div>
            <span className="text-[10px] text-paper-600">Softmax max</span>
          </div>

          <div className="p-3.5 bg-ink-850 flex flex-col justify-between">
            <span className="text-[10px] text-phos-600 uppercase">Anomaly score</span>
            <div className={`text-[18px] mt-1 ${isElevatedAnomaly ? 'text-sev-medium' : 'text-phos-400'}`}>
              {inference.anomalyScore.toFixed(2)}
            </div>
            <span className="text-[10px] text-paper-600">Isolation forest score</span>
          </div>

          <div className="p-3.5 bg-ink-850 flex flex-col justify-between">
            <span className="text-[10px] text-phos-600 uppercase">Decision engine</span>
            <div className={`text-[13px] mt-1 ${isAttack ? 'text-sev-critical' : 'text-phos-400'}`}>
              {isAttack ? 'Threat flagged' : 'Normal baseline'}
            </div>
            <span className="text-[10px] text-paper-600">SOC sensor node</span>
          </div>
        </div>
      </div>
    </div>
  );
};
