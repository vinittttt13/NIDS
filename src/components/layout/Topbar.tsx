import React, { useState, useEffect } from 'react';
import { ShieldHalf, Volume2, VolumeX, Bell } from 'lucide-react';
import { useNids } from '../../context/NidsContext';

export const Topbar: React.FC = () => {
  const {
    mode,
    setMode,
    clientRole,
    connectionStatus,
    systemDiagnostics,
    activeTransport,
    soundEnabled,
    setSoundEnabled,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNids();

  const [time, setTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleLabel =
    clientRole === 'ATTACK_LAB' ? 'Attack lab · PC 1' : clientRole === 'NIDS_SOC' ? 'SOC console · PC 2' : 'Unified console';

  return (
    <header className="bg-ink-900 border-b border-line-700 px-5 py-2.5 z-30 sticky top-0 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <ShieldHalf className="w-[18px] h-[18px] text-paper-300" strokeWidth={1.75} />
          <div className="leading-tight">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-[15px] text-paper-100">AI-NIDS</span>
              <span className="text-[12px] text-paper-600">{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-0.5 text-[12px]">
          {(['DEMO', 'HYBRID', 'LIVE'] as const).map((m, i) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 transition-colors ${i > 0 ? 'border-l border-line-700' : ''} ${
                mode === m ? 'text-paper-100 bg-ink-800' : 'text-paper-600 hover:text-paper-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-paper-600 hover:text-paper-300 transition-colors"
            title={soundEnabled ? 'Alert audio enabled' : 'Alert audio muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {clientRole !== 'ATTACK_LAB' && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-paper-600 hover:text-paper-300 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 bg-sev-high text-ink-950 rounded-full text-[9px] font-medium flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-ink-850 border border-line-700 shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-line-700 mb-2">
                    <span className="text-[12px] text-paper-400">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-[11px] text-paper-600 hover:text-paper-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-paper-600 text-[12px]">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.notification_id || n.event_id}
                          onClick={() => markNotificationRead(n.notification_id)}
                          className={`p-2.5 border-l-2 cursor-pointer transition-colors ${
                            !n.read ? 'border-sev-low bg-ink-800' : 'border-transparent hover:bg-ink-800/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[12px] ${!n.read ? 'text-paper-100' : 'text-paper-400'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-paper-600 font-mono whitespace-nowrap">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-paper-400 mt-0.5">{n.message}</p>
                          {n.data?.source_ip && n.data?.target_ip && (
                            <p className="mt-1 text-[10px] text-paper-600 font-mono">
                              {n.data.source_ip} → {n.data.target_ip}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <span className="font-mono text-[12px] text-paper-400 pl-3 border-l border-line-700">{time}</span>
        </div>
      </div>

      {/* Diagnostics strip — real connection/system state, dense and quiet */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-paper-600">
        <DiagField label="role" value={clientRole} />
        <DiagField label="client" value={systemDiagnostics.clientIp} />
        <DiagField label="server" value={systemDiagnostics.nidsServerIp} />
        <DiagField label="transport" value={activeTransport} />
        <DiagField label="sensor" value={connectionStatus.sensorMode} muted={connectionStatus.sensorMode !== 'LIVE'} />
        <DiagField label="ai" value={connectionStatus.aiEngineMode} muted />
        <span className="ml-auto flex items-center gap-4">
          <DiagField label="api" value={connectionStatus.nidsApiConnected ? 'up' : 'down'} ok={connectionStatus.nidsApiConnected} />
          <DiagField label="ws" value={connectionStatus.wsConnected ? 'up' : 'down'} ok={connectionStatus.wsConnected} />
          <span>{connectionStatus.latencyMs}ms</span>
        </span>
      </div>
    </header>
  );
};

const DiagField: React.FC<{ label: string; value: string; ok?: boolean; muted?: boolean }> = ({
  label,
  value,
  ok,
  muted,
}) => (
  <span>
    <span className="text-paper-600">{label} </span>
    <span
      className={
        ok === true
          ? 'text-phos-400'
          : ok === false
          ? 'text-sev-critical'
          : muted
          ? 'text-paper-400'
          : 'text-paper-300'
      }
    >
      {value}
    </span>
  </span>
);
