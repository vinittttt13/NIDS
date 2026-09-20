import React from 'react';
import { InteractiveTopology } from '../components/network/InteractiveTopology';
import { TopTalkersTable } from '../components/soc/TopTalkersTable';

export const NetworkPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Laboratory Network Topology
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              VLAN 100 • 192.168.100.0/24
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Physical host connectivity, managed switch routing, and hardware SPAN port mirroring telemetry
          </p>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <InteractiveTopology />

      {/* Host Traffic & Top Talkers */}
      <TopTalkersTable />
    </div>
  );
};
