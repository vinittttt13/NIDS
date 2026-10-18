import React from 'react';
import { PhysicalLabDiagram } from '../components/architecture/PhysicalLabDiagram';
import { TechStackGrid } from '../components/architecture/TechStackGrid';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <h1 className="text-xl font-medium text-paper-100">System architecture & physical deployment</h1>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[70ch]">
            The designed two-PC hardware topology, sensor taps, feature pipeline, and decoupled C2 channel — see README §2/§3 for which parts are implemented today vs. designed for a future real-sensor build.
          </p>
        </div>
        <span className="text-[12px] font-mono text-paper-600">Physical 2-PC deployment</span>
      </div>

      {/* Physical Hardware & Flow Diagram */}
      <PhysicalLabDiagram />

      {/* Complete Technology Stack */}
      <TechStackGrid />
    </div>
  );
};
