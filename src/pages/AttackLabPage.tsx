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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-medium text-paper-100">Attack lab (PC 1 controller)</h1>
            <span className="text-[11px] font-mono text-sev-high border border-sev-high/30 px-1.5 py-0.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3" strokeWidth={1.75} />
              <span>AUTHORIZED LAB ENVIRONMENT · PRIVATE TARGET ONLY</span>
            </span>
          </div>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[70ch]">
            Controlled attack simulation for authorized security testing over <span className="font-mono text-phos-400">{activeTransport}</span>. All packet generation is rate-bounded and locked to private lab targets.
          </p>
        </div>

        {activeAttack && (
          <span className="px-3 py-1.5 bg-ink-800 border border-sev-critical/40 text-sev-critical text-[12px] font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>TRANSMITTING: {activeAttack.scenarioId} [{activeAttack.intensity || 'MEDIUM'}]</span>
          </span>
        )}
      </div>

      {/* Physical Two-PC Lab Topology */}
      <AttackTopologyDiagram />

      {/* Attack Scenario Control Section */}
      <div>
        {/* Category Tabs & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-phos-400" strokeWidth={1.75} />
            <h2 className="text-[13px] text-paper-100">Controlled lab attack scenarios</h2>
          </div>

          <div className="flex items-center text-[12px] font-mono">
            {categories.map((cat, i) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1 transition-colors ${i > 0 ? 'border-l border-line-700' : ''} ${
                  selectedCategory === cat.key ? 'text-phos-400 bg-ink-800' : 'text-paper-600 hover:text-paper-400'
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 opacity-70">({cat.count})</span>
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
