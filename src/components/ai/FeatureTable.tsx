import React from 'react';
import { useNids } from '../../context/NidsContext';
import { NetworkFeatureItem } from '../../types/ai';
import { Table, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export const FeatureTable: React.FC = () => {
  const { features, featureSchema, setFeatureSchema } = useNids();

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-base text-white">Extracted Network Feature Vectors</h3>
            <p className="text-xs text-slate-400">Dynamic parameters extracted by sensor per flow window</p>
          </div>
        </div>

        {/* Schema Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Feature Schema:</span>
          <div className="flex items-center bg-[#090e1a] p-1 rounded-lg border border-[#1b273d] text-xs font-mono">
            <button
              onClick={() => setFeatureSchema('41_FEATURES')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                featureSchema === '41_FEATURES'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              41-Feature (KDD Baseline)
            </button>
            <button
              onClick={() => setFeatureSchema('78_FEATURES')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                featureSchema === '78_FEATURES'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              78-Feature (CICIDS2017 Advanced)
            </button>
          </div>
        </div>
      </div>

      {/* Feature Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1b283d] text-slate-400 uppercase text-[10px]">
              <th className="pb-3 px-3">Feature Name</th>
              <th className="pb-3 px-3">Category</th>
              <th className="pb-3 px-3">Live Value</th>
              <th className="pb-3 px-3">Baseline Normal</th>
              <th className="pb-3 px-3">Importance</th>
              <th className="pb-3 px-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152033]">
            {features.map((feat) => (
              <tr key={feat.id} className="hover:bg-[#121c2e] transition-colors">
                <td className="py-3 px-3 font-semibold text-white">
                  {feat.name}
                </td>
                <td className="py-3 px-3 text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                    {feat.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-blue-300 font-bold">
                  {String(feat.value)} <span className="text-slate-400 text-[10px]">{feat.unit}</span>
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {feat.baseline}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-[#080d17] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${feat.importance * 3}%` }}
                      />
                    </div>
                    <span className="text-cyan-300 font-bold text-[11px]">
                      {feat.importance}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-400 font-sans text-[11px] max-w-xs truncate">
                  {feat.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
