import React, { useState } from 'react';
import { District } from '../types';
import {
  MapPin,
  Info,
  ChevronRight,
  ExternalLink,
  Compass,
  Building2,
  Wheat,
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface TamilNaduMapViewerProps {
  districts: District[];
  selectedDistrict: District | null;
  selectedTaluk: string;
  onSelectDistrict: (district: District) => void;
  onSelectTaluk: (taluk: string) => void;
  onOpenGisMicroView: () => void;
  onOpenResearch: () => void;
}

// Convert lon/lat to SVG coordinates (Width 600, Height 750)
// Tamil Nadu: lon ~ 76.2 to 80.4, lat ~ 8.0 to 13.6
function projectCoord(lon: number, lat: number): [number, number] {
  const minLon = 76.1;
  const maxLon = 80.4;
  const minLat = 8.0;
  const maxLat = 13.6;

  const x = Math.round(((lon - minLon) / (maxLon - minLon)) * 520 + 40);
  const y = Math.round(((maxLat - lat) / (maxLat - minLat)) * 680 + 35);
  return [x, y];
}

// Generate stylized boundary polygon paths for all 38 districts
function getDistrictPath(d: District): string {
  const [cx, cy] = projectCoord(d.lon || 77.5, d.lat || 11.0);
  const r = Math.max(22, Math.min(48, Math.round(Math.sqrt(d.area_sqkm) * 0.45)));

  // Generate 8-point polygon with slight natural variations
  const points: [number, number][] = [];
  const numPoints = 8;
  const seed = (d.id.charCodeAt(0) + d.id.charCodeAt(d.id.length - 1)) % 5;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const varR = r * (0.85 + 0.25 * Math.sin(angle * 2 + seed));
    const px = Math.round(cx + varR * Math.cos(angle) * 1.05);
    const py = Math.round(cy + varR * Math.sin(angle) * 0.95);
    points.push([px, py]);
  }

  return `M ${points.map((p) => `${p[0]},${p[1]}`).join(' L ')} Z`;
}

export const TamilNaduMapViewer: React.FC<TamilNaduMapViewerProps> = ({
  districts,
  selectedDistrict,
  selectedTaluk,
  onSelectDistrict,
  onSelectTaluk,
  onOpenGisMicroView,
  onOpenResearch
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<District | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Header & Dropdown Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900">
              Tamil Nadu State Map (38 Districts)
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Interactive Vector Boundary Map
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hover and click any district to inspect, or pick a district and area directly from the dropdown below.
          </p>
        </div>

        {/* Action button */}
        {selectedDistrict && (
          <button
            onClick={() => onSelectDistrict(null as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Map View</span>
          </button>
        )}
      </div>

      {/* Dropdown Selection Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* Dropdown 1: District */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            1. Select District ({districts.length} Districts):
          </label>
          <div className="relative">
            <select
              value={selectedDistrict?.id || ''}
              onChange={(e) => {
                const d = districts.find((dist) => dist.id === e.target.value);
                if (d) onSelectDistrict(d);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Choose a District --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.pilot_focus ? '★ (Active Pilot)' : ''} ({d.region} Region)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropdown 2: Area / Taluk */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            2. Select Area / Taluk in {selectedDistrict ? selectedDistrict.name : 'District'}:
          </label>
          <div className="relative">
            <select
              value={selectedTaluk}
              onChange={(e) => onSelectTaluk(e.target.value)}
              disabled={!selectedDistrict}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer ${
                selectedDistrict
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <option value="">
                {selectedDistrict ? `-- All Areas in ${selectedDistrict.name} --` : '-- Select a District First --'}
              </option>
              {selectedDistrict?.taluks?.map((tname) => (
                <option key={tname} value={tname}>
                  {tname} Taluk
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex flex-col justify-center space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Selection</span>
          <div className="text-xs font-bold text-slate-900 truncate">
            {selectedDistrict ? `${selectedDistrict.name} District` : 'Whole Tamil Nadu'}
            {selectedTaluk ? ` → ${selectedTaluk}` : ''}
          </div>
        </div>
      </div>

      {/* Main Map + District Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: 3D-styled Tamil Nadu Vector Map */}
        <div className="lg:col-span-7 xl:col-span-8 bg-slate-100/70 rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner min-h-[560px]">
          {/* Subtle Background Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 text-xs text-slate-500 font-semibold bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Compass className="w-4 h-4 text-blue-700" />
            <span>Click any district to inspect</span>
          </div>

          {/* SVG Vector Map of Tamil Nadu */}
          <svg
            viewBox="0 0 600 750"
            className="w-full max-w-[500px] h-auto drop-shadow-xl transition-all duration-300"
            style={{ filter: 'drop-shadow(0 15px 25px rgba(15, 23, 42, 0.15))' }}
          >
            <defs>
              <linearGradient id="districtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="selectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#172554" />
              </linearGradient>
              <linearGradient id="pilotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* Render each district polygon with separated border lines */}
            <g id="tamil-nadu-districts">
              {districts.map((d) => {
                const isSelected = selectedDistrict?.id === d.id;
                const isHovered = hoveredDistrict?.id === d.id;
                const isPilot = d.pilot_focus;
                const [cx, cy] = projectCoord(d.lon || 77.5, d.lat || 11.0);
                const pathData = getDistrictPath(d);

                return (
                  <g key={d.id} className="cursor-pointer group">
                    <path
                      d={pathData}
                      fill={
                        isSelected
                          ? 'url(#selectedGradient)'
                          : isPilot
                          ? 'url(#pilotGradient)'
                          : isHovered
                          ? '#cbd5e1'
                          : 'url(#districtGradient)'
                      }
                      stroke={isSelected ? '#0f172a' : '#94a3b8'}
                      strokeWidth={isSelected ? '2.5' : '1.2'}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter="url(#subtleShadow)"
                      className="transition-all duration-200"
                      onMouseEnter={() => setHoveredDistrict(d)}
                      onMouseLeave={() => setHoveredDistrict(null)}
                      onClick={() => onSelectDistrict(d)}
                    />

                    {/* Centered District Label */}
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isSelected || isPilot ? '9' : '7.5'}
                      fontWeight={isSelected || isPilot ? 'bold' : '600'}
                      fill={isSelected || isPilot ? '#ffffff' : '#334155'}
                      className="pointer-events-none select-none tracking-tight"
                    >
                      {d.name.length > 9 ? d.name.substring(0, 8) + '..' : d.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredDistrict && (
            <div className="absolute bottom-4 right-4 z-20 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700 pointer-events-none space-y-1">
              <div className="font-bold text-sm text-emerald-400">{hoveredDistrict.name} District</div>
              <div className="text-[11px] text-slate-300">
                {hoveredDistrict.region} Region • {hoveredDistrict.area_sqkm.toLocaleString()} km²
              </div>
              <div className="text-[11px] text-slate-400">
                Pop: {(hoveredDistrict.population / 100000).toFixed(1)} Lakhs • {hoveredDistrict.urban_pct}% Urban
              </div>
            </div>
          )}
        </div>

        {/* Right 5/4 cols: Selected District Profile Card & Action Panel */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {selectedDistrict ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Selected District
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedDistrict.name}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  {selectedDistrict.region} TN
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedDistrict.description}
              </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Total Area</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedDistrict.area_sqkm.toLocaleString()} km²
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Total Population</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {(selectedDistrict.population / 100000).toFixed(1)} Lakhs
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Urban Share</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedDistrict.urban_pct}%
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Headquarters</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedDistrict.hq}
                  </div>
                </div>
              </div>

              {/* Sub-Areas / Taluks in this District */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Taluks / Areas ({selectedDistrict.taluks?.length || 0})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click dropdown above to focus</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDistrict.taluks?.map((tname) => {
                    const isTalukActive = selectedTaluk === tname;
                    return (
                      <button
                        key={tname}
                        onClick={() => onSelectTaluk(tname)}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                          isTalukActive
                            ? 'bg-blue-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {tname}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={onOpenGisMicroView}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open Satellite Street View & Risk Parcels</span>
                </button>

                <button
                  onClick={onOpenResearch}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-blue-700" />
                  <span>Ask AI Policy Copilot for {selectedDistrict.name}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
              <Compass className="w-10 h-10 text-blue-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Select Any District</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click any of the 38 districts on the map or use the dropdown to inspect area statistics, taluks, and land-use pressure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
