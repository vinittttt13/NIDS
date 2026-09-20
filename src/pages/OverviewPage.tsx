import React from 'react';
import { useNids } from '../context/NidsContext';
import { MetricCard } from '../components/common/MetricCard';
import { LiveTrafficChart } from '../components/soc/LiveTrafficChart';
import { ThreatTable } from '../components/soc/ThreatTable';
import { ProtocolPieChart } from '../components/soc/ProtocolPieChart';
import { AttackExecutionTimeline } from '../components/attack/AttackExecutionTimeline';
import { LabActivityCard } from '../components/soc/LabActivityCard';
import { 
  Activity, 
  Layers, 
  ShieldAlert, 
  Flame, 
  Target, 
  Clock, 
  Crosshair,
  Radio,
  Cpu
} from 'lucide-react';
import type { ThreatAlert } from '../types/threat';

interface OverviewPageProps {
  onNavigateToAttackLab: () => void;
  onNavigateToAiEngine: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ 
  onNavigateToAttackLab, 
  onNavigateToAiEngine 
}) => {
  const { 
    telemetry, 
    activeAttack, 
    clientRole,
    connectionStatus,
    setSelectedThreat,
    labAttacks,
    activeLabAttacksCount,
    controlEventsCount
  } = useNids();

  const handleInvestigate = (threat: ThreatAlert) => {
    setSelectedThreat(threat);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Security Operations Center (SOC)
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              REAL-TIME DETECTION AUTHORITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            AI-Based Real-Time Network Intrusion Detection & Flow Ingestion System (PC 2 SOC Authority)
          </p>
        </div>

        {/* Quick Launch Scenario Button (Only on PC1 or Unified, not on NIDS_SOC) */}
        {clientRole !== 'NIDS_SOC' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToAttackLab}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all shadow-lg hover:shadow-blue-500/25"
            >
              <Crosshair className="w-4 h-4" />
              <span>Launch Attack Simulation</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid — Truthfully separating Real Security Detections vs Controlled Lab Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Threats Detected"
          value={telemetry.threatsDetectedCount}
          subtitle="Real AI Detections Only"
          icon={ShieldAlert}
          trend={telemetry.threatsDetectedCount > 0 ? 'Threats Found' : 'Clean'}
          trendDirection={telemetry.threatsDetectedCount > 0 ? 'down' : 'up'}
          color={telemetry.threatsDetectedCount > 0 ? 'red' : 'emerald'}
        />

        <MetricCard
          title="Critical Threats"
          value={telemetry.criticalThreatsCount}
          subtitle="Real Sev-1 Alerts"
          icon={Flame}
          trend={telemetry.criticalThreatsCount > 0 ? 'Urgent' : 'Clear'}
          trendDirection={telemetry.criticalThreatsCount > 0 ? 'down' : 'up'}
          color="red"
          badge="SEV-1"
        />

        <MetricCard
          title="Lab Attacks"
          value={labAttacks.length}
          subtitle="Controlled Simulations"
          icon={Target}
          trend="Lab History"
          trendDirection="neutral"
          color="blue"
        />

        <MetricCard
          title="Active Lab Attacks"
          value={activeLabAttacksCount}
          subtitle="Currently Running"
          icon={Crosshair}
          trend={activeLabAttacksCount > 0 ? 'Active Test' : 'Idle'}
          trendDirection={activeLabAttacksCount > 0 ? 'up' : 'neutral'}
          color={activeLabAttacksCount > 0 ? 'amber' : 'cyan'}
        />

        <MetricCard
          title="Control Events"
          value={controlEventsCount}
          subtitle="WebSocket C2 Signals"
          icon={Activity}
          trend="Start / Stop"
          trendDirection="neutral"
          color="purple"
        />

        <MetricCard
          title="AI / Sensor Status"
          value={connectionStatus.aiEngineMode}
          subtitle={`Sensor: ${connectionStatus.sensorMode}`}
          icon={Cpu}
          trend="Simulated Pipeline"
          trendDirection="neutral"
          color="cyan"
        />
      </div>

      {/* Sensor & AI Transparency Notice */}
      <div className="px-4 py-2 rounded-xl bg-[#080d17] border border-[#162238] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-amber-400">⚡</span>
          <span><strong>Telemetry Status:</strong> AI Mode is <span className="text-cyan-300 font-bold">{connectionStatus.aiEngineMode}</span> • Sensor is <span className="text-amber-300 font-bold">{connectionStatus.sensorMode}</span>. Lab C2 events are tracked separately from live threat detections.</span>
        </div>
        <div className="text-[11px] text-slate-500">
          PC 1 Controller: 10.64.157.140 → PC 2 NIDS Server: 10.64.157.145
        </div>
      </div>

      {/* Live Lab Activity Feed & Permanent Attack History Card */}
      <div>
        <LabActivityCard />
      </div>

      {/* Main Charts & Visualization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveTrafficChart />
        </div>
        <div className="lg:col-span-1">
          <ProtocolPieChart />
        </div>
      </div>

      {/* Real-Time Detection & Event Timeline */}
      <div>
        <AttackExecutionTimeline />
      </div>

      {/* Live Threat Feed Table */}
      <div>
        <ThreatTable onInvestigate={handleInvestigate} maxRows={8} title="Recent Security Detections & AI Classifications" />
      </div>
    </div>
  );
};
