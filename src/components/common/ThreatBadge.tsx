import React from 'react';
import { SeverityLevel } from '../../types/threat';
import { AlertCircle, AlertTriangle, Info, Flame } from 'lucide-react';

interface ThreatBadgeProps {
  severity: SeverityLevel;
  showIcon?: boolean;
  className?: string;
}

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({ severity, showIcon = true, className = '' }) => {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-500/15 border border-red-500/30 text-red-400 alert-glow-red ${className}`}>
          {showIcon && <Flame className="w-3.5 h-3.5 fill-red-500 text-red-400" />}
          <span>CRITICAL</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-orange-500/15 border border-orange-500/30 text-orange-400 alert-glow-orange ${className}`}>
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
          <span>HIGH</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 ${className}`}>
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
          <span>MEDIUM</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-blue-500/15 border border-blue-500/30 text-blue-400 ${className}`}>
          {showIcon && <Info className="w-3.5 h-3.5 text-blue-400" />}
          <span>LOW</span>
        </span>
      );
  }
};
