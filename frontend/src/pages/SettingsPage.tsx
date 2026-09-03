import React from 'react';
import { UserRole } from '../types';
import {
  Settings,
  Shield,
  Globe,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SettingsPageProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <span>Platform Settings & Governance Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          System parameters, user role permissions, CRS standards, and security constraints.
        </p>
      </div>

      {/* Role & Access Controls */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Role-Based Access Control (RBAC)
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">Current Role: {currentRole}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              role: 'Policymaker',
              desc: 'Can compare scenarios, adjust policy sensitivity weights, and generate executive evidence briefs.'
            },
            {
              role: 'Researcher',
              desc: 'Can query grounded RAG copilot, inspect statutory and peer-reviewed documents, and analyze transition matrices.'
            },
            {
              role: 'Government Analyst',
              desc: 'Can review ML calibration curves, spatial validation metrics, and audit feature provenance chains.'
            },
            {
              role: 'Public User',
              desc: 'Read-only access to approved non-sensitive maps and aggregate district statistics.'
            }
          ].map((item) => (
            <div
              key={item.role}
              onClick={() => onRoleChange(item.role as UserRole)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                currentRole === item.role
                  ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">{item.role}</span>
                {currentRole === item.role && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spatial & Jurisdiction Settings */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3 text-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Spatial & Jurisdiction Configuration</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block mb-1">Jurisdiction:</span>
            <span className="font-bold text-slate-800">State of Tamil Nadu, India</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block mb-1">Active Pilot District:</span>
            <span className="font-bold text-slate-800">Tiruppur (7 Taluks, 320 Spatial Grids)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block mb-1">Coordinate Reference System:</span>
            <span className="font-mono font-bold text-slate-800">EPSG:4326 (WGS 84)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block mb-1">Backend REST API Endpoint:</span>
            <span className="font-mono font-bold text-slate-800">http://127.0.0.1:8000/api/v1</span>
          </div>
        </div>
      </div>

      {/* Privacy & Statutory Guardrails */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1.5 text-amber-900">
        <div className="flex items-center space-x-1.5 font-bold">
          <Lock className="w-4 h-4 text-amber-700" />
          <span>Statutory Compliance & Privacy Guardrails</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-700">
          In strict compliance with Government of India and Government of Tamil Nadu data directives:
          This platform consumes only non-sensitive public remote sensing telemetry, open government statistics, and aggregated planning grids.
          <strong>No private citizen land ownership records, patta/chitta identification, or individual encumbrance certificates are collected, processed, or exposed.</strong>
        </p>
      </div>
    </div>
  );
};
