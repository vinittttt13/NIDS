import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Server, 
  Volume2, 
  VolumeX, 
  Bell, 
  Monitor, 
  Cpu, 
  Crosshair,
  Radio,
  Wifi,
  Network
} from 'lucide-react';
import { useNids } from '../../context/NidsContext';

export const Topbar: React.FC = () => {
  const { 
    mode, 
    setMode, 
    clientRole,
    setClientRole,
    viewPerspective, 
    setViewPerspective, 
    connectionStatus,
    systemDiagnostics,
    activeTransport,
    threats, 
    soundEnabled, 
    setSoundEnabled,
    setSelectedThreat,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead
  } = useNids();

  const [time, setTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDiagModal, setShowDiagModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' LAB-UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeThreatsCount = threats.filter(t => t.status === 'ACTIVE').length;

  return (
    <header className="bg-[#0a0f1d] border-b border-[#1b273d] px-4 py-2 z-30 sticky top-0 flex flex-col gap-2">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        {/* Brand & System Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white font-mono">AI-NIDS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                  {activeTransport === 'ETHERNET' ? 'ETHERNET / LAN' : 'WI-FI / LAN'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">AI-Based Real-Time Network Intrusion Detection</p>
            </div>
          </div>
        </div>

        {/* Center / Role Badge */}
        <div className="flex items-center">
          {clientRole === 'ATTACK_LAB' ? (
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs font-bold shadow-md animate-pulse">
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
              <span>PC1: ATTACK LAB • REMOTE CONTROLLER</span>
            </div>
          ) : clientRole === 'NIDS_SOC' ? (
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold shadow-md">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>PC2: NIDS SOC • DETECTION SERVER</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-blue-950/60 border border-blue-500/50 text-blue-300 font-mono text-xs font-bold shadow-md">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>UNIFIED DUAL MODE</span>
            </div>
          )}
        </div>

        {/* Right Actions & Clock */}
      <div className="flex items-center gap-3">
        {/* Mode Selector (DEMO / HYBRID / LIVE) */}
        <div className="flex items-center bg-[#0e1626] rounded-lg p-0.5 border border-[#1b273d]">
          {(['DEMO', 'HYBRID', 'LIVE'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md transition-all ${
                mode === m
                  ? m === 'LIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : m === 'HYBRID'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg bg-[#121b2d] border border-[#1e2c47] text-slate-400 hover:text-slate-200 transition-colors"
          title={soundEnabled ? 'Alert audio enabled' : 'Alert audio muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Notifications Dropdown (Functional on SOC / Dual authority) */}
        {clientRole !== 'ATTACK_LAB' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-[#121b2d] border border-[#1e2c47] text-slate-400 hover:text-slate-200 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold font-mono shadow-sm animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-[#0e1626] border border-[#1f2e4d] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#1b273d] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">NOTIFICATIONS</span>
                    {unreadNotificationCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-mono font-bold">
                        {unreadNotificationCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-mono underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs font-mono">
                      No notifications recorded yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.notification_id || n.event_id}
                        onClick={() => markNotificationRead(n.notification_id)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                          !n.read 
                            ? 'bg-[#121f36] border-blue-500/40 hover:border-blue-400' 
                            : 'bg-[#0b1220] border-[#18263e] hover:border-slate-700 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs ${!n.read ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
                              {!n.read ? '●' : '○'}
                            </span>
                            <span className={`text-xs font-bold ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                              {n.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 pl-3 font-mono">
                          {n.message}
                        </p>
                        {n.data && (
                          <div className="mt-1.5 pl-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                            {n.data.source_ip && n.data.target_ip && (
                              <span className="text-cyan-300">
                                {n.data.source_ip} → {n.data.target_ip}
                              </span>
                            )}
                            {n.data.duration_seconds && (
                              <span className="text-slate-400">
                                Duration: {n.data.duration_seconds}s
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Clock & Latency */}
        <div className="hidden sm:flex flex-col text-right pl-2 border-l border-[#1b273d]">
          <span className="font-mono text-xs font-semibold text-slate-200">{time}</span>
          <span className="text-[10px] text-slate-500 font-mono">LATENCY: ~{connectionStatus.latencyMs}ms</span>
        </div>
      </div>
    </div>

      {/* Required Live Central Diagnostics Strip (Requirement #12) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1 rounded-lg bg-[#070b14] border border-[#162238] font-mono text-[10px]">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-slate-400">ROLE: </span>
            <span className={`font-bold ${clientRole === 'ATTACK_LAB' ? 'text-red-400' : clientRole === 'NIDS_SOC' ? 'text-cyan-400' : 'text-blue-400'}`}>
              {clientRole}
            </span>
          </div>

          <div>
            <span className="text-slate-400">CLIENT HOST: </span>
            <span className="font-bold text-white">{systemDiagnostics.clientIp}</span>
          </div>

          <div>
            <span className="text-slate-400">NIDS SERVER: </span>
            <span className="font-bold text-emerald-400">{systemDiagnostics.nidsServerIp}</span>
          </div>

          <div>
            <span className="text-slate-400">TRANSPORT: </span>
            <span className="font-bold text-purple-300">{activeTransport}</span>
          </div>

          <div>
            <span className="text-slate-400">MODE: </span>
            <span className="font-bold text-yellow-300">{mode}</span>
          </div>

          <div>
            <span className="text-slate-400">SENSOR: </span>
            <span className={`font-bold ${connectionStatus.sensorMode === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connectionStatus.sensorMode}
            </span>
          </div>

          <div>
            <span className="text-slate-400">AI: </span>
            <span className="font-bold text-cyan-300">{connectionStatus.aiEngineMode}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">API: </span>
            <span className={`font-bold ${connectionStatus.nidsApiConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {connectionStatus.nidsApiConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">WEBSOCKET: </span>
            <span className={`font-bold ${connectionStatus.wsConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connectionStatus.wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
