import React from 'react';
import { ThreatAlert } from '../../types/threat';
import { ThreatBadge } from '../common/ThreatBadge';
import { RiskGauge } from '../common/RiskGauge';
import { StatusPill } from '../common/Table';
import { X, ShieldAlert, BrainCircuit, Terminal, CheckCircle2, Sparkles, Download } from 'lucide-react';
import { useNids } from '../../context/NidsContext';

interface ThreatDetailModalProps {
  threat: ThreatAlert | null;
  onClose: () => void;
}

const XAI_TONE: Record<string, 'critical' | 'high' | 'medium' | 'ok'> = {
  EXCESSIVE: 'critical',
  ELEVATED: 'high',
  ABNORMAL: 'medium',
};

const XAI_BAR: Record<string, string> = {
  critical: 'bg-sev-critical',
  high: 'bg-sev-high',
  medium: 'bg-sev-medium',
  ok: 'bg-phos-400',
};

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="threat-modal-title"
    >
      <div className="bg-ink-800 border border-line-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-line-700 bg-ink-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sev-critical/10 border border-sev-critical/30 text-sev-critical">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 id="threat-modal-title" className="text-[16px] text-paper-100">{threat.attackType}</h2>
                <ThreatBadge severity={threat.severity} />
                <span className="text-[11px] font-mono text-paper-600 border border-line-600 px-1.5 py-0.5">
                  {threat.id}
                </span>
              </div>
              <p className="text-[12px] text-paper-400 mt-0.5">
                Scripted detection payload · {threat.packetCount.toLocaleString()} simulated frames
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadReportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 hover:bg-ink-700 border border-line-600 text-paper-300 text-[12px] font-mono transition-colors"
              title="Download incident JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export IOC</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-paper-600 hover:text-paper-200 transition-colors"
              aria-label="Close threat detail"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-line-700">
            <div className="md:col-span-1 bg-ink-850 p-4 flex flex-col items-center justify-center">
              <RiskGauge score={threat.riskScore} label="Evaluated risk" />
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-px bg-line-700">
              <Stat label="AI confidence" value={`${(threat.confidence * 100).toFixed(1)}%`} caption="XGBoost softmax" tone="phos" />
              <Stat label="Anomaly score" value={threat.anomalyScore.toFixed(2)} caption="Isolation forest distance" tone="phos" />
              <Stat label="Detection latency" value={`${threat.detectionLatencyMs} ms`} caption="End-to-end pipeline" tone="phos" />
              <Stat label="Source host" value={`${threat.sourceIp}:${threat.sourcePort}`} caption="Attacker lab machine" tone="paper" />
              <Stat label="Target host" value={`${threat.targetIp}:${threat.targetPort}`} caption="Isolated lab target" tone="paper" />
              <Stat label="Protocol & bytes" value={`${threat.protocol} · ${(threat.byteCount / 1024).toFixed(1)} KB`} caption={`${threat.packetCount} packets`} tone="paper" />
            </div>
          </div>

          {/* Explainable AI (XAI): why was this flagged */}
          <div className="bg-ink-850 border border-line-700 p-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-line-700">
              <BrainCircuit className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
              <div>
                <h3 className="text-[14px] text-paper-100">Why this was flagged</h3>
                <p className="text-[12px] text-paper-600 mt-0.5">
                  Feature contributions behind the classification decision, vs. benign baseline
                </p>
              </div>
            </div>

            <div className="space-y-2.5 font-mono">
              {threat.xaiFactors.map((factor, idx) => {
                const tone = XAI_TONE[factor.direction] ?? 'ok';
                return (
                  <div key={idx} className="p-3 bg-ink-900 border border-line-700">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="text-paper-100">{factor.factor}</span>
                        <StatusPill tone={tone}>{factor.direction}</StatusPill>
                      </div>

                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-paper-600">
                          Baseline <strong className="text-paper-300">{factor.baselineValue}</strong>
                        </span>
                        <span className="text-paper-600">→</span>
                        <span className="text-paper-600">
                          Observed <strong className="text-paper-100">{factor.observedValue}</strong>
                        </span>
                        <span className="text-phos-400">+{factor.weight}% weight</span>
                      </div>
                    </div>

                    <div className="mt-2 w-full bg-ink-700 h-[3px]">
                      <div className={`h-full transition-all duration-500 ${XAI_BAR[tone]}`} style={{ width: `${factor.weight * 2}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw sample & remediation guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-700">
            <div className="bg-ink-850 p-4 font-mono">
              <div className="flex items-center gap-2 mb-2 text-paper-300 text-[12px]">
                <Terminal className="w-3.5 h-3.5 text-phos-400" strokeWidth={1.75} />
                <span>Simulated raw packet sample</span>
              </div>
              <div className="p-3 bg-ink-900 border border-line-700 text-[11px] text-paper-100 leading-relaxed overflow-x-auto">
                {threat.rawPcapSample || 'No raw PCAP buffer available'}
              </div>
            </div>

            <div className="bg-ink-850 p-4">
              <div className="flex items-center gap-2 mb-2 text-paper-300 text-[12px] font-mono">
                <Sparkles className="w-3.5 h-3.5 text-phos-400" strokeWidth={1.75} />
                <span>Automated remediation guidance</span>
              </div>
              <p className="text-[12px] text-paper-100 leading-relaxed p-3 bg-ink-900 border border-line-700">
                {threat.modelRecommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-line-700 bg-ink-850 flex items-center justify-between">
          <span className="text-[12px] font-mono text-paper-600">
            Detected {threat.timestamp} ({threat.isoTime})
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-ink-900 hover:bg-ink-700 border border-line-600 text-paper-300 text-[12px] transition-colors"
            >
              Close
            </button>

            {!isResolved ? (
              <button
                onClick={() => {
                  resolveThreat(threat.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-phos-400 hover:bg-phos-500 text-ink-950 text-[12px] font-medium transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark resolved</span>
              </button>
            ) : (
              <span className="text-[12px] font-mono text-phos-400 flex items-center gap-1.5 px-3 py-1.5 bg-phos-900 border border-phos-700">
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

const Stat: React.FC<{ label: string; value: string; caption: string; tone: 'phos' | 'paper' }> = ({ label, value, caption, tone }) => (
  <div className="bg-ink-850 p-3.5 flex flex-col justify-between gap-1">
    <span className="text-[10px] font-mono uppercase tracking-wide text-phos-600">{label}</span>
    <span className={`text-[18px] font-mono font-medium truncate ${tone === 'phos' ? 'text-phos-400' : 'text-paper-100'}`}>
      {value}
    </span>
    <span className="text-[10px] font-mono text-paper-600">{caption}</span>
  </div>
);
