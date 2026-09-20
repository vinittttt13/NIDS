import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Crosshair, 
  Network, 
  FileText, 
  GitBranch, 
  Settings, 
  Lock,
  Radio
} from 'lucide-react';
import { useNids } from '../../context/NidsContext';

export type NavPage = 
  | 'overview' 
  | 'monitor' 
  | 'threats' 
  | 'ai' 
  | 'attack-lab' 
  | 'network' 
  | 'reports' 
  | 'architecture' 
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  const { threats, activeAttack, clientRole } = useNids();

  const activeThreatsCount = threats.filter(t => t.status === 'ACTIVE').length;

  const allNavItems: { 
    id: NavPage; 
    label: string; 
    icon: React.FC<any>; 
    badge?: number | string; 
    badgeColor?: string;
    roles: ('ATTACK_LAB' | 'NIDS_SOC' | 'UNIFIED')[];
  }[] = [
    { id: 'overview', label: 'SOC Overview', icon: LayoutDashboard, roles: ['NIDS_SOC', 'UNIFIED'] },
    { id: 'monitor', label: 'Live Monitor', icon: Activity, roles: ['NIDS_SOC', 'UNIFIED'] },
    { 
      id: 'threats', 
      label: 'Live Threat Feed', 
      icon: ShieldAlert, 
      badge: activeThreatsCount > 0 ? activeThreatsCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
      roles: ['NIDS_SOC', 'UNIFIED']
    },
    { id: 'ai', label: 'AI Detection Engine', icon: Cpu, roles: ['NIDS_SOC', 'UNIFIED'] },
    { 
      id: 'attack-lab', 
      label: 'Attack Lab (PC 1)', 
      icon: Crosshair,
      badge: activeAttack ? 'ACTIVE' : 'ISOLATED',
      badgeColor: activeAttack ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      roles: ['ATTACK_LAB', 'UNIFIED']
    },
    { id: 'network', label: 'Network Topology', icon: Network, roles: ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'] },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText, roles: ['NIDS_SOC', 'UNIFIED'] },
    { id: 'architecture', label: '2-PC Architecture', icon: GitBranch, roles: ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'] },
    { id: 'settings', label: 'Lab Settings', icon: Settings, roles: ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'] },
  ];

  const visibleNavItems = allNavItems.filter(item => item.roles.includes(clientRole));

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-[#1b273d] flex flex-col justify-between shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>{clientRole === 'ATTACK_LAB' ? 'PC 1 CONTROLLER' : clientRole === 'NIDS_SOC' ? 'PC 2 SOC CONSOLE' : 'NAVIGATION CENTER'}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{clientRole}</span>
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-white border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#111a2e]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cyber Range Isolation Footer */}
      <div className="p-3 m-3 rounded-xl bg-[#0d1424] border border-[#1b273d]">
        <div className="flex items-center gap-2 mb-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-bold text-slate-200">ISOLATED CYBER LAB</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Simulations restricted to authorized lab target:
        </p>
        <div className="mt-2 p-1.5 rounded bg-[#080d17] border border-[#192438] flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-400">LAB-VICTIM</span>
          <span className="text-emerald-400 font-semibold">192.168.100.20</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
          <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
          <span>SPAN Mirror Active on Port 8</span>
        </div>
      </div>
    </aside>
  );
};
