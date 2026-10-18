import React from 'react';
import { InteractiveTopology } from '../components/network/InteractiveTopology';
import { TopTalkersTable } from '../components/soc/TopTalkersTable';

export const NetworkPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <h1 className="text-xl font-medium text-paper-100">Laboratory network topology</h1>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[70ch]">
            Simulated host connectivity, switch routing, and SPAN port mirroring telemetry.
          </p>
        </div>
        <span className="text-[12px] font-mono text-paper-600">VLAN 100 · 192.168.100.0/24</span>
      </div>

      {/* Interactive Topology Graph */}
      <InteractiveTopology />

      {/* Host Traffic & Top Talkers */}
      <TopTalkersTable />
    </div>
  );
};
