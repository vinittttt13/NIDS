import React from 'react';
import { useNids } from '../../context/NidsContext';
import { ThreatBadge } from '../common/ThreatBadge';
import { ThreatAlert } from '../../types/threat';
import { ShieldAlert, Search, ArrowUpRight, CheckCircle, Eye } from 'lucide-react';

interface ThreatTableProps {
  onInvestigate: (threat: ThreatAlert) => void;
  maxRows?: number;
  title?: string;
}

export const ThreatTable: React.FC<ThreatTableProps> = ({ 
  onInvestigate, 
  maxRows, 
  title = 'Live Threat Feed & AI Classifications' 
}) => {
  const { threats, resolveThreat } = useNids();

  const displayThreats = maxRows ? threats.slice(0, maxRows) : threats;

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">{title}</h3>
            <p className="text-xs text-slate-400">Classified by XGBoost v1.4 + Isolation Forest</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {threats.length} Events Logged
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1b283d] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <th className="pb-3 px-3 font-semibold">Severity</th>
              <th className="pb-3 px-3 font-semibold">Threat Signature</th>
              <th className="pb-3 px-3 font-semibold">Source IP</th>
              <th className="pb-3 px-3 font-semibold">Destination IP</th>
              <th className="pb-3 px-3 font-semibold">Proto</th>
              <th className="pb-3 px-3 font-semibold">AI Confidence</th>
              <th className="pb-3 px-3 font-semibold">Risk Score</th>
              <th className="pb-3 px-3 font-semibold">Time</th>
              <th className="pb-3 px-3 font-semibold">Status</th>
              <th className="pb-3 px-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152033] font-mono">
            {displayThreats.map((threat) => {
              const isResolved = threat.status === 'RESOLVED';

              return (
                <tr
                  key={threat.id}
                  className="hover:bg-[#121c2e] transition-colors group cursor-pointer"
                  onClick={() => onInvestigate(threat)}
                >
                  <td className="py-3.5 px-3">
                    <ThreatBadge severity={threat.severity} />
                  </td>

                  <td className="py-3.5 px-3 font-sans">
                    <div className="font-semibold text-white">{threat.attackType}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{threat.category}</div>
                  </td>

                  <td className="py-3.5 px-3 text-red-300 font-medium">
                    {threat.sourceIp}
                    <span className="text-slate-400 text-[10px] block">:{threat.sourcePort}</span>
                  </td>

                  <td className="py-3.5 px-3 text-emerald-300 font-medium">
                    {threat.targetIp}
                    <span className="text-slate-400 text-[10px] block">:{threat.targetPort}</span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px]">
                      {threat.protocol}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${threat.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-blue-300 font-bold text-[11px]">
                        {(threat.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                      threat.riskScore >= 90 ? 'text-red-400 bg-red-500/10' :
                      threat.riskScore >= 75 ? 'text-orange-400 bg-orange-500/10' : 'text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {threat.riskScore}/100
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                    {threat.timestamp}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold ${
                      isResolved
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    }`}>
                      {threat.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onInvestigate(threat)}
                        className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 transition-colors"
                        title="Investigate AI Explainability & PCAP"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!isResolved && (
                        <button
                          onClick={() => resolveThreat(threat.id)}
                          className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 transition-colors"
                          title="Mark Resolved"
                        >
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
