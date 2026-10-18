import React from 'react';
import { useNids } from '../../context/NidsContext';
import { Table as TableIcon } from 'lucide-react';
import { tableClass, theadRowClass, thClass, tbodyClass, trClass, tdClass, StatusPill } from '../common/Table';

export const FeatureTable: React.FC = () => {
  const { features, featureSchema, setFeatureSchema } = useNids();

  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <div>
            <h3 className="text-[14px] text-paper-100">Extracted network feature vectors</h3>
            <p className="text-[12px] text-paper-400">Simulated parameters generated per flow window</p>
          </div>
        </div>

        {/* Schema Switcher */}
        <div className="flex items-center text-[12px] font-mono">
          {(['41_FEATURES', '78_FEATURES'] as const).map((schema, i) => (
            <button
              key={schema}
              onClick={() => setFeatureSchema(schema)}
              className={`px-2.5 py-1 transition-colors ${i > 0 ? 'border-l border-line-700' : ''} ${
                featureSchema === schema ? 'text-phos-400 bg-ink-900' : 'text-paper-600 hover:text-paper-400'
              }`}
            >
              {schema === '41_FEATURES' ? '41-feature (KDD baseline)' : '78-feature (CICIDS2017 advanced)'}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Table */}
      <div className="mt-4 overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr className={theadRowClass}>
              <th className={thClass}>Feature name</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Live value</th>
              <th className={thClass}>Baseline normal</th>
              <th className={thClass}>Importance</th>
              <th className={thClass}>Description</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {features.map((feat) => (
              <tr key={feat.id} className={trClass}>
                <td className={`${tdClass} text-paper-100`}>{feat.name}</td>
                <td className={tdClass}>
                  <StatusPill tone="neutral">{feat.category}</StatusPill>
                </td>
                <td className={`${tdClass} text-paper-100 font-mono`}>
                  {String(feat.value)} <span className="text-paper-600 text-[10px]">{feat.unit}</span>
                </td>
                <td className={`${tdClass} text-paper-600 font-mono`}>{feat.baseline}</td>
                <td className={tdClass}>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-ink-900 h-[3px]">
                      <div className="bg-phos-400 h-full" style={{ width: `${feat.importance * 3}%` }} />
                    </div>
                    <span className="text-phos-400 font-mono text-[11px]">{feat.importance}%</span>
                  </div>
                </td>
                <td className={`${tdClass} text-paper-600 text-[11px] max-w-xs truncate`}>{feat.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
