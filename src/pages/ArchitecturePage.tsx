import React from 'react';
import { PhysicalLabDiagram } from '../components/architecture/PhysicalLabDiagram';
import { TechStackGrid } from '../components/architecture/TechStackGrid';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              System Architecture & Physical Deployment Specs
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              PHYSICAL 2-PC DEPLOYMENT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hardware topology, port-mirroring sensor taps, feature pipelines, and decoupled C2 communications
          </p>
        </div>
      </div>

      {/* Physical Hardware & Flow Diagram */}
      <PhysicalLabDiagram />

      {/* Complete Technology Stack */}
      <TechStackGrid />
    </div>
  );
};
