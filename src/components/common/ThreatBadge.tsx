import React from 'react';
import { SeverityLevel } from '../../types/threat';

interface ThreatBadgeProps {
  severity: SeverityLevel;
  showIcon?: boolean;
  className?: string;
}

const SEVERITY_STYLE: Record<SeverityLevel, { label: string; color: string; dot: string }> = {
  CRITICAL: { label: 'Critical', color: 'text-sev-critical', dot: 'bg-sev-critical' },
  HIGH: { label: 'High', color: 'text-sev-high', dot: 'bg-sev-high' },
  MEDIUM: { label: 'Medium', color: 'text-sev-medium', dot: 'bg-sev-medium' },
  LOW: { label: 'Low', color: 'text-sev-low', dot: 'bg-sev-low' },
};

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({ severity, showIcon = true, className = '' }) => {
  const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${style.color} ${className}`}>
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{style.label}</span>
    </span>
  );
};
