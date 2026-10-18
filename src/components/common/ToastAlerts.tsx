import React from 'react';
import { useNids } from '../../context/NidsContext';
import { X, ExternalLink, ShieldAlert } from 'lucide-react';

export const ToastAlerts: React.FC<{ onInvestigateLast: () => void }> = ({ onInvestigateLast }) => {
  const { toasts, dismissToast, threats, setSelectedThreat } = useNids();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const toneClass =
          toast.severity === 'CRITICAL'
            ? 'border-sev-critical/50 alert-glow-red'
            : toast.severity === 'HIGH'
            ? 'border-sev-high/50 alert-glow-orange'
            : 'border-sev-low/40 alert-glow-blue';

        const iconClass =
          toast.severity === 'CRITICAL' ? 'text-sev-critical' : toast.severity === 'HIGH' ? 'text-sev-high' : 'text-sev-low';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 bg-ink-800 border ${toneClass} transition-all`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${iconClass}`} strokeWidth={1.75} />
                <span className="text-[13px] text-paper-100">{toast.title}</span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-paper-600 hover:text-paper-200 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[12px] text-paper-400 mt-1.5 leading-relaxed">{toast.message}</p>

            <div className="mt-2.5 pt-2 border-t border-line-700 flex items-center justify-between">
              <span className="text-[10px] font-mono text-paper-600">{toast.time}</span>
              <button
                onClick={() => {
                  dismissToast(toast.id);
                  if (threats.length > 0) {
                    setSelectedThreat(threats[0]);
                  }
                  onInvestigateLast();
                }}
                className="flex items-center gap-1 text-[12px] text-phos-400 hover:text-phos-300 transition-colors"
              >
                <span>Investigate</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
