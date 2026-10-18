import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { NidsProvider, useNids } from './context/NidsContext';
import { Topbar } from './components/layout/Topbar';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { ActiveAttackBanner } from './components/layout/ActiveAttackBanner';
import { ToastAlerts } from './components/common/ToastAlerts';
import { ThreatDetailModal } from './components/soc/ThreatDetailModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages are route-split (React.lazy) instead of all bundled together, so a
// user viewing one page doesn't have to download all nine up front — see
// docs/GAPS_AND_FLAWS.md §5.6.
const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const LiveMonitorPage = lazy(() => import('./pages/LiveMonitorPage').then(m => ({ default: m.LiveMonitorPage })));
const ThreatsPage = lazy(() => import('./pages/ThreatsPage').then(m => ({ default: m.ThreatsPage })));
const AiEnginePage = lazy(() => import('./pages/AiEnginePage').then(m => ({ default: m.AiEnginePage })));
const AttackLabPage = lazy(() => import('./pages/AttackLabPage').then(m => ({ default: m.AttackLabPage })));
const NetworkPage = lazy(() => import('./pages/NetworkPage').then(m => ({ default: m.NetworkPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage').then(m => ({ default: m.ArchitecturePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const NIDS_SOC_ONLY_PAGES: NavPage[] = ['overview', 'monitor', 'threats', 'ai', 'reports'];

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24 text-slate-500 text-sm font-mono">
    Loading…
  </div>
);

const AppContent: React.FC = () => {
  const { selectedThreat, setSelectedThreat, clientRole } = useNids();
  const location = useLocation();
  const navigate = useNavigate();

  // Real routing (src/App previously kept the current page in useState, with
  // no deep-linking/back-button support and a full reload always dropping
  // back to the default page — see docs/GAPS_AND_FLAWS.md §5.1).
  const currentPage = (location.pathname.replace(/^\//, '') || 'overview') as NavPage;
  const goTo = (page: NavPage) => navigate(`/${page}`);

  // Role boundary enforcement: redirect away from pages the current role
  // shouldn't land on (mirrors the previous in-memory switch logic).
  useEffect(() => {
    if (clientRole === 'ATTACK_LAB' && NIDS_SOC_ONLY_PAGES.includes(currentPage)) {
      navigate('/attack-lab', { replace: true });
    } else if (clientRole === 'NIDS_SOC' && currentPage === 'attack-lab') {
      navigate('/overview', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientRole, currentPage]);

  return (
    <div className="min-h-screen bg-[#080c14] text-[#f1f5f9] flex flex-col">
      {/* Topbar */}
      <Topbar />

      {/* Active Attack Notification Banner (Only show on PC 1 or Unified) */}
      {clientRole !== 'NIDS_SOC' && (
        <ActiveAttackBanner onNavigateToAttackLab={() => goTo('attack-lab')} />
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar currentPage={currentPage} onSelectPage={goTo} />

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
              <span>Simulated Telemetry & Scripted Detection Stream (DEMO/HYBRID)</span>
            </div>
          )}

          <ErrorBoundary>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route
                  path="/overview"
                  element={<OverviewPage onNavigateToAttackLab={() => goTo('attack-lab')} onNavigateToAiEngine={() => goTo('ai')} />}
                />
                <Route path="/monitor" element={<LiveMonitorPage />} />
                <Route path="/threats" element={<ThreatsPage />} />
                <Route path="/ai" element={<AiEnginePage />} />
                <Route path="/attack-lab" element={<AttackLabPage />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/"
                  element={<Navigate to={clientRole === 'ATTACK_LAB' ? '/attack-lab' : '/overview'} replace />}
                />
                <Route
                  path="*"
                  element={<Navigate to={clientRole === 'ATTACK_LAB' ? '/attack-lab' : '/overview'} replace />}
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Real-Time Toast Alerts Stack */}
      <ToastAlerts onInvestigateLast={() => goTo('threats')} />

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
    <ErrorBoundary>
      <BrowserRouter>
        <NidsProvider>
          <AppContent />
        </NidsProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
