import React, { useState } from 'react';
import { useNids } from '../context/NidsContext';
import { 
  Settings, 
  Save, 
  Lock, 
  Cpu, 
  Radio, 
  Check, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Wifi, 
  Network,
  Monitor,
  Terminal,
  Layers,
  Database
} from 'lucide-react';
import { LAB_ATTACKER_IP, LAB_TARGET_IP, LAB_SENSOR_IP } from '../services/attackService';

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
    featureSchema, 
    setFeatureSchema 
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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              Laboratory Diagnostics & System Settings
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              TRANSPORT: {activeTransport} (AUTO-DISCOVERED)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time diagnostics, authoritative event feed status, network transport selection, and detection parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-all shadow-md"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'SETTINGS SAVED' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>

      {/* 1. Live Authoritative System Diagnostics Section (Spec #14) */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#182438]">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white font-mono">1. Live Central Diagnostics & Event Bus</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshNetworkInterfaces}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121c2e] hover:bg-[#1a2942] border border-[#1e2e4b] text-slate-300 text-xs font-mono transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'TESTING...' : 'PING NIDS API'}</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Key-Value Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">PC ROLE</span>
            <div className="font-bold text-sm text-white truncate">{systemDiagnostics.pcRole}</div>
            <span className="text-[10px] text-slate-500">Client Role Setting</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">CLIENT / LOCAL IP</span>
            <div className="font-bold text-sm text-cyan-300 truncate">{systemDiagnostics.clientIp}</div>
            <span className="text-[10px] text-slate-500">Active Host Endpoint</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">NIDS SERVER IP</span>
            <div className="font-bold text-sm text-emerald-300 truncate">{systemDiagnostics.nidsServerIp}</div>
            <span className="text-[10px] text-slate-500">PC 2 Authoritative API</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">API STATUS</span>
            <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{connectionStatus.nidsApiConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            <span className="text-[10px] text-slate-500">Port 8000 REST ({connectionStatus.latencyMs}ms)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">WEBSOCKET FEED</span>
            <div className="font-bold text-sm flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connectionStatus.wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className={connectionStatus.wsConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {connectionStatus.wsConnected ? 'CONNECTED' : 'STANDBY'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">ws://{systemDiagnostics.nidsServerIp?.split(':')[0] || 'NOT DETECTED'}:8000/ws/live</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">NETWORK INTERFACE</span>
            <div className="font-bold text-sm text-purple-300">{activeTransport}</div>
            <span className="text-[10px] text-slate-500">Auto-Discovered Transport</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">SENSOR STATUS</span>
            <div className={`font-bold text-sm ${connectionStatus.sensorMode === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connectionStatus.sensorMode}
            </div>
            <span className="text-[10px] text-slate-500">Zeek / Suricata Capture</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">AI ENGINE STATUS</span>
            <div className="font-bold text-sm text-cyan-400">{connectionStatus.aiEngineMode}</div>
            <span className="text-[10px] text-slate-500">XGBoost v1.4.2 Engine</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">EVENTS RECEIVED</span>
            <div className="font-bold text-sm text-white">{systemDiagnostics.eventsReceivedCount}</div>
            <span className="text-[10px] text-slate-500">WebSocket Ingested</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">EVENTS DROPPED / DUP</span>
            <div className="font-bold text-sm text-slate-300">{systemDiagnostics.eventsDroppedCount}</div>
            <span className="text-[10px] text-slate-500">Deduplicated by event_id</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">LAST EVENT ID</span>
            <div className="font-bold text-xs text-blue-300 truncate">{systemDiagnostics.lastEventId}</div>
            <span className="text-[10px] text-slate-500">Type: {systemDiagnostics.lastEventType}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080d17] border border-[#162238] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">LAST EVENT TIME</span>
            <div className="font-bold text-sm text-white">{systemDiagnostics.lastEventTimestamp}</div>
            <span className="text-[10px] text-slate-500">Server Event Timestamp</span>
          </div>
        </div>

        {/* Action buttons for Sensor and AI test */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleTestSensor}
            className="px-3 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1b2b45] border border-[#20314f] text-xs font-mono text-cyan-300 transition-all"
          >
            TEST SENSOR STATUS
          </button>
          <button
            onClick={handleTestAi}
            className="px-3 py-1.5 rounded-lg bg-[#142033] hover:bg-[#1b2b45] border border-[#20314f] text-xs font-mono text-purple-300 transition-all"
          >
            TEST AI ENGINE
          </button>
          {sensorResult && (
            <span className="text-[11px] font-mono text-cyan-400">
              Sensor: {sensorResult.mode || sensorResult.status}
            </span>
          )}
          {aiResult && (
            <span className="text-[11px] font-mono text-purple-400">
              AI: {aiResult.engine || aiResult.status}
            </span>
          )}
        </div>
      </div>

      {/* 2. Detected Network Adapters */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#182438]">
          <Network className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-base text-white font-mono">2. Detected Network Interfaces</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {networkInterfaces.map((iface, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#080d17] border border-[#162238] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  {iface.type === 'Wi-Fi' ? <Wifi className="w-3.5 h-3.5 text-blue-400" /> : <Network className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{iface.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">IP: <span className="text-slate-200">{iface.ip}</span></div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                iface.status === 'Connected' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {iface.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Transport Preference Selection */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#182438]">
          <Network className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-base text-white font-mono">3. Transport Preference</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          {(['AUTO', 'ETHERNET', 'WI-FI'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTransportMode(t)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                transportMode === t
                  ? 'bg-purple-950/40 border-purple-500/50 text-white shadow-md'
                  : 'bg-[#080d17] border-[#162238] text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-300 font-bold">{t} TRANSPORT</span>
                {transportMode === t && <Check className="w-4 h-4 text-purple-400" />}
              </div>
              <span className="text-[11px] block text-slate-400">
                {t === 'AUTO' ? 'Auto-detect active link (Ethernet priority)' :
                 t === 'ETHERNET' ? 'Force direct Ethernet link' : 'Operate over Wi-Fi AP'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Client Role Setting */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#182438]">
          <Monitor className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base text-white font-mono">4. Client Role Setting</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <button
            onClick={() => setClientRole('ATTACK_LAB')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              clientRole === 'ATTACK_LAB'
                ? 'bg-red-950/40 border-red-500/50 text-white shadow-md'
                : 'bg-[#080d17] border-[#162238] text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="text-red-400 font-bold block mb-1">PC 1: ATTACK LAB</span>
            <span className="text-[11px] block text-slate-300">Remote controller for scenarios & target telemetry.</span>
          </button>

          <button
            onClick={() => setClientRole('NIDS_SOC')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              clientRole === 'NIDS_SOC'
                ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-md'
                : 'bg-[#080d17] border-[#162238] text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="text-cyan-400 font-bold block mb-1">PC 2: NIDS SOC</span>
            <span className="text-[11px] block text-slate-300">Central detection authority & SOC dashboard.</span>
          </button>

          <button
            onClick={() => setClientRole('UNIFIED')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              clientRole === 'UNIFIED'
                ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-md'
                : 'bg-[#080d17] border-[#162238] text-slate-400 hover:border-slate-600'
            }`}
          >
            <span className="text-blue-400 font-bold block mb-1">UNIFIED DUAL MODE</span>
            <span className="text-[11px] block text-slate-300">Single-PC development and presentation mode.</span>
          </button>
        </div>
      </div>

      {/* 5. AI Detection Thresholds */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#182438]">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base text-white font-mono">5. AI Classification & Risk Engine Thresholds</h3>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 font-semibold">XGBoost Softmax Confidence Alert Threshold</span>
              <span className="text-blue-400 font-bold">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="99"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 font-semibold">Isolation Forest Anomaly Sensitivity Cutoff</span>
              <span className="text-amber-400 font-bold">{anomalySens.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.01"
              value={anomalySens}
              onChange={(e) => setAnomalySens(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 6. Audio & Mode Switches */}
      <div className="bg-[#0e1626] border border-[#1a273d] rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#182438]">
          <Radio className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base text-white font-mono">6. Audio & Operation Preferences</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Audible SOC Alarm Sound</span>
              <span className="text-[10px] text-slate-400">Play alert audio on Critical threats</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                soundEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d17] border border-[#162238] flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">System Operation Mode</span>
              <span className="text-[10px] text-slate-400">DEMO, HYBRID, or LIVE LAN Mode</span>
            </div>
            <div className="flex items-center gap-1">
              {(['DEMO', 'HYBRID', 'LIVE'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    mode === m
                      ? m === 'LIVE' ? 'bg-emerald-600 text-white' : m === 'HYBRID' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                      : 'bg-[#101827] text-slate-400 hover:text-slate-200'
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
