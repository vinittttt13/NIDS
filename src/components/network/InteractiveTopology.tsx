import React, { useState } from 'react';
import { useNids } from '../../context/NidsContext';
import { LabHostNode } from '../../types/network';
import { 
  Network, 
  Server, 
  Crosshair, 
  Cpu, 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  Lock,
  ArrowUpRight,
  Zap,
  Activity
} from 'lucide-react';

export const InteractiveTopology: React.FC = () => {
  const { labNodes, activeAttack } = useNids();
  const [selectedNode, setSelectedNode] = useState<LabHostNode | null>(labNodes[0] || null);

  const isAttacking = Boolean(activeAttack);

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#182438]">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-base text-white">Lab Network Topology & SPAN Port Visualizer</h3>
            <p className="text-xs text-slate-400">Click any host or switch node to inspect real-time flow telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>4 Active Hosts</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Mirror Active (Port 8)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Nodes & Detail Inspector */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Layout Graph */}
        <div className="lg:col-span-2 bg-[#070b14] border border-[#162238] rounded-xl p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

          {/* Central Switch Banner */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="p-3.5 rounded-xl bg-[#0d162a] border border-blue-500/40 shadow-lg flex items-center gap-3 max-w-sm w-full justify-center">
              <Network className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-xs font-bold text-white font-mono block">CISCO MANAGED SWITCH (SG350)</span>
                <span className="text-[10px] text-slate-400 font-mono">VLAN 100 • 192.168.100.1 Gateway</span>
              </div>
            </div>
          </div>

          {/* Connected Host Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {labNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isAttacker = node.role === 'ATTACKER_PC';
              const isVictim = node.role === 'VICTIM_SERVER';
              const isSensor = node.role === 'SENSOR_NIDS';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#15223a] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-[#0a101d] border-[#18243b] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#141e30]">
                    <div className="flex items-center gap-2">
                      {isAttacker ? (
                        <Crosshair className="w-4 h-4 text-red-400" />
                      ) : isSensor ? (
                        <Cpu className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Server className="w-4 h-4 text-emerald-400" />
                      )}
                      <span className="font-bold text-xs text-white font-mono">{node.hostname}</span>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      node.status === 'ACTIVE_ATTACKING' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                      node.status === 'UNDER_ATTACK' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {node.status}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP:</span>
                      <strong className="text-slate-200">{node.ip}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Switch Port:</span>
                      <span className="text-blue-300">{node.switchPort}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Physical PC:</span>
                      <span className="text-slate-300">{node.physicalPc}</span>
                    </div>
                  </div>

                  {node.isMirrored && (
                    <div className="mt-2.5 pt-2 border-t border-[#141e30] flex items-center justify-between text-[10px] font-mono text-cyan-300">
                      <span>SPAN Port Mirroring</span>
                      <span className="font-bold">ENABLED</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Deep Inspector */}
        <div className="bg-[#070b14] border border-[#162238] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#182438]">
              <span className="text-xs font-mono uppercase text-slate-400">Node Telemetry Inspector</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                {selectedNode ? selectedNode.role : 'SELECT NODE'}
              </span>
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <h4 className="text-base font-bold text-white font-sans">{selectedNode.hostname}</h4>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">{selectedNode.ip}</div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{selectedNode.mac}</span>
                </div>

                <div className="p-3 rounded-lg bg-[#0a101d] border border-[#162238] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating System:</span>
                    <span className="text-slate-200">{selectedNode.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Physical Host:</span>
                    <span className="text-slate-200">{selectedNode.physicalPc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Switch Interface:</span>
                    <span className="text-blue-300">{selectedNode.switchPort}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-[#0a101d] border border-[#162238]">
                    <span className="text-[10px] text-slate-400 uppercase">Packets In</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {selectedNode.packetsIn.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a101d] border border-[#162238]">
                    <span className="text-[10px] text-slate-400 uppercase">Packets Out</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {selectedNode.packetsOut.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0a101d] border border-[#162238] flex items-center justify-between">
                  <span className="text-slate-400">Threat Flags Associated:</span>
                  <span className={`font-bold ${selectedNode.threatCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedNode.threatCount} Events
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a node to inspect its telemetry
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#182438] text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Isolated Lab Subnet</span>
            <span className="text-emerald-400">192.168.100.0/24</span>
          </div>
        </div>
      </div>
    </div>
  );
};
