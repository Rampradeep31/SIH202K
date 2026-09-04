import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { setCurrentRole } from './services/api';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { ReportModal } from './components/ReportModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { ResearchCopilotPage } from './pages/ResearchCopilotPage';
import { RepositoryPage } from './pages/RepositoryPage';
import { GisExplorerPage } from './pages/GisExplorerPage';
import { LulcChangePage } from './pages/LulcChangePage';
import { PredictionsPage } from './pages/PredictionsPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { EvidenceChainPage } from './pages/EvidenceChainPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { ModelsPage } from './pages/ModelsPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { InnovationPortalPage } from './pages/InnovationPortalPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [userRole, setUserRole] = useState<UserRole>('Policymaker');
  const [selectedCellId, setSelectedCellId] = useState<string>('TP-0002');
  const [askMapInitialQuery, setAskMapInitialQuery] = useState<string>('');

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header */}
      <Header
        currentRole={userRole}
        onRoleChange={setUserRole}
        onStartDemo={() => setIsDemoModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto">
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

          {activeTab === 'innovation' && <InnovationPortalPage />}

          {activeTab === 'workspaces' && <WorkspacesPage userRole={userRole} />}

          {activeTab === 'settings' && (
            <SettingsPage
              currentRole={userRole}
              onRoleChange={setUserRole}
            />
          )}
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
    </div>
  );
}

export default App;
