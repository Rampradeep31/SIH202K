import React from 'react';
import { UserRole } from '../types';
import { Shield, PlayCircle, FileText, Globe, Menu } from 'lucide-react';
import { TamilEmblemBadge } from './common/TraditionalMotifs';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onStartDemo: () => void;
  onOpenReport: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onStartDemo,
  onOpenReport,
  onToggleSidebar
}) => {
  return (
    <header className="bg-[#FAF9F5] border-b border-[#E2DDD5] px-6 py-3 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center justify-between">
        {/* Left: Navigation Menu Trigger (Hamburger), Branding & State Seal Emblem */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF5EC] border border-[#E2DDD5] text-[#1F2421] hover:text-[#C04A26] transition-all shadow-xs flex items-center justify-center cursor-pointer group shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#C04A26] group-hover:scale-110 transition-transform duration-200" />
          </button>

          <TamilEmblemBadge size={40} className="shadow-2xs shrink-0" />
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide text-[#1F2421]">
                Land Governance Intelligence Platform
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-[#C04A26]/10 text-[#C04A26] border border-[#C04A26]/25 hidden md:inline-block">
                Tamil Nadu (TN-LGIP)
              </span>
            </div>
            <p className="text-[11px] text-[#5E6460] font-medium">
              From Land Data to Policy Evidence • Pilot: Tiruppur District (Agricultural → Built-up Dynamics)
            </p>
          </div>
        </div>

        {/* Right: Actions, Role Selector & Coordinate Standards */}
        <div className="flex items-center space-x-3">
          {/* Interactive Guided Demo Button */}
          <button
            onClick={onStartDemo}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1E6B48] hover:bg-[#165236] text-white transition-all shadow-xs cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-[#F3C258]" />
            <span>Interactive SIH Demo (Steps 1–15)</span>
          </button>

          {/* Quick Evidence Brief Generator */}
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white hover:bg-[#F5EFE6] text-[#1F2421] border border-[#E2DDD5] transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#C04A26]" />
            <span>Evidence Brief</span>
          </button>

          {/* Role Selector */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E2DDD5]">
            <Shield className="w-4 h-4 text-[#C04A26]" />
            <span className="text-xs text-[#5E6460] font-medium hidden sm:inline">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-semibold bg-white border border-[#E2DDD5] rounded-xl px-3 py-1.5 text-[#1F2421] focus:outline-hidden focus:ring-2 focus:ring-[#C04A26]/20 focus:border-[#C04A26] cursor-pointer"
            >
              <option value="Policymaker">Policymaker</option>
              <option value="Researcher">Researcher</option>
              <option value="Government Analyst">Government Analyst</option>
              <option value="Public User">Public User</option>
            </select>
          </div>

          <div className="hidden lg:flex items-center space-x-1 text-xs text-[#5E6460] pl-2">
            <Globe className="w-3.5 h-3.5 text-[#1E6B48]" />
            <span className="font-mono text-[11px] text-[#5E6460] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#E2DDD5]">EPSG:4326</span>
          </div>
        </div>
      </div>
    </header>
  );
};
