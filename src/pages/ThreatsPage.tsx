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
      <div className="pb-4 border-b border-line-700">
        <h1 className="text-xl font-medium text-paper-100">Threat feed</h1>
        <p className="text-[13px] text-paper-400 mt-1 max-w-[62ch]">
          Every detection, with its risk score and the feature attribution behind it. Investigate an entry to see the full breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line-700">
        <MetricCard
          title="Active alerts"
          value={activeCount}
          subtitle="Awaiting investigation"
          icon={ShieldAlert}
          tone={activeCount > 0 ? 'critical' : 'clear'}
          trend={activeCount > 0 ? 'Action required' : 'Clean'}
        />

        <MetricCard
          title="Critical severity"
          value={criticalCount}
          subtitle="DoS & exfiltration patterns"
          icon={Flame}
          tone={criticalCount > 0 ? 'critical' : 'neutral'}
        />

        <MetricCard
          title="Resolved"
          value={resolvedCount}
          subtitle="Reviewed and closed"
          icon={CheckCircle}
          tone="clear"
        />
      </div>

      <ThreatTable onInvestigate={handleInvestigate} title="All detections" />
    </div>
  );
};
