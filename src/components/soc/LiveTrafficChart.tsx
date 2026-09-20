import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Activity, ShieldAlert, Zap } from 'lucide-react';

export const LiveTrafficChart: React.FC = () => {
  const { trafficHistory, timeRange, setTimeRange, activeAttack } = useNids();

  const maxPackets = Math.max(...trafficHistory.map(p => p.packetsPerSec), 20000);
  const chartHeight = 220;
  const chartWidth = 700;

  // Generate SVG Path for total packets
  const points = trafficHistory.map((pt, idx) => {
    const x = (idx / (trafficHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (pt.packetsPerSec / maxPackets) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD = points.length > 0 ? `M ${points.join(' L ')} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : '';

  // Generate SVG Path for suspicious packets
  const suspPoints = trafficHistory.map((pt, idx) => {
    const x = (idx / (trafficHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (Math.min(pt.suspiciousPackets * 1.5, pt.packetsPerSec) / maxPackets) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const suspAreaD = suspPoints.length > 0 ? `M ${suspPoints.join(' L ')} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : '';
  const suspPathD = suspPoints.length > 0 ? `M ${suspPoints.join(' L ')}` : '';

  const latestPoint = trafficHistory[trafficHistory.length - 1];

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Live Network Telemetry & Flow Ingestion</h3>
              {activeAttack && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  ATTACK STREAM DETECTED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Continuous sensor observation at mirror port (192.168.100.30)</p>
          </div>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex items-center gap-6">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-400 rounded-full" />
              <span className="text-slate-300">Total Pkts/sec ({latestPoint ? latestPoint.packetsPerSec.toLocaleString() : 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-red-400 rounded-full" />
              <span className="text-red-300">Suspicious ({latestPoint ? latestPoint.suspiciousPackets.toLocaleString() : 0})</span>
            </div>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center bg-[#090e1a] p-1 rounded-lg border border-[#1b273d] text-xs font-mono">
            {(['1M', '5M', '15M', '1H'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === r
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="mt-4 relative w-full h-[220px]">
        {/* Y Axis Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400">
          <div className="border-b border-[#162238] pb-0.5 flex justify-between">
            <span>{maxPackets.toLocaleString()} pps</span>
            <span className="text-slate-400">SENSOR STREAM: SPAN-08</span>
          </div>
          <div className="border-b border-[#162238]/60 pb-0.5">
            <span>{Math.round(maxPackets * 0.75).toLocaleString()} pps</span>
          </div>
          <div className="border-b border-[#162238]/60 pb-0.5">
            <span>{Math.round(maxPackets * 0.5).toLocaleString()} pps</span>
          </div>
          <div className="border-b border-[#162238]/60 pb-0.5">
            <span>{Math.round(maxPackets * 0.25).toLocaleString()} pps</span>
          </div>
          <div className="pt-0.5 flex justify-between">
            <span>0 pps</span>
            <span>TIMELINE ({timeRange})</span>
          </div>
        </div>

        {/* SVG Drawing */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Area Fill */}
          <path d={areaD} fill="url(#blueAreaGrad)" />
          {activeAttack && <path d={suspAreaD} fill="url(#redAreaGrad)" />}

          {/* Line Strokes */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activeAttack && (
            <path
              d={suspPathD}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {trafficHistory.slice(-8).map((pt, i) => {
            const idx = trafficHistory.length - 8 + i;
            const x = (idx / (trafficHistory.length - 1 || 1)) * chartWidth;
            const y = chartHeight - (pt.packetsPerSec / maxPackets) * (chartHeight - 20) - 10;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={i === 7 ? 4.5 : 3}
                className={i === 7 ? 'fill-blue-400 stroke-white stroke-2 animate-ping-slow' : 'fill-blue-500'}
              />
            );
          })}
        </svg>
      </div>

      {/* Footer Info Pill */}
      <div className="mt-3 pt-3 border-t border-[#182438] flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>Active Ingestion: <strong className="text-slate-200">Zeek Core + Suricata Engine</strong></span>
          <span>Buffer: <strong className="text-emerald-400">0.02% dropped</strong></span>
        </div>
        <div>
          <span>Peak: <strong className="text-white">{maxPackets.toLocaleString()} pkts/s</strong></span>
        </div>
      </div>
    </div>
  );
};
