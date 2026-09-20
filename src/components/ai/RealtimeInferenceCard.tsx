import React from 'react';
import { InferenceInspection } from '../../types/ai';
import { RiskGauge } from '../common/RiskGauge';
import { BrainCircuit, Activity, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export const RealtimeInferenceCard: React.FC<{ inference: InferenceInspection }> = ({ inference }) => {
  const isAttack = inference.predictedClass !== 'BENIGN';

  return (
    <div className={`p-6 rounded-2xl border shadow-2xl transition-all relative overflow-hidden ${
      isAttack 
        ? 'bg-gradient-to-br from-[#1c0d18] via-[#0e1626] to-[#0a101d] border-red-500/40 alert-glow-red' 
        : 'bg-[#0e1626] border-[#1a273d]'
    }`}>
      {/* Background Accent Grid */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isAttack ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                CURRENT FLOW UNDER AI EVALUATION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                REAL-TIME INFERENCE
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-wide font-mono mt-0.5">
              PREDICTION: <span className={isAttack ? 'text-red-400 animate-pulse' : 'text-emerald-400'}>{inference.predictedClass}</span>
            </h2>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Evaluated at {inference.timestamp}</span>
        </div>
      </div>

      {/* Content Columns */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Risk Gauge */}
        <div className="lg:col-span-1 flex items-center justify-center bg-[#080d17] p-4 rounded-xl border border-[#162238]">
          <RiskGauge score={inference.riskScore} label="Evaluated Risk Score" />
        </div>

        {/* Inference Attributes Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">SOURCE IP</span>
            <div className="text-sm font-bold text-red-300 mt-1 truncate">{inference.sourceIp}</div>
            <span className="text-[10px] text-slate-400">PC 1 (Attacker Lab)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">DESTINATION IP</span>
            <div className="text-sm font-bold text-emerald-300 mt-1 truncate">{inference.destinationIp}</div>
            <span className="text-[10px] text-slate-400">LAB-VICTIM Target</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">PROTOCOL</span>
            <div className="text-sm font-bold text-white mt-1">{inference.protocol}</div>
            <span className="text-[10px] text-slate-400">Ingested Stream</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">CONFIDENCE</span>
            <div className="text-xl font-extrabold text-blue-400 mt-1">
              {(inference.confidence * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-400">XGBoost Softmax Max</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">ANOMALY SCORE</span>
            <div className={`text-xl font-extrabold mt-1 ${inference.anomalyScore > 0.6 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {inference.anomalyScore.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Isolation Forest Score</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">DECISION ENGINE</span>
            <div className="text-xs font-bold text-cyan-400 mt-1">
              {isAttack ? '🚨 Threat Flagged' : '✓ Normal Baseline'}
            </div>
            <span className="text-[10px] text-slate-400">SOC Sensor Node</span>
          </div>
        </div>
      </div>
    </div>
  );
};
