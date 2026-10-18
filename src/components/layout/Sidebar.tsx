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
} from 'lucide-react';
import { useNids } from '../../context/NidsContext';
import { getLabTargetIp } from '../../services/attackService';

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

  const activeThreatsCount = threats.filter((t) => t.status === 'ACTIVE').length;

  const allNavItems: {
    id: NavPage;
    label: string;
    icon: React.FC<any>;
    badge?: number | string;
    badgeTone?: 'critical' | 'active' | 'neutral';
    roles: ('ATTACK_LAB' | 'NIDS_SOC' | 'UNIFIED')[];
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['NIDS_SOC', 'UNIFIED'] },
    { id: 'monitor', label: 'Live monitor', icon: Activity, roles: ['NIDS_SOC', 'UNIFIED'] },
    {
      id: 'threats',
      label: 'Threat feed',
      icon: ShieldAlert,
      badge: activeThreatsCount > 0 ? activeThreatsCount : undefined,
      badgeTone: 'critical',
      roles: ['NIDS_SOC', 'UNIFIED'],
    },
    { id: 'ai', label: 'Detection engine', icon: Cpu, roles: ['NIDS_SOC', 'UNIFIED'] },
    {
      id: 'attack-lab',
      label: 'Attack lab',
      icon: Crosshair,
      badge: activeAttack ? 'running' : undefined,
      badgeTone: 'active',
      roles: ['ATTACK_LAB', 'UNIFIED'],
    },
    { id: 'network', label: 'Network topology', icon: Network, roles: ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['NIDS_SOC', 'UNIFIED'] },
    { id: 'architecture', label: 'Lab architecture', icon: GitBranch, roles: ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'] },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(clientRole));

  const badgeClass = (tone?: 'critical' | 'active' | 'neutral') =>
    tone === 'critical'
      ? 'text-sev-critical'
      : tone === 'active'
      ? 'text-sev-high'
      : 'text-paper-600';

  return (
    <aside className="w-60 bg-ink-900 border-r border-line-700 flex flex-col justify-between shrink-0 select-none">
      <nav className="p-2 pt-4">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`relative w-full flex items-center justify-between pl-3.5 pr-3 py-2 text-[13px] transition-colors ${
                isActive ? 'text-paper-100 bg-ink-800' : 'text-paper-400 hover:text-paper-200'
              }`}
            >
              {isActive && <span className="absolute inset-y-1 left-0 w-[2px] bg-phos-400" />}
              <span className="flex items-center gap-2.5">
                <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
                <span>{item.label}</span>
              </span>

              {item.badge !== undefined && (
                <span className={`text-[11px] font-mono ${badgeClass(item.badgeTone)}`}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-line-700">
        <div className="flex items-center gap-2 mb-2 text-paper-400">
          <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span className="text-[12px]">Isolated lab target</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[12px]">
          <span className="text-paper-600">victim</span>
          <span className="text-paper-100">{getLabTargetIp()}</span>
        </div>
      </div>
    </aside>
  );
};
