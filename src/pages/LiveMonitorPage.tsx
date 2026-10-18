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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <h1 className="text-xl font-medium text-paper-100">Live network flow monitor</h1>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[62ch]">
            Simulated passive traffic inspection, active connection states, and protocol distributions.
          </p>
        </div>

        <span className="text-[13px] font-mono text-paper-400">
          Throughput <strong className="text-phos-400">{(telemetry.bytesPerSec / 1024 / 1024).toFixed(2)} MB/s</strong>
        </span>
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
