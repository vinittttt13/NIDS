import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Activity } from 'lucide-react';
import { TablePanel, tableClass, theadRowClass, thClass, tbodyClass, trClass, tdClass, StatusPill } from '../common/Table';

export const ActiveConnectionsTable: React.FC = () => {
  const { activeConnections } = useNids();

  return (
    <TablePanel title="Active connections & AI inferences" icon={Activity} meta="simulated flow engine">
      <table className={`${tableClass} font-mono`}>
        <thead>
          <tr className={theadRowClass}>
            <th className={thClass}>Source</th>
            <th className={thClass}>Destination</th>
            <th className={thClass}>Proto</th>
            <th className={thClass}>Duration</th>
            <th className={thClass}>Packets</th>
            <th className={thClass}>Bytes</th>
            <th className={thClass}>State</th>
            <th className={thClass}>AI classification</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          {activeConnections.map((flow) => (
            <tr key={flow.id} className={trClass}>
              <td className={`${tdClass} text-paper-300`}>
                {flow.sourceIp}:{flow.sourcePort}
              </td>
              <td className={`${tdClass} text-paper-300`}>
                {flow.destinationIp}:{flow.destinationPort}
              </td>
              <td className={tdClass}>
                <StatusPill tone="neutral">{flow.protocol}</StatusPill>
              </td>
              <td className={`${tdClass} text-paper-600`}>{flow.durationSec.toFixed(2)}s</td>
              <td className={`${tdClass} text-paper-300`}>{flow.packets.toLocaleString()}</td>
              <td className={`${tdClass} text-paper-300`}>{(flow.bytes / 1024).toFixed(1)} KB</td>
              <td className={tdClass}>
                <StatusPill tone={flow.state === 'FLOODING' ? 'critical' : flow.state === 'SCANNING' ? 'high' : 'neutral'}>
                  {flow.state}
                </StatusPill>
              </td>
              <td className={tdClass}>
                <StatusPill tone={flow.isSuspicious ? 'critical' : 'ok'}>{flow.aiClassification}</StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TablePanel>
  );
};
