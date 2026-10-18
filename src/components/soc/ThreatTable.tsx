import React from 'react';
import { useNids } from '../../context/NidsContext';
import { ThreatBadge } from '../common/ThreatBadge';
import { ThreatAlert } from '../../types/threat';
import { Eye, CheckCircle } from 'lucide-react';
import { TablePanel, tableClass, theadRowClass, thClass, thRightClass, tbodyClass, trClass, tdClass, tdRightClass } from '../common/Table';

interface ThreatTableProps {
  onInvestigate: (threat: ThreatAlert) => void;
  maxRows?: number;
  title?: string;
}

export const ThreatTable: React.FC<ThreatTableProps> = ({
  onInvestigate,
  maxRows,
  title = 'Recent detections',
}) => {
  const { threats, resolveThreat } = useNids();

  const displayThreats = maxRows ? threats.slice(0, maxRows) : threats;

  return (
    <TablePanel title={title} meta={`${threats.length} logged`}>
      <table className={tableClass}>
        <thead>
          <tr className={theadRowClass}>
            <th className={thClass}>Severity</th>
            <th className={thClass}>Signature</th>
            <th className={thClass}>Source</th>
            <th className={thClass}>Destination</th>
            <th className={thClass}>Proto</th>
            <th className={thRightClass}>Confidence</th>
            <th className={thRightClass}>Risk</th>
            <th className={thClass}>Time</th>
            <th className={thClass}>Status</th>
            <th className="py-2 pl-3 font-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          {displayThreats.map((threat) => {
            const isResolved = threat.status === 'RESOLVED';

            return (
              <tr key={threat.id} className={`${trClass} cursor-pointer`} onClick={() => onInvestigate(threat)}>
                <td className={tdClass}>
                  <ThreatBadge severity={threat.severity} />
                </td>

                <td className={tdClass}>
                  <div className="text-paper-100">{threat.attackType}</div>
                  <div className="text-[11px] text-paper-600">{threat.category}</div>
                </td>

                <td className={`${tdClass} font-mono text-paper-300`}>
                  {threat.sourceIp}
                  <span className="text-paper-600">:{threat.sourcePort}</span>
                </td>

                <td className={`${tdClass} font-mono text-paper-300`}>
                  {threat.targetIp}
                  <span className="text-paper-600">:{threat.targetPort}</span>
                </td>

                <td className={`${tdClass} font-mono text-paper-400`}>{threat.protocol}</td>

                <td className={`${tdRightClass} font-mono text-paper-300`}>
                  {(threat.confidence * 100).toFixed(1)}%
                </td>

                <td
                  className={`${tdRightClass} font-mono ${
                    threat.riskScore >= 90
                      ? 'text-sev-critical'
                      : threat.riskScore >= 75
                      ? 'text-sev-high'
                      : 'text-sev-medium'
                  }`}
                >
                  {threat.riskScore}
                </td>

                <td className={`${tdClass} font-mono text-paper-600`}>{threat.timestamp}</td>

                <td className={tdClass}>
                  <span className={isResolved ? 'text-paper-600' : 'text-sev-critical'}>
                    {isResolved ? 'Resolved' : 'Active'}
                  </span>
                </td>

                <td className="py-2.5 pl-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-3 text-paper-600">
                    <button onClick={() => onInvestigate(threat)} className="hover:text-paper-200 transition-colors" title="Investigate">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!isResolved && (
                      <button onClick={() => resolveThreat(threat.id)} className="hover:text-phos-400 transition-colors" title="Mark resolved">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TablePanel>
  );
};
