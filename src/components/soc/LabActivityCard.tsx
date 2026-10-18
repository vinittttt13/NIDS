import React from 'react';
import { useNids } from '../../context/NidsContext';
import { getLabAttackerIp, getLabTargetIp } from '../../services/attackService';

export const LabActivityCard: React.FC = () => {
  const { labActivity, activeAttack, labAttacks } = useNids();

  const activity = labActivity || (activeAttack ? {
    scenario: activeAttack.scenarioId,
    intensity: activeAttack.intensity || 'MEDIUM',
    sourceIp: getLabAttackerIp(),
    targetIp: getLabTargetIp(),
    durationSeconds: activeAttack.durationSec || 15,
    status: activeAttack.status === 'STOPPED' ? 'COMPLETED' : 'ACTIVE',
    timestamp: new Date().toLocaleTimeString()
  } : null);

  const isActive = activity && activity.status === 'ACTIVE';

  return (
    <div className="space-y-px bg-line-700">
      {/* Current session */}
      <div className="bg-ink-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sev-high' : 'bg-paper-600'}`} />
            <h3 className="text-[14px] text-paper-100">
              {isActive ? 'Simulation running' : activity?.status === 'COMPLETED' ? 'Last simulation' : 'Attack lab — idle'}
            </h3>
          </div>
          <span className="text-[12px] text-paper-600">Dispatched from the attack-lab controller</span>
        </div>

        {activity ? (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-[12px] font-mono">
            <Field label="scenario" value={activity.scenario} />
            <Field label="intensity" value={activity.intensity} />
            <Field label="source" value={activity.sourceIp} />
            <Field label="target" value={activity.targetIp} />
            <Field label="duration" value={`${activity.durationSeconds}s`} />
            <Field label="at" value={activity.timestamp} />
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-paper-600">Awaiting a test scenario from the attack lab.</p>
        )}
      </div>

      {/* History */}
      <div className="bg-ink-800 p-5">
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-[14px] text-paper-100">Session history</h4>
          <span className="text-[12px] font-mono text-paper-600">{labAttacks.length} recorded</span>
        </div>

        <div className="divide-y divide-line-700">
          {labAttacks.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-paper-600">No sessions recorded yet.</p>
          ) : (
            labAttacks.slice(0, 20).map((attack, idx) => {
              const isAttackActive = attack.status === 'ACTIVE';
              return (
                <div key={attack.attack_id || `lab-atk-${idx}`} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAttackActive ? 'bg-sev-high' : 'bg-paper-600'}`} />
                    <span className="text-paper-200">{attack.scenario}</span>
                    <span className="font-mono text-paper-600">{attack.intensity}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-paper-600">
                    <span>{attack.source_ip} → {attack.target_ip}</span>
                    <span>{attack.duration_seconds}s</span>
                    <span>{attack.started_at}</span>
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

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-paper-600">{label}</div>
    <div className="text-paper-100">{value}</div>
  </div>
);
