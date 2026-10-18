import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TablePanelProps {
  title: string;
  icon?: LucideIcon;
  meta?: string;
  children: React.ReactNode;
}

/** Shared dense table shell — the one card/header/scroll treatment every
 * data table in the app adopts, so tables never diverge in chrome. */
export const TablePanel: React.FC<TablePanelProps> = ({ title, icon: Icon, meta, children }) => (
  <div className="bg-ink-800 border border-line-700 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-700">
      <h3 className="flex items-center gap-2 text-[14px] text-paper-100">
        {Icon && <Icon className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />}
        <span>{title}</span>
      </h3>
      {meta && <span className="text-[12px] font-mono text-paper-600">{meta}</span>}
    </div>
    <div className="mt-2 overflow-x-auto">{children}</div>
  </div>
);

// Exported class fragments — every table in the app composes its own
// <table> markup (column shape differs) but shares these exact treatments.
export const tableClass = 'w-full text-left text-[12px]';
export const theadRowClass = 'text-paper-600 text-[11px]';
export const thClass = 'py-2 pr-3 font-normal';
export const thRightClass = 'py-2 pr-3 font-normal text-right';
export const tbodyClass = 'divide-y divide-line-700';
export const trClass = 'hover:bg-ink-700/60 transition-colors';
export const tdClass = 'py-2.5 pr-3';
export const tdRightClass = 'py-2.5 pr-3 text-right';

interface StatusPillProps {
  tone: 'critical' | 'high' | 'medium' | 'low' | 'ok' | 'neutral';
  children: React.ReactNode;
}

const PILL_TONE: Record<StatusPillProps['tone'], string> = {
  critical: 'text-sev-critical border-sev-critical/30',
  high: 'text-sev-high border-sev-high/30',
  medium: 'text-sev-medium border-sev-medium/30',
  low: 'text-sev-low border-sev-low/30',
  ok: 'text-phos-400 border-phos-700',
  neutral: 'text-paper-400 border-line-600',
};

/** Shared status pill for table cells — severity/state only, never decorative. */
export const StatusPill: React.FC<StatusPillProps> = ({ tone, children }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border ${PILL_TONE[tone]}`}>
    {children}
  </span>
);
