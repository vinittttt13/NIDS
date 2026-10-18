import React from 'react';
import { useNids } from '../../context/NidsContext';

export const ProtocolPieChart: React.FC = () => {
  const { protocols } = useNids();

  return (
    <div className="bg-ink-800 border border-line-700 p-5 flex flex-col">
      <div className="pb-3 border-b border-line-700">
        <h3 className="text-[14px] text-paper-100">Protocol mix</h3>
        <p className="text-[12px] text-paper-600 mt-0.5">Share of observed packets</p>
      </div>

      <div className="mt-4 space-y-3">
        {protocols.map((proto) => (
          <div key={proto.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proto.color }} />
                <span className="text-paper-300">{proto.name}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-paper-600">
                <span>{proto.packetsPerSec.toLocaleString()} pps</span>
                <span className="text-paper-100 w-10 text-right">{proto.percentage.toFixed(1)}%</span>
              </div>
            </div>

            <div className="w-full bg-ink-900 h-[3px]">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${proto.percentage}%`, backgroundColor: proto.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
