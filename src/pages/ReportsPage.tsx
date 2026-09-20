import React, { useState } from 'react';
import { useNids } from '../context/NidsContext';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle, 
  ShieldAlert, 
  Activity, 
  Cpu
} from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Security & AI Performance Reports
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              AUDIT & ANALYTICS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable and exportable incident telemetry, model validation metrics, and flow audits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-blue-500/20"
          >
            <FileText className="w-4 h-4" />
            <span>GENERATE REPORT</span>
          </button>
        </div>
      </div>

      {reportGenerated && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Comprehensive SOC Audit Report generated successfully at {generationTime}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-emerald-400 underline hover:text-white"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      )}

      {/* Report Section 1: Network Summary */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#182438]">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base text-white">1. Network Telemetry Summary</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Peak Packet Rate</span>
            <div className="text-xl font-bold text-white mt-1">{telemetry.packetsPerSec.toLocaleString()} pkts/s</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Active Flows Tracked</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">{telemetry.activeFlowsCount.toLocaleString()}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Throughput</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{(telemetry.bytesPerSec / 1024 / 1024).toFixed(2)} MB/s</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Active Lab Hosts</span>
            <div className="text-xl font-bold text-white mt-1">{hosts.length} Devices</div>
          </div>
        </div>
      </div>

      {/* Report Section 2: Security & Threat Summary */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#182438]">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h3 className="font-bold text-base text-white">2. Security Detections & Incident Distribution</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Total Threats Logged</span>
            <div className="text-xl font-bold text-white mt-1">{telemetry.threatsDetectedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Critical Incidents</span>
            <div className="text-xl font-bold text-red-400 mt-1">{telemetry.criticalThreatsCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Detection Accuracy</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{telemetry.aiDetectionRate}%</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px] uppercase">Mean Detection Latency</span>
            <div className="text-xl font-bold text-purple-400 mt-1">{telemetry.avgDetectionLatencyMs} ms</div>
          </div>
        </div>
      </div>

      {/* Report Section 3: AI Model Performance */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#182438]">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-base text-white">3. Supervised Model Benchmark Validation</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px]">ACCURACY</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{modelStats.accuracy}%</div>
          </div>
          <div className="p-3 rounded-lg bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px]">PRECISION</span>
            <div className="text-lg font-bold text-blue-400 mt-0.5">{modelStats.precision}%</div>
          </div>
          <div className="p-3 rounded-lg bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px]">RECALL</span>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">{modelStats.recall}%</div>
          </div>
          <div className="p-3 rounded-lg bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px]">F1-SCORE</span>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{modelStats.f1Score}%</div>
          </div>
          <div className="p-3 rounded-lg bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px]">FALSE POSITIVES</span>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{modelStats.falsePositiveRate}%</div>
          </div>
          <div className="p-3 rounded-lg bg-[#080d17] border border-[#162238]">
            <span className="text-slate-400 text-[10px]">INFERENCE TIME</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{modelStats.averageInferenceTimeMs}ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
