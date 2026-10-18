import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Server, ArrowUp, ArrowDown } from 'lucide-react';
import { TablePanel, tableClass, theadRowClass, thClass, tbodyClass, trClass, tdClass, StatusPill } from '../common/Table';

export const TopTalkersTable: React.FC = () => {
  const { hosts } = useNids();

  const roleTone = (role: string) =>
    role === 'ATTACKER' ? 'critical' : role === 'VICTIM' ? 'high' : role === 'SENSOR' ? 'low' : 'neutral';

  return (
    <TablePanel title="Lab hosts & top talkers" icon={Server} meta="192.168.100.0/24 subnet">
      <table className={`${tableClass} font-mono`}>
        <thead>
          <tr className={theadRowClass}>
            <th className={thClass}>Host node</th>
            <th className={thClass}>Lab role</th>
            <th className={thClass}>Packets sent</th>
            <th className={thClass}>Packets recv</th>
            <th className={thClass}>Bandwidth</th>
            <th className={thClass}>Threats</th>
            <th className={thClass}>Status</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          {hosts.map((h) => (
            <tr key={h.ip} className={trClass}>
              <td className={tdClass}>
                <div className="text-paper-100">{h.hostname}</div>
                <div className="text-[11px] text-paper-600">{h.ip}</div>
              </td>
              <td className={tdClass}>
                <StatusPill tone={roleTone(h.role)}>{h.role}</StatusPill>
              </td>
              <td className={`${tdClass} text-paper-300`}>
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-paper-600" />
                  {h.packetsSent.toLocaleString()}
                </span>
              </td>
              <td className={`${tdClass} text-paper-300`}>
                <span className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-paper-600" />
                  {h.packetsReceived.toLocaleString()}
                </span>
              </td>
              <td className={`${tdClass} text-paper-100`}>{h.bytesTotal}</td>
              <td className={tdClass}>
                <span className={h.threatsOriginated > 0 || h.threatsTargeted > 0 ? 'text-sev-critical' : 'text-paper-600'}>
                  {h.threatsOriginated + h.threatsTargeted}
                </span>
              </td>
              <td className={tdClass}>
                <StatusPill tone={h.status === 'ACTIVE_ATTACK' ? 'critical' : h.status === 'UNDER_ATTACK' ? 'high' : 'ok'}>
                  {h.status}
                </StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TablePanel>
  );
};
