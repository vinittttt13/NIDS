import React from 'react';
import { useNids } from '../context/NidsContext';
import { LiveTrafficChart } from '../components/soc/LiveTrafficChart';
import { ActiveConnectionsTable } from '../components/soc/ActiveConnectionsTable';
import { ProtocolPieChart } from '../components/soc/ProtocolPieChart';
import { TopTalkersTable } from '../components/soc/TopTalkersTable';
import { LabActivityCard } from '../components/soc/LabActivityCard';

export const LiveMonitorPage: React.FC = () => {
  const { telemetry } = useNids();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Live Network Flow Monitor
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              SPAN PORT: SENSOR-08
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time passive traffic inspection, active connection states, and protocol distributions
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-[#0e1626] border border-[#1b283d] text-slate-300">
            Throughput: <strong className="text-emerald-400">{(telemetry.bytesPerSec / 1024 / 1024).toFixed(2)} MB/s</strong>
          </span>
        </div>
      </div>

      {/* Live Lab Activity Feed Card */}
      <LabActivityCard />

      {/* Traffic Chart */}
      <LiveTrafficChart />

      {/* Top Talkers & Protocols Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopTalkersTable />
        </div>
        <div className="lg:col-span-1">
          <ProtocolPieChart />
        </div>
      </div>

      {/* Active Flow Connections with AI Classification */}
      <ActiveConnectionsTable />
    </div>
  );
};
