import React from 'react';
import { useNids } from '../../context/NidsContext';

export const LiveTrafficChart: React.FC = () => {
  const { trafficHistory, timeRange, setTimeRange, activeAttack } = useNids();

  const maxPackets = Math.max(...trafficHistory.map(p => p.packetsPerSec), 20000);
  const chartHeight = 220;
  const chartWidth = 700;

  const points = trafficHistory.map((pt, idx) => {
    const x = (idx / (trafficHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (pt.packetsPerSec / maxPackets) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD = points.length > 0 ? `M ${points.join(' L ')} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : '';

  const suspPoints = trafficHistory.map((pt, idx) => {
    const x = (idx / (trafficHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (Math.min(pt.suspiciousPackets * 1.5, pt.packetsPerSec) / maxPackets) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const suspAreaD = suspPoints.length > 0 ? `M ${suspPoints.join(' L ')} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : '';
  const suspPathD = suspPoints.length > 0 ? `M ${suspPoints.join(' L ')}` : '';

  const latestPoint = trafficHistory[trafficHistory.length - 1];

  return (
    <div className="bg-ink-800 border border-line-700 p-5 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-line-700">
        <div>
          <h3 className="text-[14px] text-paper-100">Traffic volume</h3>
          <p className="text-[12px] text-paper-600 mt-0.5">Packets per second, simulated</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-4 text-[12px] font-mono">
            <span className="flex items-center gap-1.5 text-paper-400">
              <span className="w-2.5 h-[2px] bg-paper-300" />
              {latestPoint ? latestPoint.packetsPerSec.toLocaleString() : 0}
            </span>
            {activeAttack && (
              <span className="flex items-center gap-1.5 text-sev-critical">
                <span className="w-2.5 h-[2px] bg-sev-critical" />
                {latestPoint ? latestPoint.suspiciousPackets.toLocaleString() : 0}
              </span>
            )}
          </div>

          <div className="flex items-center text-[12px] font-mono">
            {(['1M', '5M', '15M', '1H'] as const).map((r, i) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 transition-colors ${i > 0 ? 'border-l border-line-700' : ''} ${
                  timeRange === r ? 'text-paper-100' : 'text-paper-600 hover:text-paper-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 relative w-full h-[220px]">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-paper-600">
          <div className="border-b border-line-700 pb-0.5">{maxPackets.toLocaleString()}</div>
          <div className="border-b border-line-700/60 pb-0.5">{Math.round(maxPackets * 0.5).toLocaleString()}</div>
          <div className="pt-0.5">0</div>
        </div>

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="baseAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B7BEC7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#B7BEC7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="critAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5484D" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#E5484D" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaD} fill="url(#baseAreaGrad)" />
          {activeAttack && <path d={suspAreaD} fill="url(#critAreaGrad)" />}

          <path d={pathD} fill="none" stroke="#B7BEC7" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />

          {activeAttack && (
            <path
              d={suspPathD}
              fill="none"
              stroke="#E5484D"
              strokeWidth="1.75"
              strokeDasharray="4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {trafficHistory.slice(-1).map((pt, i) => {
            const idx = trafficHistory.length - 1;
            const x = (idx / (trafficHistory.length - 1 || 1)) * chartWidth;
            const y = chartHeight - (pt.packetsPerSec / maxPackets) * (chartHeight - 20) - 10;
            return <circle key={i} cx={x} cy={y} r={3} className="fill-paper-100" />;
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-line-700 flex items-center justify-between text-[11px] font-mono text-paper-600">
        <span>peak {maxPackets.toLocaleString()} pps</span>
        <span>window {timeRange}</span>
      </div>
    </div>
  );
};
