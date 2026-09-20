import React from 'react';
import { useNids } from '../../context/NidsContext';
import { 
  CheckCircle2, 
  Clock, 
  Cpu, 
  ShieldAlert, 
  Activity, 
  Sparkles,
  ArrowRight,
  Terminal
} from 'lucide-react';

export const AttackExecutionTimeline: React.FC = () => {
  const { timeline, activeAttack, clientRole } = useNids();

  const isRunning = Boolean(activeAttack && activeAttack.status !== 'STOPPED');

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base text-white font-mono">Live Detection & ML Inference Timeline</h3>
        </div>

        {timeline.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Total Detection Latency:</span>
            <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {timeline[timeline.length - 1]?.elapsedMs || 438} ms
            </span>
          </div>
        )}
      </div>

      {/* Timeline Steps */}
      <div className="mt-5 space-y-3 font-mono">
        {timeline.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-[#1a273d] rounded-xl">
            {clientRole === 'ATTACK_LAB' 
              ? 'Click START TEST on any scenario above to dispatch controlled test traffic.' 
              : 'Awaiting authoritative threat detections from live sensor ingestion and XGBoost inference pipeline.'}
          </div>
        ) : (
          timeline.map((event, idx) => {
            const isLast = idx === timeline.length - 1;

            return (
              <div
                key={event.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-left-2 ${
                  isLast && isRunning
                    ? 'bg-[#181124] border-blue-500/50 alert-glow-blue'
                    : 'bg-[#090f1c] border-[#162238]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className={`w-4 h-4 ${
                      event.stage === 'ALERT_GENERATED' ? 'text-red-400' : 'text-emerald-400'
                    }`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${
                        event.stage === 'ALERT_GENERATED' ? 'text-red-300' : 'text-white'
                      }`}>
                        {event.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        +{event.elapsedMs}ms
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 font-sans leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400">{event.timestamp}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
