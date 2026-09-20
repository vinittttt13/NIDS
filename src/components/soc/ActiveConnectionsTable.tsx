import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Network, Activity, ArrowRight } from 'lucide-react';

export const ActiveConnectionsTable: React.FC = () => {
  const { activeConnections } = useNids();

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Active Network Connections & AI Inferences</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Zeek Flow Engine</span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1b283d] text-slate-400 uppercase text-[10px]">
              <th className="pb-2 px-2">Source</th>
              <th className="pb-2 px-2">Destination</th>
              <th className="pb-2 px-2">Proto</th>
              <th className="pb-2 px-2">Duration</th>
              <th className="pb-2 px-2">Packets</th>
              <th className="pb-2 px-2">Bytes</th>
              <th className="pb-2 px-2">State</th>
              <th className="pb-2 px-2">AI Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152033]">
            {activeConnections.map((flow) => (
              <tr key={flow.id} className="hover:bg-[#121c2e] transition-colors">
                <td className="py-2.5 px-2 text-slate-300">
                  {flow.sourceIp}:{flow.sourcePort}
                </td>
                <td className="py-2.5 px-2 text-slate-300">
                  {flow.destinationIp}:{flow.destinationPort}
                </td>
                <td className="py-2.5 px-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    {flow.protocol}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-slate-400">{flow.durationSec.toFixed(2)}s</td>
                <td className="py-2.5 px-2 text-slate-300">{flow.packets.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-slate-300">{(flow.bytes / 1024).toFixed(1)} KB</td>
                <td className="py-2.5 px-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    flow.state === 'FLOODING' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                    flow.state === 'SCANNING' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {flow.state}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    flow.isSuspicious ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {flow.aiClassification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
