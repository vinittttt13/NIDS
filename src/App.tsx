import React, { useState, useEffect } from 'react';
import { NidsProvider, useNids } from './context/NidsContext';
import { Topbar } from './components/layout/Topbar';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { ActiveAttackBanner } from './components/layout/ActiveAttackBanner';
import { ToastAlerts } from './components/common/ToastAlerts';
import { ThreatDetailModal } from './components/soc/ThreatDetailModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { ThreatsPage } from './pages/ThreatsPage';
import { AiEnginePage } from './pages/AiEnginePage';
import { AttackLabPage } from './pages/AttackLabPage';
import { NetworkPage } from './pages/NetworkPage';
import { ReportsPage } from './pages/ReportsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { selectedThreat, setSelectedThreat, clientRole } = useNids();

  // Route initialization by Role
  const [currentPage, setCurrentPage] = useState<NavPage>(() => 
    clientRole === 'ATTACK_LAB' ? 'attack-lab' : 'overview'
  );

  // Sync page when clientRole changes
  useEffect(() => {
    if (clientRole === 'ATTACK_LAB' && ['overview', 'monitor', 'threats', 'ai', 'reports'].includes(currentPage)) {
      setCurrentPage('attack-lab');
    } else if (clientRole === 'NIDS_SOC' && currentPage === 'attack-lab') {
      setCurrentPage('overview');
    }
  }, [clientRole, currentPage]);

  const renderPage = () => {
    // Role boundary enforcement
    if (clientRole === 'ATTACK_LAB' && ['overview', 'monitor', 'threats', 'ai', 'reports'].includes(currentPage)) {
      return <AttackLabPage />;
    }
    if (clientRole === 'NIDS_SOC' && currentPage === 'attack-lab') {
      return (
        <OverviewPage
          onNavigateToAttackLab={() => setCurrentPage('overview')}
          onNavigateToAiEngine={() => setCurrentPage('ai')}
        />
      );
    }

    switch (currentPage) {
      case 'overview':
        return (
          <OverviewPage
            onNavigateToAttackLab={() => setCurrentPage('attack-lab')}
            onNavigateToAiEngine={() => setCurrentPage('ai')}
          />
        );
      case 'monitor':
        return <LiveMonitorPage />;
      case 'threats':
        return <ThreatsPage />;
      case 'ai':
        return <AiEnginePage />;
      case 'attack-lab':
        return <AttackLabPage />;
      case 'network':
        return <NetworkPage />;
      case 'reports':
        return <ReportsPage />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return clientRole === 'ATTACK_LAB' ? <AttackLabPage /> : (
          <OverviewPage
            onNavigateToAttackLab={() => setCurrentPage('attack-lab')}
            onNavigateToAiEngine={() => setCurrentPage('ai')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-[#f1f5f9] flex flex-col">
      {/* Topbar */}
      <Topbar />

      {/* Active Attack Notification Banner (Only show on PC 1 or Unified) */}
      {clientRole !== 'NIDS_SOC' && (
        <ActiveAttackBanner onNavigateToAttackLab={() => setCurrentPage('attack-lab')} />
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentPage={currentPage} onSelectPage={(page) => setCurrentPage(page)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {/* Prominent Physical Perspective Watermark / Banner */}
          {clientRole === 'ATTACK_LAB' && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 flex items-center justify-between text-xs font-mono text-red-300 shadow-md">
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>ROLE: PC 1 — ATTACK LAB • REMOTE CONTROLLER</span>
              </span>
              <span>Dispatches controlled test scenarios to PC 2 Backend</span>
            </div>
          )}

          {clientRole === 'NIDS_SOC' && (
            <div className="mb-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-between text-xs font-mono text-cyan-300 shadow-md">
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>ROLE: PC 2 — NIDS SOC • DETECTION AUTHORITY</span>
              </span>
              <span>Authoritative Live Telemetry & XGBoost v1.4 Sensor Stream</span>
            </div>
          )}

          {renderPage()}
        </main>
      </div>

      {/* Real-Time Toast Alerts Stack */}
      <ToastAlerts onInvestigateLast={() => setCurrentPage('threats')} />

      {/* Deep Investigation Threat Modal */}
      <ThreatDetailModal
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <NidsProvider>
      <AppContent />
    </NidsProvider>
  );
};

export default App;
