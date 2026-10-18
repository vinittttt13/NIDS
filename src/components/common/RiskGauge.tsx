import React from 'react';

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 'md', label = 'Risk Score' }) => {
  const getRiskColor = (val: number) => {
    if (val >= 90) return 'text-sev-critical stroke-sev-critical';
    if (val >= 75) return 'text-sev-high stroke-sev-high';
    if (val >= 50) return 'text-sev-medium stroke-sev-medium';
    if (val >= 25) return 'text-sev-low stroke-sev-low';
    return 'text-phos-400 stroke-phos-400';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-line-700"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className={`transition-all duration-700 ease-out ${getRiskColor(score)}`}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-medium text-2xl ${getRiskColor(score)}`}>
            {score}
          </span>
          <span className="text-[10px] text-paper-600">/ 100</span>
        </div>
      </div>
      <span className="text-[12px] text-paper-400">{label}</span>
    </div>
  );
};
