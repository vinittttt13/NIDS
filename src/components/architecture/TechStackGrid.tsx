import React from 'react';
import { Code, Layers, Cpu, Database, Radio, Terminal, Boxes } from 'lucide-react';

export const TechStackGrid: React.FC = () => {
  const stack = [
    {
      category: 'Frontend SOC & UI',
      icon: Code,
      technologies: ['React 19', 'TypeScript', 'Tailwind CSS', 'Lucide icons', 'SVG canvas charts'],
      purpose: 'High-density, presentation-ready SOC dashboard and attack simulation interface.',
    },
    {
      category: 'Backend & orchestration',
      icon: Terminal,
      technologies: ['Python 3.11', 'FastAPI', 'Uvicorn ASGI', 'Pydantic v2', 'REST endpoints'],
      purpose: 'Asynchronous API handling telemetry streams and attack execution.',
    },
    {
      category: 'Network capture & sensor',
      icon: Radio,
      technologies: ['Zeek (Bro)', 'Suricata IDS', 'libpcap', 'Promiscuous SPAN'],
      purpose: 'Designed passive packet capture and flow reassembly — not implemented in this build (DEMO/HYBRID only).',
    },
    {
      category: 'AI / machine learning',
      icon: Cpu,
      technologies: ['XGBoost classifier', 'scikit-learn', 'Isolation forest', 'SHAP explainability'],
      purpose: 'Designed multi-class classification and explainable attribution — simulated in this build, no trained model is loaded.',
    },
    {
      category: 'Real-time streaming & persistence',
      icon: Database,
      technologies: ['WebSockets', 'SQLite'],
      purpose: 'Low-latency broadcast of flow events and persistent threat history.',
    },
    {
      category: 'Deployment & isolation',
      icon: Boxes,
      technologies: ['Docker Compose', 'Managed VLAN 100', 'Kali Linux', 'Ubuntu 22.04 LTS'],
      purpose: 'Containerized services and a physically segmented lab test network.',
    },
  ];

  return (
    <div className="bg-ink-800 border border-line-700 p-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-line-700">
        <Layers className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
        <div>
          <h3 className="text-[14px] text-paper-100">Full technology stack breakdown</h3>
          <p className="text-[12px] text-paper-600">Components across PC 1 and PC 2 — designed vs. implemented noted per row</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line-700">
        {stack.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.category} className="p-4 bg-ink-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-ink-850 border border-line-600 text-phos-400">
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-[12px] text-paper-100 font-sans">{item.category}</h4>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {item.technologies.map((tech) => (
                    <span key={tech} className="px-1.5 py-0.5 border border-line-600 text-paper-400">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 pt-3 border-t border-line-700 text-[11px] text-paper-600 leading-relaxed font-sans">{item.purpose}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
