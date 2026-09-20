import React, { useState } from 'react';
import { useNids } from '../context/NidsContext';
import { AttackCard } from '../components/attack/AttackCard';
import { AttackTopologyDiagram } from '../components/attack/AttackTopologyDiagram';
import { AttackControllerStatusPanel } from '../components/attack/AttackControllerStatusPanel';
import { Crosshair, Lock, ShieldAlert } from 'lucide-react';
import type { AttackScenario } from '../types/attack';

export const AttackLabPage: React.FC = () => {
  const { scenarios, activeAttack, activeTransport, clientRole } = useNids();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (clientRole === 'NIDS_SOC') {
    return null;
  }

  const categories: { key: string; label: string; count: number }[] = [
    { key: 'ALL', label: 'All Scenarios', count: scenarios.length },
    { key: 'Reconnaissance', label: 'Reconnaissance', count: scenarios.filter(s => s.category === 'Reconnaissance').length },
    { key: 'Credential Attacks', label: 'Credential Attacks', count: scenarios.filter(s => s.category === 'Credential Attacks').length },
    { key: 'Network Availability', label: 'Network Availability (DoS / DDoS)', count: scenarios.filter(s => s.category === 'Network Availability').length },
    { key: 'Protocol / Behavior Anomalies', label: 'Protocol Anomalies', count: scenarios.filter(s => s.category === 'Protocol / Behavior Anomalies').length },
  ];

  const filteredScenarios = selectedCategory === 'ALL'
    ? scenarios
    : scenarios.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Attack Lab (PC 1 Controller)
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>AUTHORIZED LAB ENVIRONMENT • PRIVATE TARGET ONLY</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Controlled attack simulation environment for authorized network-security testing over <span className="font-mono text-cyan-400">{activeTransport}</span>. All packet generation is rate-bounded and locked to private lab targets.
          </p>
        </div>

        {activeAttack && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>TRANSMITTING: {activeAttack.scenarioId} [{activeAttack.intensity || 'MEDIUM'}]</span>
            </span>
          </div>
        )}
      </div>

      {/* Physical Two-PC Lab Topology */}
      <AttackTopologyDiagram />

      {/* Attack Scenario Control Section */}
      <div>
        {/* Category Tabs & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Controlled Lab Attack Scenarios
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0e1626] p-1 rounded-xl border border-[#1b273d]">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#152138]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 text-[10px] opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScenarios.map((scenario: AttackScenario) => (
            <AttackCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </div>

      {/* PC 1 Remote Attack Controller Status & Telemetry Panel - ONLY rendered on ATTACK_LAB */}
      {clientRole === 'ATTACK_LAB' && (
        <AttackControllerStatusPanel />
      )}
    </div>
  );
};
