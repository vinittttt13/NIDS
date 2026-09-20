import React from 'react';
import { useNids } from '../../context/NidsContext';
import { PieChart, Layers } from 'lucide-react';

export const ProtocolPieChart: React.FC = () => {
  const { protocols } = useNids();

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-white">Protocol Distribution</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Real-Time Sensor</span>
      </div>

      <div className="mt-4 space-y-3">
        {protocols.map((proto) => (
          <div key={proto.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: proto.color }} />
                <span className="text-slate-200 font-semibold">{proto.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px]">{proto.packetsPerSec.toLocaleString()} pps</span>
                <span className="font-bold text-white w-12 text-right">{proto.percentage.toFixed(1)}%</span>
              </div>
            </div>

            <div className="w-full bg-[#080d17] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${proto.percentage}%`,
                  backgroundColor: proto.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#182438] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Deep Packet Inspection (DPI)</span>
        <span className="text-emerald-400">Active</span>
      </div>
    </div>
  );
};
