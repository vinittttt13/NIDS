import React from 'react';

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 'md', label = 'Risk Score' }) => {
  const getRiskColor = (val: number) => {
    if (val >= 90) return 'text-red-500 stroke-red-500';
    if (val >= 75) return 'text-orange-500 stroke-orange-500';
    if (val >= 50) return 'text-amber-500 stroke-amber-500';
    if (val >= 25) return 'text-blue-400 stroke-blue-400';
    return 'text-emerald-400 stroke-emerald-400';
  };

  const getRiskBg = (val: number) => {
    if (val >= 90) return 'bg-red-500/10 border-red-500/30';
    if (val >= 75) return 'bg-orange-500/10 border-orange-500/30';
    if (val >= 50) return 'bg-amber-500/10 border-amber-500/30';
    if (val >= 25) return 'bg-blue-500/10 border-blue-500/30';
    return 'bg-emerald-500/10 border-emerald-500/30';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${getRiskBg(score)} transition-all`}>
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className={`transition-all duration-700 ease-out ${getRiskColor(score)}`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-extrabold text-2xl ${getRiskColor(score)}`}>
            {score}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-300 mt-1">{label}</span>
    </div>
  );
};
