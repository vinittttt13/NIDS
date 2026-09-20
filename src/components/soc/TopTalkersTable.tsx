import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Server, ArrowUp, ArrowDown, Shield } from 'lucide-react';

export const TopTalkersTable: React.FC = () => {
  const { hosts } = useNids();

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-white">Lab Hosts & Top Talkers</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">192.168.100.0/24 Subnet</span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1b283d] text-slate-400 uppercase text-[10px]">
              <th className="pb-2 px-2">Host Node</th>
              <th className="pb-2 px-2">Lab Role</th>
              <th className="pb-2 px-2">Packets Sent</th>
              <th className="pb-2 px-2">Packets Recv</th>
              <th className="pb-2 px-2">Bandwidth</th>
              <th className="pb-2 px-2">Threats</th>
              <th className="pb-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152033]">
            {hosts.map((h) => (
              <tr key={h.ip} className="hover:bg-[#121c2e] transition-colors">
                <td className="py-2.5 px-2">
                  <div className="font-bold text-white">{h.hostname}</div>
                  <div className="text-[11px] text-slate-400">{h.ip}</div>
                </td>
                <td className="py-2.5 px-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    h.role === 'ATTACKER' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    h.role === 'VICTIM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    h.role === 'SENSOR' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {h.role}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-slate-300">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-blue-400" />
                    {h.packetsSent.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-slate-300">
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-emerald-400" />
                    {h.packetsReceived.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-white font-semibold">{h.bytesTotal}</td>
                <td className="py-2.5 px-2">
                  <span className={`font-bold ${h.threatsOriginated > 0 || h.threatsTargeted > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {h.threatsOriginated + h.threatsTargeted}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    h.status === 'ACTIVE_ATTACK' ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' :
                    h.status === 'UNDER_ATTACK' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {h.status}
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
