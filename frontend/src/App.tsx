import React, { useState, useEffect, Suspense, lazy } from 'react';
import { UserRole } from './types';
import { setCurrentRole } from './services/api';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { ReportModal } from './components/ReportModal';
import { RotatingHalfRangoliRight } from './components/common/RotatingHalfRangoliRight';

// Pages — Overview loads eagerly (it's the default landing tab, so lazy-loading
// it would only add a network round-trip before the very first paint). Every
// other page is fetched on demand: previously all 14 pages shipped in one
// 1.9MB/523KB-gzip bundle (flagged by Vite's own build output) regardless of
// which tab a visitor ever opens — GIS Explorer alone is 1,584 lines with a
// full Leaflet map, and most demo sessions never touch most of these tabs.
import { OverviewPage } from './pages/OverviewPage';
const ResearchCopilotPage = lazy(() => import('./pages/ResearchCopilotPage').then(m => ({ default: m.ResearchCopilotPage })));
const RepositoryPage = lazy(() => import('./pages/RepositoryPage').then(m => ({ default: m.RepositoryPage })));
const GisExplorerPage = lazy(() => import('./pages/GisExplorerPage').then(m => ({ default: m.GisExplorerPage })));
const LulcChangePage = lazy(() => import('./pages/LulcChangePage').then(m => ({ default: m.LulcChangePage })));
const PredictionsPage = lazy(() => import('./pages/PredictionsPage').then(m => ({ default: m.PredictionsPage })));
const ScenariosPage = lazy(() => import('./pages/ScenariosPage').then(m => ({ default: m.ScenariosPage })));
const EvidenceChainPage = lazy(() => import('./pages/EvidenceChainPage').then(m => ({ default: m.EvidenceChainPage })));
const DatasetsPage = lazy(() => import('./pages/DatasetsPage').then(m => ({ default: m.DatasetsPage })));
const ModelsPage = lazy(() => import('./pages/ModelsPage').then(m => ({ default: m.ModelsPage })));
const DashboardsPage = lazy(() => import('./pages/DashboardsPage').then(m => ({ default: m.DashboardsPage })));
const InnovationPortalPage = lazy(() => import('./pages/InnovationPortalPage').then(m => ({ default: m.InnovationPortalPage })));
const WorkspacesPage = lazy(() => import('./pages/WorkspacesPage').then(m => ({ default: m.WorkspacesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
    <span>Loading…</span>
  </div>
);

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [userRole, setUserRole] = useState<UserRole>('Policymaker');
  const [selectedCellId, setSelectedCellId] = useState<string>('TP-0002');
  const [askMapInitialQuery, setAskMapInitialQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Keep the API layer's role header in sync so backend RBAC actually
  // enforces against whatever role is selected in the UI.
  useEffect(() => {
    setCurrentRole(userRole);
  }, [userRole]);

  // Modals
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleRunAskMap = (query: string) => {
    setAskMapInitialQuery(query);
    setActiveTab('gis');
  };

  const handleSelectCell = (cellId: string) => {
    setSelectedCellId(cellId);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans antialiased text-[#1F2421] relative overflow-x-hidden">
      {/* Website-Wide Subtle South Indian Heritage Background */}
      <div className="tn-site-heritage-bg" aria-hidden="true">
        <div className="tn-site-heritage-bg-layer" />
        <div className="tn-site-heritage-bg-overlay" />
      </div>

      {/* Top Header */}
      <div className="relative z-30">
        <Header
          currentRole={userRole}
          onRoleChange={setUserRole}
          onStartDemo={() => setIsDemoModalOpen(true)}
          onOpenReport={() => setIsReportModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
      </div>

      {/* Main Content Layout */}
      {/* z-40: must exceed the Header's z-30 above, otherwise the Sidebar drawer's
          own z-50 gets capped by this wrapper's stacking context and renders
          behind the header on any viewport where the header wraps to multiple lines. */}
      <div className="flex-1 flex overflow-hidden relative z-40">
        {/* Navigation Drawer (opens via the header's hamburger icon) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Main Workspace (full width — sidebar overlays rather than pushing content) */}
        <main className="flex-1 overflow-y-auto relative z-10 w-full">
        <Suspense fallback={<PageLoadingFallback />}>
          {activeTab === 'overview' && (
            <OverviewPage
              onNavigateTab={setActiveTab}
              onRunAskMap={handleRunAskMap}
            />
          )}

          {activeTab === 'research' && (
            <ResearchCopilotPage onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'repository' && <RepositoryPage />}

          {activeTab === 'gis' && (
            <GisExplorerPage
              initialQuery={askMapInitialQuery}
              onNavigateTab={setActiveTab}
              onSelectCell={handleSelectCell}
            />
          )}

          {activeTab === 'land_change' && (
            <LulcChangePage onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'predictions' && (
            <PredictionsPage
              selectedCellId={selectedCellId}
              onNavigateTab={setActiveTab}
              onSelectCell={handleSelectCell}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenariosPage
              onNavigateTab={setActiveTab}
              onOpenReport={() => setIsReportModalOpen(true)}
              userRole={userRole}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceChainPage
              selectedCellId={selectedCellId}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'datasets' && <DatasetsPage />}

          {activeTab === 'models' && <ModelsPage />}

          {activeTab === 'dashboards' && <DashboardsPage />}

          {activeTab === 'innovation' && <InnovationPortalPage userRole={userRole} />}

          {activeTab === 'workspaces' && <WorkspacesPage userRole={userRole} />}

          {activeTab === 'settings' && (
            <SettingsPage
              currentRole={userRole}
              onRoleChange={setUserRole}
            />
          )}
        </Suspense>
        </main>
      </div>

      {/* 15-Step Interactive Guided Demo Walkthrough Modal */}
      <DemoWalkthroughModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
        onSelectCell={handleSelectCell}
      />

      {/* Executive Evidence Brief Generator Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userRole={userRole}
      />

      {/* Single Slow-Spinning Half Rangoli Design covering the Right Half */}
      <RotatingHalfRangoliRight />
    </div>
  );
}

export default App;
