import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Only pass a tone when the number genuinely reflects that severity —
   * neutral counters (event counts, mode labels) should stay untinted. */
  tone?: 'critical' | 'high' | 'clear' | 'neutral';
  badge?: string;
}

const TONE_TEXT: Record<NonNullable<MetricCardProps['tone']>, string> = {
  critical: 'text-sev-critical',
  high: 'text-sev-high',
  clear: 'text-sev-clear',
  neutral: 'text-paper-100',
};

const TONE_EDGE: Record<NonNullable<MetricCardProps['tone']>, string> = {
  critical: 'before:bg-sev-critical',
  high: 'before:bg-sev-high',
  clear: 'before:bg-sev-clear',
  neutral: 'before:bg-transparent',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  tone = 'neutral',
  badge,
}) => {
  return (
    <div
      className={`relative before:absolute before:inset-y-0 before:left-0 before:w-[2px] ${TONE_EDGE[tone]} bg-ink-800 border border-line-700 pl-4 pr-3.5 py-3.5 flex flex-col gap-2.5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-paper-400">{title}</span>
        <Icon className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-[26px] font-mono font-medium leading-none tracking-tight ${TONE_TEXT[tone]}`}>
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-mono text-paper-600 border border-line-600 px-1 py-0.5 leading-none">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-line-700">
          {subtitle && <span className="text-paper-600 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={
                trendDirection === 'up'
                  ? 'text-sev-clear'
                  : trendDirection === 'down'
                  ? 'text-sev-critical'
                  : 'text-paper-600'
              }
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
