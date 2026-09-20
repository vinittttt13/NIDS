import React from 'react';
import { ThreatAlert } from '../../types/threat';
import { ThreatBadge } from '../common/ThreatBadge';
import { RiskGauge } from '../common/RiskGauge';
import { 
  X, 
  ShieldAlert, 
  BrainCircuit, 
  Clock, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';
import { useNids } from '../../context/NidsContext';

interface ThreatDetailModalProps {
  threat: ThreatAlert | null;
  onClose: () => void;
}

export const ThreatDetailModal: React.FC<ThreatDetailModalProps> = ({ threat, onClose }) => {
  const { resolveThreat } = useNids();

  if (!threat) return null;

  const isResolved = threat.status === 'RESOLVED';

  const downloadReportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(threat, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AI_NIDS_IOC_${threat.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1220] border border-[#1e2d4a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#182438] flex items-center justify-between bg-[#0e1626]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide font-sans">{threat.attackType}</h2>
                <ThreatBadge severity={threat.severity} />
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {threat.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed by Port Mirror Sensor (SPAN-08) • Extracted {threat.packetCount.toLocaleString()} frames
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadReportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
              title="Download Incident JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export IOC</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#141f33] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Risk Score */}
            <div className="md:col-span-1 bg-[#0e1626] border border-[#1a273d] rounded-xl p-4 flex flex-col items-center justify-center">
              <RiskGauge score={threat.riskScore} label="Evaluated Risk" />
            </div>

            {/* AI Confidence & Metrics */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">AI Confidence</span>
                <span className="text-2xl font-extrabold font-mono text-blue-400">
                  {(threat.confidence * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">XGBoost v1.4 Softmax</span>
              </div>

              <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">Anomaly Score</span>
                <span className="text-2xl font-extrabold font-mono text-amber-400">
                  {threat.anomalyScore.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Isolation Forest Distance</span>
              </div>

              <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">Detection Latency</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400">
                  {threat.detectionLatencyMs} ms
                </span>
                <span className="text-[10px] text-slate-500 font-mono">End-to-End Pipeline</span>
              </div>

              <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">Source Host</span>
                <span className="text-sm font-bold font-mono text-red-400 truncate">
                  {threat.sourceIp}:{threat.sourcePort}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Attacker Lab Machine</span>
              </div>

              <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">Target Host</span>
                <span className="text-sm font-bold font-mono text-emerald-400 truncate">
                  {threat.targetIp}:{threat.targetPort}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Isolated Lab Target</span>
              </div>

              <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400">Protocol & Bytes</span>
                <span className="text-sm font-bold font-mono text-white">
                  {threat.protocol} • {(threat.byteCount / 1024).toFixed(1)} KB
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{threat.packetCount} packets</span>
              </div>
            </div>
          </div>

          {/* Explainable AI (XAI): WHY WAS THIS FLAGGED? */}
          <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#182438]">
              <BrainCircuit className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Explainable AI (XAI) Attribution — Why Was This Flagged?
                </h3>
                <p className="text-xs text-slate-400">
                  Feature contributions to XGBoost classification decision vs benign baseline
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono">
              {threat.xaiFactors.map((factor, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#0a101c] border border-[#18253b]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="font-semibold text-slate-200">{factor.factor}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-bold ${
                        factor.direction === 'EXCESSIVE' ? 'bg-red-500/20 text-red-400' :
                        factor.direction === 'ELEVATED' ? 'bg-orange-500/20 text-orange-400' :
                        factor.direction === 'ABNORMAL' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {factor.direction}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-slate-400">
                        Baseline: <strong className="text-slate-300">{factor.baselineValue}</strong>
                      </span>
                      <span>→</span>
                      <span className="text-red-400">
                        Observed: <strong className="text-white">{factor.observedValue}</strong>
                      </span>
                      <span className="text-blue-400 font-bold">
                        +{factor.weight}% Weight
                      </span>
                    </div>
                  </div>

                  {/* Horizontal weight bar */}
                  <div className="mt-2 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${factor.weight * 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Recommendation & Raw Packet Sample */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Packet Trace */}
            <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-4 font-mono">
              <div className="flex items-center gap-2 mb-2 text-slate-300 text-xs font-semibold">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Sensor Raw Packet Sample (tcpdump)</span>
              </div>
              <div className="p-3 rounded bg-[#070b13] border border-[#162238] text-[11px] text-emerald-400 leading-relaxed overflow-x-auto">
                {threat.rawPcapSample || 'No raw PCAP buffer available'}
              </div>
            </div>

            {/* SOC Mitigation Guidance */}
            <div className="bg-[#0e1626] border border-[#1a273d] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-slate-300 text-xs font-semibold font-mono">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Automated Remediation Guidance</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed p-3 rounded bg-[#070b13] border border-[#162238]">
                {threat.modelRecommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#182438] bg-[#0e1626] flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            Detected: {threat.timestamp} ({threat.isoTime})
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Close
            </button>

            {!isResolved ? (
              <button
                onClick={() => {
                  resolveThreat(threat.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Threat Resolved</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
