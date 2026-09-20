import React from 'react';
import { useNids } from '../context/NidsContext';
import { ThreatTable } from '../components/soc/ThreatTable';
import type { ThreatAlert } from '../types/threat';
import { ShieldAlert, Flame, CheckCircle } from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';

export const ThreatsPage: React.FC = () => {
  const { threats, setSelectedThreat } = useNids();

  const handleInvestigate = (threat: ThreatAlert) => {
    setSelectedThreat(threat);
  };

  const activeCount = threats.filter((t: ThreatAlert) => t.status === 'ACTIVE').length;
  const criticalCount = threats.filter((t: ThreatAlert) => t.severity === 'CRITICAL').length;
  const resolvedCount = threats.filter((t: ThreatAlert) => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Live Threat Feed & Incident Center
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
              AI INTRUSION ALERTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time classification, risk scoring, and Explainable AI (XAI) feature attribution for all detected anomalies
          </p>
        </div>
      </div>

      {/* Threat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Alerts"
          value={activeCount}
          subtitle="Awaiting Investigation"
          icon={ShieldAlert}
          color={activeCount > 0 ? 'red' : 'emerald'}
          trend={activeCount > 0 ? 'Action Required' : 'Clean'}
        />

        <MetricCard
          title="Critical Severity (SEV-1)"
          value={criticalCount}
          subtitle="DoS & Exfiltration"
          icon={Flame}
          color="red"
          badge="High Impact"
        />

        <MetricCard
          title="Mitigated & Resolved"
          value={resolvedCount}
          subtitle="SOC Validated"
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Full Threat Feed Table */}
      <ThreatTable onInvestigate={handleInvestigate} title="Comprehensive Incident Feed & Classifications" />
    </div>
  );
};
