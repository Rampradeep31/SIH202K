import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Map as MapIcon,
  GitCommit,
  TrendingUp,
  Sliders,
  FileCheck2,
  Database,
  Cpu,
  Settings,
  ShieldCheck,
  BarChart3,
  Rocket,
  Users,
  Library
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'research'
  | 'repository'
  | 'gis'
  | 'land_change'
  | 'predictions'
  | 'scenarios'
  | 'evidence'
  | 'datasets'
  | 'models'
  | 'dashboards'
  | 'innovation'
  | 'workspaces'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'research', label: 'Research & Policy', icon: BookOpen, badge: 'RAG' },
    { id: 'repository', label: 'Document Repository', icon: Library, badge: null },
    { id: 'gis', label: 'GIS Explorer', icon: MapIcon, badge: 'Ask-Map' },
    { id: 'land_change', label: 'Land Change', icon: GitCommit, badge: 'Matrix' },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp, badge: 'XAI' },
    { id: 'scenarios', label: 'Scenarios', icon: Sliders, badge: '3 Models' },
    { id: 'evidence', label: 'Evidence Chain', icon: FileCheck2, badge: 'Audit' },
    { id: 'datasets', label: 'Datasets', icon: Database, badge: 'Quality' },
    { id: 'models', label: 'Models & Monitoring', icon: Cpu, badge: 'Eval' },
    { id: 'dashboards', label: 'Dashboards', icon: BarChart3, badge: '7 Metrics' },
    { id: 'innovation', label: 'Innovation Portal', icon: Rocket, badge: null },
    { id: 'workspaces', label: 'Collaborative Workspaces', icon: Users, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-61px)] shrink-0">
      {/* Pilot Region Info Banner */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
          <span>Active Pilot Jurisdiction</span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Live
          </span>
        </div>
        <div className="text-sm font-bold text-slate-900">Tiruppur District</div>
        <div className="text-[11px] text-slate-500">Tamil Nadu • 7 Taluks • 320 Spatial Grids</div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-900 border border-blue-200/80 shadow-2xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-blue-200/70 text-blue-900 font-semibold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5 mb-0.5 text-slate-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
          <span>Statutory Governance Layer</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          DTCP & CMDA Aligned • TNCDBR 2019 • Not a replacement for DILRMP/NAKSHA.
        </p>
      </div>
    </aside>
  );
};
