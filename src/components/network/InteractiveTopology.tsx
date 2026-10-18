import React, { useState } from 'react';
import { useNids } from '../../context/NidsContext';
import { LabHostNode } from '../../types/network';
import { Network, Server, Crosshair, Cpu, Radio } from 'lucide-react';
import { StatusPill } from '../common/Table';

export const InteractiveTopology: React.FC = () => {
  const { labNodes } = useNids();
  const [selectedNode, setSelectedNode] = useState<LabHostNode | null>(labNodes[0] || null);

  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-700">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <div>
            <h3 className="text-[14px] text-paper-100">Lab network topology & SPAN port visualizer</h3>
            <p className="text-[12px] text-paper-600">Click any host node to inspect its simulated flow telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[12px] font-mono">
          <span className="text-paper-400">{labNodes.length} hosts tracked</span>
          <span className="flex items-center gap-1.5 text-phos-400">
            <span className="w-[6px] h-[6px] rounded-full bg-phos-400 shadow-live" />
            <Radio className="w-3 h-3" strokeWidth={1.75} />
            <span>Mirror active (simulated)</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Nodes & Detail Inspector */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Layout Graph */}
        <div className="lg:col-span-2 bg-ink-850 border border-line-700 p-5 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

          {/* Central Switch Banner */}
          <div className="relative z-10 flex justify-center mb-5">
            <div className="p-3 bg-ink-900 border border-line-600 flex items-center gap-3 max-w-sm w-full justify-center">
              <Network className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
              <div>
                <span className="text-[12px] text-paper-100 font-mono block">Managed switch (simulated)</span>
                <span className="text-[10px] text-paper-600 font-mono">VLAN 100 · 192.168.100.1 gateway</span>
              </div>
            </div>
          </div>

          {/* Connected Host Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line-700 relative z-10">
            {labNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isAttacker = node.role === 'ATTACKER_PC';
              const isSensor = node.role === 'SENSOR_NIDS';
              const statusTone = node.status === 'ACTIVE_ATTACKING' ? 'critical' : node.status === 'UNDER_ATTACK' ? 'high' : 'ok';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-ink-700 border border-phos-700' : 'bg-ink-900 border border-line-700 hover:border-line-500'}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-line-700">
                    <div className="flex items-center gap-2">
                      {isAttacker ? (
                        <Crosshair className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
                      ) : isSensor ? (
                        <Cpu className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
                      ) : (
                        <Server className="w-3.5 h-3.5 text-paper-600" strokeWidth={1.75} />
                      )}
                      <span className="text-[12px] text-paper-100 font-mono">{node.hostname}</span>
                    </div>

                    <StatusPill tone={statusTone}>{node.status}</StatusPill>
                  </div>

                  <div className="mt-2.5 space-y-1 font-mono text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-paper-600">IP</span>
                      <span className="text-paper-100">{node.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-paper-600">Switch port</span>
                      <span className="text-paper-100">{node.switchPort}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-paper-600">Physical PC</span>
                      <span className="text-paper-300">{node.physicalPc}</span>
                    </div>
                  </div>

                  {node.isMirrored && (
                    <div className="mt-2.5 pt-2 border-t border-line-700 flex items-center justify-between text-[10px] font-mono text-phos-400">
                      <span>SPAN port mirroring</span>
                      <span>ENABLED</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Deep Inspector */}
        <div className="bg-ink-850 border border-line-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line-700">
              <span className="text-[11px] font-mono text-phos-600 uppercase tracking-wide">Node telemetry inspector</span>
              {selectedNode && <StatusPill tone="neutral">{selectedNode.role}</StatusPill>}
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-4 font-mono text-[12px]">
                <div>
                  <h4 className="text-[14px] text-paper-100 font-sans">{selectedNode.hostname}</h4>
                  <div className="text-paper-100 text-[13px] mt-0.5">{selectedNode.ip}</div>
                  <span className="text-[11px] text-paper-600 block mt-0.5">{selectedNode.mac}</span>
                </div>

                <div className="p-3 bg-ink-900 border border-line-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-paper-600">Operating system</span>
                    <span className="text-paper-100">{selectedNode.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-paper-600">Physical host</span>
                    <span className="text-paper-100">{selectedNode.physicalPc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-paper-600">Switch interface</span>
                    <span className="text-paper-100">{selectedNode.switchPort}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-line-700">
                  <div className="p-3 bg-ink-900">
                    <span className="text-[10px] text-paper-600 uppercase">Packets in</span>
                    <div className="text-[13px] text-paper-100 mt-1">{selectedNode.packetsIn.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-ink-900">
                    <span className="text-[10px] text-paper-600 uppercase">Packets out</span>
                    <div className="text-[13px] text-paper-100 mt-1">{selectedNode.packetsOut.toLocaleString()}</div>
                  </div>
                </div>

                <div className="p-3 bg-ink-900 border border-line-700 flex items-center justify-between">
                  <span className="text-paper-600">Threat flags associated</span>
                  <span className={selectedNode.threatCount > 0 ? 'text-sev-critical' : 'text-phos-400'}>
                    {selectedNode.threatCount} events
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-paper-600 text-[12px]">Select a node to inspect its telemetry</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-line-700 text-[11px] font-mono text-paper-600 flex items-center justify-between">
            <span>Isolated lab subnet</span>
            <span className="text-paper-100">192.168.100.0/24</span>
          </div>
        </div>
      </div>
    </div>
  );
};
