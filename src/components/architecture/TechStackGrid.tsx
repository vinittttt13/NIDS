import React from 'react';
import { 
  Code, 
  Layers, 
  Cpu, 
  Database, 
  Radio, 
  ShieldCheck, 
  Terminal, 
  Boxes 
} from 'lucide-react';

export const TechStackGrid: React.FC = () => {
  const stack = [
    {
      category: 'Frontend SOC & UI',
      icon: Code,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      technologies: ['React 19', 'TypeScript', 'Tailwind CSS', 'Lucide Icons', 'SVG Canvas Charts'],
      purpose: 'High-density, presentation-ready SOC dashboard and attack simulation interface.',
    },
    {
      category: 'Backend & Orchestration',
      icon: Terminal,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      technologies: ['Python 3.11', 'FastAPI', 'Uvicorn ASGI', 'Pydantic v2', 'REST Endpoints'],
      purpose: 'High-throughput asynchronous API handling telemetry streams and attack execution.',
    },
    {
      category: 'Network Capture & Sensor',
      icon: Radio,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      technologies: ['Zeek (Bro) Network Monitor', 'Suricata IDS', 'libpcap', 'Promiscuous SPAN'],
      purpose: 'Passive packet capture and bi-directional flow reassembly on mirror sensor port.',
    },
    {
      category: 'AI / Machine Learning',
      icon: Cpu,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      technologies: ['XGBoost Classifier', 'scikit-learn 1.4', 'Isolation Forest', 'SHAP Explainability'],
      purpose: 'Sub-15ms multi-class classification, anomaly scoring, and explainable feature attribution.',
    },
    {
      category: 'Real-Time Streaming & DB',
      icon: Database,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      technologies: ['WebSockets (RFC 6455)', 'PostgreSQL 16', 'TimescaleDB', 'Redis Pub/Sub'],
      purpose: 'Low-latency broadcast of flow events and persistent historical threat logging.',
    },
    {
      category: 'Deployment & Isolation',
      icon: Boxes,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      technologies: ['Docker Compose', 'Managed VLAN 100', 'Kali Linux 2024.1', 'Ubuntu 22.04 LTS'],
      purpose: 'Containerized microservices and physically segmented laboratory test network.',
    },
  ];

  return (
    <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#182438]">
        <Layers className="w-5 h-5 text-blue-400" />
        <div>
          <h3 className="font-bold text-base text-white">Full Technology Stack Breakdown</h3>
          <p className="text-xs text-slate-400">Enterprise cybersecurity components used across PC 1 and PC 2</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stack.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.category}
              className="p-4 rounded-xl bg-[#080d17] border border-[#162238] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg border ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white font-sans">{item.category}</h4>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {item.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 pt-3 border-t border-[#141e30] text-[11px] text-slate-400 leading-relaxed font-sans">
                {item.purpose}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
