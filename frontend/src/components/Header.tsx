import React from 'react';
import { UserRole } from '../types';
import { Shield, PlayCircle, FileText, Globe } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onStartDemo: () => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onStartDemo,
  onOpenReport
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Branding & State Emblem */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-900 text-white font-bold text-lg shadow-inner">
            TN
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Land Governance Intelligence Platform
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                Tamil Nadu (TN-LGIP)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              From Land Data to Policy Evidence • Pilot: Tiruppur District (Agricultural → Built-up Dynamics)
            </p>
          </div>
        </div>

        {/* Right: Actions, Role Selector & Guided Tour */}
        <div className="flex items-center space-x-3">
          {/* Guided Demo Button */}
          <button
            onClick={onStartDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Interactive SIH Demo (Steps 1–15)</span>
          </button>

          {/* Quick Evidence Brief */}
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Evidence Brief</span>
          </button>

          {/* Role Selector */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="Policymaker">Policymaker</option>
              <option value="Researcher">Researcher</option>
              <option value="Government Analyst">Government Analyst</option>
              <option value="Public User">Public User</option>
            </select>
          </div>

          <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-400 pl-2">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-[11px] text-slate-600">EPSG:4326</span>
          </div>
        </div>
      </div>
    </header>
  );
};
