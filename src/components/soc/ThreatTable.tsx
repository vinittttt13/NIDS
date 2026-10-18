import React from 'react';
import { useNids } from '../../context/NidsContext';
import { ThreatBadge } from '../common/ThreatBadge';
import { ThreatAlert } from '../../types/threat';
import { Eye, CheckCircle } from 'lucide-react';

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
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-700">
        <h3 className="text-[14px] text-paper-100">{title}</h3>
        <span className="text-[12px] font-mono text-paper-600">{threats.length} logged</span>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="text-paper-600 text-[11px]">
              <th className="py-2 pr-3 font-normal">Severity</th>
              <th className="py-2 pr-3 font-normal">Signature</th>
              <th className="py-2 pr-3 font-normal">Source</th>
              <th className="py-2 pr-3 font-normal">Destination</th>
              <th className="py-2 pr-3 font-normal">Proto</th>
              <th className="py-2 pr-3 font-normal text-right">Confidence</th>
              <th className="py-2 pr-3 font-normal text-right">Risk</th>
              <th className="py-2 pr-3 font-normal">Time</th>
              <th className="py-2 pr-3 font-normal">Status</th>
              <th className="py-2 pl-3 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-700">
            {displayThreats.map((threat) => {
              const isResolved = threat.status === 'RESOLVED';

              return (
                <tr
                  key={threat.id}
                  className="hover:bg-ink-700/60 transition-colors cursor-pointer"
                  onClick={() => onInvestigate(threat)}
                >
                  <td className="py-2.5 pr-3">
                    <ThreatBadge severity={threat.severity} />
                  </td>

                  <td className="py-2.5 pr-3">
                    <div className="text-paper-100">{threat.attackType}</div>
                    <div className="text-[11px] text-paper-600">{threat.category}</div>
                  </td>

                  <td className="py-2.5 pr-3 font-mono text-paper-300">
                    {threat.sourceIp}
                    <span className="text-paper-600">:{threat.sourcePort}</span>
                  </td>

                  <td className="py-2.5 pr-3 font-mono text-paper-300">
                    {threat.targetIp}
                    <span className="text-paper-600">:{threat.targetPort}</span>
                  </td>

                  <td className="py-2.5 pr-3 font-mono text-paper-400">{threat.protocol}</td>

                  <td className="py-2.5 pr-3 text-right font-mono text-paper-300">
                    {(threat.confidence * 100).toFixed(1)}%
                  </td>

                  <td
                    className={`py-2.5 pr-3 text-right font-mono ${
                      threat.riskScore >= 90
                        ? 'text-sev-critical'
                        : threat.riskScore >= 75
                        ? 'text-sev-high'
                        : 'text-sev-medium'
                    }`}
                  >
                    {threat.riskScore}
                  </td>

                  <td className="py-2.5 pr-3 font-mono text-paper-600">{threat.timestamp}</td>

                  <td className="py-2.5 pr-3">
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
      </div>
    </div>
  );
};
