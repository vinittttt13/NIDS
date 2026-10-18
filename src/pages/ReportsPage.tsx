import React, { useState } from 'react';
import { useNids } from '../context/NidsContext';
import { FileText, Download, Printer, CheckCircle, Activity, ShieldAlert, Cpu } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { telemetry, modelStats, threats, hosts } = useNids();
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generationTime, setGenerationTime] = useState('');

  const handleGenerateReport = () => {
    setGenerationTime(new Date().toLocaleString());
    setReportGenerated(true);
  };

  const handleExportJson = () => {
    const reportData = {
      reportTitle: 'AI-NIDS Laboratory Security & AI Evaluation Report',
      timestamp: new Date().toISOString(),
      networkSummary: {
        totalPackets: telemetry.packetsPerSec * 3600,
        activeFlows: telemetry.activeFlowsCount,
        subnet: '192.168.100.0/24',
        activeHosts: hosts.length,
      },
      securitySummary: {
        totalThreatsDetected: telemetry.threatsDetectedCount,
        criticalThreats: telemetry.criticalThreatsCount,
        detectionRate: `${telemetry.aiDetectionRate}%`,
        threatFeed: threats,
      },
      aiModelPerformance: {
        modelType: modelStats.modelType,
        accuracy: `${modelStats.accuracy}%`,
        precision: `${modelStats.precision}%`,
        recall: `${modelStats.recall}%`,
        f1Score: `${modelStats.f1Score}%`,
        falsePositiveRate: `${modelStats.falsePositiveRate}%`,
        avgInferenceTime: `${modelStats.averageInferenceTimeMs}ms`,
        avgDetectionLatency: `${telemetry.avgDetectionLatencyMs}ms`,
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `AI_NIDS_SOC_Report_${Date.now()}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <h1 className="text-xl font-medium text-paper-100">Security & AI performance reports</h1>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[70ch]">
            Generate printable and exportable incident telemetry, model validation metrics, and flow audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-ink-900 hover:bg-ink-700 border border-line-600 text-paper-300 text-[12px] font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-phos-400 hover:bg-phos-500 text-ink-950 text-[12px] font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate report</span>
          </button>
        </div>
      </div>

      {reportGenerated && (
        <div className="p-4 bg-phos-900 border border-phos-700 flex items-center justify-between text-[12px] font-mono text-phos-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>SOC audit report generated at {generationTime}</span>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 hover:text-phos-300 transition-colors">
            <Printer className="w-3.5 h-3.5" />
            <span>Print report</span>
          </button>
        </div>
      )}

      {/* Network Summary */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line-700">
          <Activity className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Network telemetry summary</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line-700 font-mono text-[12px]">
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Peak packet rate</span>
            <div className="text-[18px] text-paper-100 mt-1">{telemetry.packetsPerSec.toLocaleString()} pkts/s</div>
          </div>
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Active flows tracked</span>
            <div className="text-[18px] text-paper-100 mt-1">{telemetry.activeFlowsCount.toLocaleString()}</div>
          </div>
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Throughput</span>
            <div className="text-[18px] text-paper-100 mt-1">{(telemetry.bytesPerSec / 1024 / 1024).toFixed(2)} MB/s</div>
          </div>
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Active lab hosts</span>
            <div className="text-[18px] text-paper-100 mt-1">{hosts.length} devices</div>
          </div>
        </div>
      </div>

      {/* Security & Threat Summary */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line-700">
          <ShieldAlert className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Security detections & incident distribution</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line-700 font-mono text-[12px]">
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Total threats logged</span>
            <div className="text-[18px] text-paper-100 mt-1">{telemetry.threatsDetectedCount}</div>
          </div>
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Critical incidents</span>
            <div className={`text-[18px] mt-1 ${telemetry.criticalThreatsCount > 0 ? 'text-sev-critical' : 'text-phos-400'}`}>
              {telemetry.criticalThreatsCount}
            </div>
          </div>
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Detection accuracy</span>
            <div className="text-[18px] text-phos-400 mt-1">{telemetry.aiDetectionRate}%</div>
          </div>
          <div className="p-3.5 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Mean detection latency</span>
            <div className="text-[18px] text-phos-400 mt-1">{telemetry.avgDetectionLatencyMs} ms</div>
          </div>
        </div>
      </div>

      {/* AI Model Performance */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line-700">
          <Cpu className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Supervised model benchmark validation</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-line-700 font-mono text-[12px]">
          <div className="p-3 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Accuracy</span>
            <div className="text-[16px] text-phos-400 mt-0.5">{modelStats.accuracy}%</div>
          </div>
          <div className="p-3 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Precision</span>
            <div className="text-[16px] text-phos-400 mt-0.5">{modelStats.precision}%</div>
          </div>
          <div className="p-3 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Recall</span>
            <div className="text-[16px] text-phos-400 mt-0.5">{modelStats.recall}%</div>
          </div>
          <div className="p-3 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">F1 score</span>
            <div className="text-[16px] text-phos-400 mt-0.5">{modelStats.f1Score}%</div>
          </div>
          <div className="p-3 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">False positives</span>
            <div className="text-[16px] text-phos-400 mt-0.5">{modelStats.falsePositiveRate}%</div>
          </div>
          <div className="p-3 bg-ink-900">
            <span className="text-paper-600 text-[10px] uppercase">Inference time</span>
            <div className="text-[16px] text-phos-400 mt-0.5">{modelStats.averageInferenceTimeMs}ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
