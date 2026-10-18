import React, { useState } from 'react';
import { useNids } from '../context/NidsContext';
import { Save, Check, RefreshCw, Activity, CheckCircle2, AlertTriangle, Wifi, Network, Monitor, Cpu, Radio } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    mode,
    setMode,
    clientRole,
    setClientRole,
    transportMode,
    setTransportMode,
    activeTransport,
    networkInterfaces,
    refreshNetworkInterfaces,
    connectionStatus,
    systemDiagnostics,
    runDiagnosticTest,
    testSensorConnection,
    testAiEngineConnection,
    soundEnabled,
    setSoundEnabled,
  } = useNids();

  const [threshold, setThreshold] = useState(85);
  const [anomalySens, setAnomalySens] = useState(0.80);
  const [testing, setTesting] = useState(false);
  const [sensorResult, setSensorResult] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await runDiagnosticTest();
    } finally {
      setTesting(false);
    }
  };

  const handleTestSensor = async () => {
    const res = await testSensorConnection();
    setSensorResult(res);
  };

  const handleTestAi = async () => {
    const res = await testAiEngineConnection();
    setAiResult(res);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <h1 className="text-xl font-medium text-paper-100">Laboratory diagnostics & system settings</h1>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[70ch]">
            Live diagnostics, event feed status, network transport selection, and detection parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-phos-400 hover:bg-phos-500 text-ink-950 text-[12px] font-medium transition-colors"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Settings saved' : 'Save configuration'}</span>
        </button>
      </div>

      {/* Live Diagnostics */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line-700">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
            <h3 className="text-[14px] text-paper-100">Live diagnostics & event bus</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshNetworkInterfaces}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-ink-900 hover:bg-ink-700 border border-line-600 text-paper-300 text-[12px] font-mono transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-ink-900 hover:bg-ink-700 border border-phos-700 text-phos-400 text-[12px] font-mono transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing…' : 'Ping NIDS API'}</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Key-Value Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line-700 font-mono text-[12px]">
          <Diag label="PC role" value={systemDiagnostics.pcRole} caption="Client role setting" />
          <Diag label="Client / local IP" value={systemDiagnostics.clientIp} caption="Active host endpoint" />
          <Diag label="NIDS server IP" value={systemDiagnostics.nidsServerIp} caption="PC 2 authoritative API" />

          <div className="p-3 bg-ink-900 space-y-1">
            <span className="text-[10px] text-phos-600 uppercase">API status</span>
            <div className={`text-[13px] flex items-center gap-1.5 ${connectionStatus.nidsApiConnected ? 'text-phos-400' : 'text-sev-critical'}`}>
              {connectionStatus.nidsApiConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{connectionStatus.nidsApiConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            <span className="text-[10px] text-paper-600">Port 8000 REST ({connectionStatus.latencyMs}ms)</span>
          </div>

          <div className="p-3 bg-ink-900 space-y-1">
            <span className="text-[10px] text-phos-600 uppercase">WebSocket feed</span>
            <div className="text-[13px] flex items-center gap-1.5">
              <span className={`w-[6px] h-[6px] rounded-full ${connectionStatus.wsConnected ? 'bg-phos-400 shadow-live' : 'bg-sev-medium'}`} />
              <span className={connectionStatus.wsConnected ? 'text-phos-400' : 'text-sev-medium'}>
                {connectionStatus.wsConnected ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>
            <span className="text-[10px] text-paper-600">ws://{systemDiagnostics.nidsServerIp?.split(':')[0] || 'NOT DETECTED'}:8000/ws/live</span>
          </div>

          <Diag label="Network interface" value={activeTransport} caption="Auto-discovered transport" />

          <div className="p-3 bg-ink-900 space-y-1">
            <span className="text-[10px] text-phos-600 uppercase">Sensor status</span>
            <div className={`text-[13px] ${connectionStatus.sensorMode === 'LIVE' ? 'text-phos-400' : 'text-paper-400'}`}>{connectionStatus.sensorMode}</div>
            <span className="text-[10px] text-paper-600">Simulated capture (no real sensor wired in)</span>
          </div>

          <div className="p-3 bg-ink-900 space-y-1">
            <span className="text-[10px] text-phos-600 uppercase">AI engine status</span>
            <div className="text-[13px] text-paper-400">{connectionStatus.aiEngineMode}</div>
            <span className="text-[10px] text-paper-600">No trained model is loaded</span>
          </div>

          <Diag label="Events received" value={String(systemDiagnostics.eventsReceivedCount)} caption="WebSocket ingested" />
          <Diag label="Events dropped / dup" value={String(systemDiagnostics.eventsDroppedCount)} caption="Deduplicated by event_id" />
          <Diag label="Last event ID" value={systemDiagnostics.lastEventId} caption={`Type: ${systemDiagnostics.lastEventType}`} />
          <Diag label="Last event time" value={systemDiagnostics.lastEventTimestamp} caption="Server event timestamp" />
        </div>

        {/* Action buttons for Sensor and AI test */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleTestSensor}
            className="px-2.5 py-1.5 bg-ink-900 hover:bg-ink-700 border border-line-600 text-[12px] font-mono text-paper-300 transition-colors"
          >
            Test sensor status
          </button>
          <button
            onClick={handleTestAi}
            className="px-2.5 py-1.5 bg-ink-900 hover:bg-ink-700 border border-line-600 text-[12px] font-mono text-paper-300 transition-colors"
          >
            Test AI engine
          </button>
          {sensorResult && <span className="text-[11px] font-mono text-phos-400">Sensor: {sensorResult.mode || sensorResult.status}</span>}
          {aiResult && <span className="text-[11px] font-mono text-phos-400">AI: {aiResult.engine || aiResult.status}</span>}
        </div>
      </div>

      {/* Detected Network Interfaces */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-line-700">
          <Network className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Detected network interfaces</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-700 font-mono text-[12px]">
          {networkInterfaces.map((iface, idx) => (
            <div key={idx} className="p-3 bg-ink-900 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-paper-100">
                  {iface.type === 'Wi-Fi' ? <Wifi className="w-3.5 h-3.5 text-paper-600" /> : <Network className="w-3.5 h-3.5 text-paper-600" />}
                  <span>{iface.name}</span>
                </div>
                <div className="text-[11px] text-paper-600 mt-0.5">IP <span className="text-paper-300">{iface.ip}</span></div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 border ${iface.status === 'Connected' ? 'text-phos-400 border-phos-700' : 'text-paper-600 border-line-600'}`}>
                {iface.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transport Preference Selection */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-line-700">
          <Radio className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Transport preference</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line-700 font-mono text-[12px]">
          {(['AUTO', 'ETHERNET', 'WI-FI'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTransportMode(t)}
              className={`p-3.5 text-left transition-colors ${transportMode === t ? 'bg-ink-700 text-paper-100 border-l-2 border-phos-400' : 'bg-ink-900 text-paper-400 hover:text-paper-200'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={transportMode === t ? 'text-phos-400' : 'text-paper-300'}>{t} transport</span>
                {transportMode === t && <Check className="w-3.5 h-3.5 text-phos-400" />}
              </div>
              <span className="text-[11px] block text-paper-600">
                {t === 'AUTO' ? 'Auto-detect active link (Ethernet priority)' : t === 'ETHERNET' ? 'Force direct Ethernet link' : 'Operate over Wi-Fi AP'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Client Role Setting */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-line-700">
          <Monitor className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Client role setting</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line-700 font-mono text-[12px]">
          {([
            { role: 'ATTACK_LAB' as const, label: 'PC 1: attack lab', desc: 'Remote controller for scenarios & target telemetry.' },
            { role: 'NIDS_SOC' as const, label: 'PC 2: NIDS SOC', desc: 'Central detection authority & SOC dashboard.' },
            { role: 'UNIFIED' as const, label: 'Unified dual mode', desc: 'Single-PC development and presentation mode.' },
          ]).map(({ role, label, desc }) => (
            <button
              key={role}
              onClick={() => setClientRole(role)}
              className={`p-3.5 text-left transition-colors ${clientRole === role ? 'bg-ink-700 border-l-2 border-phos-400' : 'bg-ink-900 hover:text-paper-200'}`}
            >
              <span className={`block mb-1 ${clientRole === role ? 'text-phos-400' : 'text-paper-300'}`}>{label}</span>
              <span className="text-[11px] block text-paper-600">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Detection Thresholds */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-line-700">
          <Cpu className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">AI classification & risk engine thresholds</h3>
        </div>

        <div className="space-y-3 font-mono text-[12px]">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-paper-300">XGBoost softmax confidence alert threshold</span>
              <span className="text-phos-400">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-line-700 appearance-none cursor-pointer accent-phos-400"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-paper-300">Isolation forest anomaly sensitivity cutoff</span>
              <span className="text-phos-400">{anomalySens.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.01"
              value={anomalySens}
              onChange={(e) => setAnomalySens(Number(e.target.value))}
              className="w-full h-1.5 bg-line-700 appearance-none cursor-pointer accent-phos-400"
            />
          </div>
        </div>
      </div>

      {/* Audio & Mode Switches */}
      <div className="bg-ink-800 border border-line-700 p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-line-700">
          <Radio className="w-4 h-4 text-phos-400" strokeWidth={1.75} />
          <h3 className="text-[14px] text-paper-100">Audio & operation preferences</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line-700 text-[12px] font-mono">
          <div className="p-3.5 bg-ink-900 flex items-center justify-between">
            <div>
              <span className="text-paper-100 block">Audible SOC alarm sound</span>
              <span className="text-[10px] text-paper-600">Play alert audio on critical threats</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1 text-[11px] border ${soundEnabled ? 'bg-phos-400 text-ink-950 border-phos-400' : 'bg-ink-800 text-paper-600 border-line-600'}`}
            >
              {soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="p-3.5 bg-ink-900 flex items-center justify-between">
            <div>
              <span className="text-paper-100 block">System operation mode</span>
              <span className="text-[10px] text-paper-600">DEMO, HYBRID, or LIVE LAN mode</span>
            </div>
            <div className="flex items-center text-[11px]">
              {(['DEMO', 'HYBRID', 'LIVE'] as const).map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-1 transition-colors ${i > 0 ? 'border-l border-line-700' : ''} ${
                    mode === m ? 'text-phos-400 bg-ink-800' : 'text-paper-600 hover:text-paper-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Diag: React.FC<{ label: string; value: string; caption: string }> = ({ label, value, caption }) => (
  <div className="p-3 bg-ink-900 space-y-1">
    <span className="text-[10px] text-phos-600 uppercase">{label}</span>
    <div className="text-[13px] text-paper-100 truncate">{value}</div>
    <span className="text-[10px] text-paper-600">{caption}</span>
  </div>
);
