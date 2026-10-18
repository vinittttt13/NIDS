import React from 'react';
import { useNids } from '../context/NidsContext';
import { MetricCard } from '../components/common/MetricCard';
import { LiveTrafficChart } from '../components/soc/LiveTrafficChart';
import { ThreatTable } from '../components/soc/ThreatTable';
import { ProtocolPieChart } from '../components/soc/ProtocolPieChart';
import { AttackExecutionTimeline } from '../components/attack/AttackExecutionTimeline';
import { LabActivityCard } from '../components/soc/LabActivityCard';
import { Activity, Layers, ShieldAlert, Crosshair, Cpu } from 'lucide-react';
import type { ThreatAlert } from '../types/threat';

interface OverviewPageProps {
  onNavigateToAttackLab: () => void;
  onNavigateToAiEngine: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToAttackLab,
}) => {
  const {
    telemetry,
    clientRole,
    connectionStatus,
    labAttacks,
    activeLabAttacksCount,
    controlEventsCount,
    setSelectedThreat,
  } = useNids();

  const handleInvestigate = (threat: ThreatAlert) => {
    setSelectedThreat(threat);
  };

  const hasThreats = telemetry.threatsDetectedCount > 0;

  return (
    <div className="space-y-px bg-line-700">
      {/* Posture hero */}
      <div className="bg-ink-800 p-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[13px] text-paper-400 max-w-[58ch]">
            {hasThreats
              ? `${telemetry.threatsDetectedCount} detection${telemetry.threatsDetectedCount === 1 ? '' : 's'} logged this session. Review the feed below.`
              : 'No detections this session. The lab is clear.'}
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className={`text-[44px] leading-none font-mono font-medium ${hasThreats ? 'text-sev-critical' : 'text-phos-200'}`}>
              {telemetry.threatsDetectedCount}
            </span>
            <span className="text-[13px] text-paper-600">detections tracked</span>
          </div>
        </div>

        {clientRole !== 'NIDS_SOC' && (
          <button
            onClick={onNavigateToAttackLab}
            className="flex items-center gap-2 px-3.5 py-2 border border-line-600 text-paper-200 text-[13px] hover:border-paper-400 hover:text-paper-100 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Launch a scenario</span>
          </button>
        )}
      </div>

      {/* Secondary metrics — dense strip, color reserved for real severity */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line-700">
        <MetricCard
          title="Critical"
          value={telemetry.criticalThreatsCount}
          icon={ShieldAlert}
          tone={telemetry.criticalThreatsCount > 0 ? 'critical' : 'clear'}
        />
        <MetricCard
          title="Lab sessions"
          value={labAttacks.length}
          subtitle="All time"
          icon={Crosshair}
          tone="neutral"
        />
        <MetricCard
          title="Running now"
          value={activeLabAttacksCount}
          icon={Activity}
          tone={activeLabAttacksCount > 0 ? 'high' : 'neutral'}
        />
        <MetricCard
          title="Control signals"
          value={controlEventsCount}
          subtitle="Start / stop"
          icon={Layers}
          tone="neutral"
        />
        <MetricCard
          title="Engine mode"
          value={connectionStatus.aiEngineMode}
          subtitle={`Sensor: ${connectionStatus.sensorMode}`}
          icon={Cpu}
          tone="neutral"
        />
      </div>

      <div>
        <LabActivityCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-line-700">
        <div className="lg:col-span-2">
          <LiveTrafficChart />
        </div>
        <div className="lg:col-span-1">
          <ProtocolPieChart />
        </div>
      </div>

      <div>
        <AttackExecutionTimeline />
      </div>

      <div>
        <ThreatTable onInvestigate={handleInvestigate} maxRows={8} title="Recent detections" />
      </div>
    </div>
  );
};
