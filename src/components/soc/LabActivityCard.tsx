import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Terminal, CheckCircle2, Crosshair, Clock, Shield, AlertCircle, History, ArrowRight, Play, CheckCircle } from 'lucide-react';

export const LabActivityCard: React.FC = () => {
  const { labActivity, activeAttack, labAttacks } = useNids();

  const activity = labActivity || (activeAttack ? {
    scenario: activeAttack.scenarioId,
    intensity: activeAttack.intensity || 'MEDIUM',
    sourceIp: import.meta.env.VITE_ATTACKER_HOST || '10.64.157.140',
    targetIp: import.meta.env.VITE_LAB_TARGET_HOST || '10.64.157.145',
    durationSeconds: activeAttack.durationSec || 15,
    status: activeAttack.status === 'STOPPED' ? 'COMPLETED' : 'ACTIVE',
    timestamp: new Date().toLocaleTimeString()
  } : null);

  const isActive = activity && activity.status === 'ACTIVE';

  return (
    <div className="space-y-4">
      {/* 1. Active / Standby Control Feed Card */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 shadow-xl ${
        isActive
          ? 'bg-gradient-to-r from-[#12192e] via-[#0b1424] to-[#080d17] border-blue-500/50 alert-glow-blue'
          : 'bg-[#0e1626] border-[#1a273d]'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#182438]">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base text-white font-mono flex items-center gap-2">
                <span>LAB ACTIVITY & REMOTE CONTROL FEED</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time authoritative C2 control signals dispatched from PC 1 (10.64.157.140)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
              isActive 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                : activity?.status === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-[#080d17] text-slate-400 border border-[#162238]'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-ping' : activity?.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>{isActive ? 'LAB TEST ACTIVE' : activity?.status === 'COMPLETED' ? 'TEST COMPLETED' : 'STANDBY / IDLE'}</span>
            </span>
          </div>
        </div>

        {isActive && activity ? (
          <div className="mt-4 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Active Scenario</span>
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                  <span>{activity.scenario}</span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold">{activity.intensity} Intensity</span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Source (PC 1 Attacker)</span>
                <div className="font-bold text-red-300 text-sm">{activity.sourceIp}</div>
                <span className="text-[10px] text-slate-400">Remote Lab Controller</span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Target (PC 2 NIDS Server)</span>
                <div className="font-bold text-emerald-300 text-sm">{activity.targetIp}</div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Designated Target
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Duration & Time</span>
                <div className="font-bold text-cyan-300 text-sm">{activity.durationSeconds}s window</div>
                <span className="text-[10px] text-slate-400">{activity.timestamp}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#060a12] border border-[#141e30] flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-2">
                <span className="text-blue-400">ℹ</span>
                <span><strong>Control Event Notice:</strong> Authoritative ATTACK_STARTED signal received via WebSocket. This is a control event, not an automated AI threat classification.</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-3.5 rounded-xl bg-[#080d17] border border-dashed border-[#1a273d] text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>STANDBY / IDLE — Awaiting test scenario dispatch from PC 1 Controller (10.64.157.140)...</span>
          </div>
        )}
      </div>

      {/* 2. Permanent Authoritative Recent Lab Activity / Attack History Section */}
      <div className="p-5 rounded-2xl bg-[#0e1626] border border-[#1a273d] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#182438]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
              RECENT LAB ACTIVITY & ATTACK HISTORY
            </h4>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Total Recorded Sessions:</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              {labAttacks.length}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2.5 font-mono">
          {labAttacks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#182438] rounded-xl">
              No lab attack sessions recorded yet. Launch a scenario from PC 1 to initiate test telemetry.
            </div>
          ) : (
            labAttacks.slice(0, 20).map((attack, idx) => {
              const isAttackActive = attack.status === 'ACTIVE';
              return (
                <div
                  key={attack.attack_id || `lab-atk-${idx}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isAttackActive
                      ? 'bg-[#101b30] border-blue-500/50 shadow-md'
                      : 'bg-[#080d17] border-[#162238] hover:border-[#1f3050]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isAttackActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-300'}`}>
                        <Crosshair className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {attack.scenario}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            attack.intensity === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            attack.intensity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {attack.intensity}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Session ID: {attack.attack_id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 ${
                        isAttackActive
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAttackActive ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`} />
                        <span>{attack.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-[#121c2d] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Source</span>
                      <span className="text-red-300 font-bold">{attack.source_ip}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Target</span>
                      <span className="text-emerald-300 font-bold">{attack.target_ip}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Started At</span>
                      <span className="text-slate-300">{attack.started_at}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
                      <span className="text-cyan-300 font-bold">{attack.duration_seconds}s</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
