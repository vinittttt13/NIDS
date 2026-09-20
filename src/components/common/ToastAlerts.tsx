import React from 'react';
import { useNids } from '../../context/NidsContext';
import { ThreatBadge } from './ThreatBadge';
import { X, ExternalLink, ShieldAlert } from 'lucide-react';

export const ToastAlerts: React.FC<{ onInvestigateLast: () => void }> = ({ onInvestigateLast }) => {
  const { toasts, dismissToast, threats, setSelectedThreat } = useNids();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 transition-all ${
              toast.severity === 'CRITICAL'
                ? 'bg-[#180d12]/95 border-red-500/50 alert-glow-red'
                : toast.severity === 'HIGH'
                ? 'bg-[#18110c]/95 border-orange-500/50 alert-glow-orange'
                : 'bg-[#0f172a]/95 border-blue-500/40 alert-glow-blue'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${
                  toast.severity === 'CRITICAL' ? 'text-red-400' : toast.severity === 'HIGH' ? 'text-orange-400' : 'text-blue-400'
                }`} />
                <span className="font-bold text-sm text-white">{toast.title}</span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {toast.message}
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">{toast.time}</span>
              <button
                onClick={() => {
                  dismissToast(toast.id);
                  if (threats.length > 0) {
                    setSelectedThreat(threats[0]);
                  }
                  onInvestigateLast();
                }}
                className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Investigate AI Factors</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
