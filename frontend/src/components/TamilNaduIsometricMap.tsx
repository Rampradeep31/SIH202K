import React, { useState } from 'react';
import { District } from '../types';
import { EXACT_TAMIL_NADU_DISTRICTS, ExactDistrictShape } from '../data/exactDistrictPaths';
import {
  Compass,
  MapPin,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface TamilNaduIsometricMapProps {
  districts: District[];
  selectedDistrict: District | null;
  selectedTaluk: string;
  onSelectDistrict: (district: District | null) => void;
  onSelectTaluk: (taluk: string) => void;
}

export const TamilNaduIsometricMap: React.FC<TamilNaduIsometricMapProps> = ({
  districts,
  selectedDistrict,
  selectedTaluk,
  onSelectDistrict,
  onSelectTaluk
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<ExactDistrictShape | null>(null);

  // Match the selectedDistrict ID with the exact shape record
  const currentSelectedShape = EXACT_TAMIL_NADU_DISTRICTS.find(
    (d) => d.id === selectedDistrict?.id || d.name.toLowerCase() === selectedDistrict?.name?.toLowerCase()
  );

  return (
    <div className="bg-slate-100/90 rounded-2xl border border-slate-300/80 shadow-md p-6 space-y-5">
      {/* Top Controls Bar: Dropdowns & Reset */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Tamil Nadu State Administrative Map
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Authentic Geographical Boundaries (No Hexagons)
            </span>
          </div>

          {selectedDistrict && (
            <button
              onClick={() => {
                onSelectDistrict(null);
                onSelectTaluk('');
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1 transition-colors self-start"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Selection</span>
            </button>
          )}
        </div>

        {/* Dropdown Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* District Dropdown */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              1. Select District:
            </label>
            <select
              value={selectedDistrict?.id || ''}
              onChange={(e) => {
                const shape = EXACT_TAMIL_NADU_DISTRICTS.find((d) => d.id === e.target.value);
                if (shape) {
                  onSelectDistrict(shape as any);
                } else {
                  onSelectDistrict(null);
                }
                onSelectTaluk('');
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-400 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Choose from Districts --</option>
              {EXACT_TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.region} Region)
                </option>
              ))}
            </select>
          </div>

          {/* Area / Taluk Dropdown */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              2. Select Area / Taluk:
            </label>
            <select
              value={selectedTaluk}
              onChange={(e) => onSelectTaluk(e.target.value)}
              disabled={!selectedDistrict}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-slate-400 focus:outline-hidden cursor-pointer ${
                selectedDistrict
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <option value="">
                {selectedDistrict ? `-- All Areas in ${selectedDistrict.name} --` : '-- Choose a District First --'}
              </option>
              {currentSelectedShape?.taluks?.map((tname) => (
                <option key={tname} value={tname}>
                  {tname} Taluk
                </option>
              ))}
            </select>
          </div>

          {/* Active Status Display */}
          <div className="flex flex-col justify-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Focus</span>
            <div className="text-xs font-bold text-slate-800 truncate">
              {selectedDistrict ? `${selectedDistrict.name} District` : 'Whole State'}
              {selectedTaluk ? ` • ${selectedTaluk}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main 3D Isometric Map Stage (Gray Studio Backdrop matching User's Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#a3aab5] via-[#8c94a2] to-[#798190] rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[620px]">
          {/* Subtle instruction pill */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/20 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-300" />
            <span>Click any exact district boundary to focus</span>
          </div>

          {/* Isometric 3D SVG Map with EXACT Geographic Contours */}
          <svg
            viewBox="0 0 600 720"
            className="w-full max-w-[520px] h-auto drop-shadow-2xl transition-all duration-300 select-none"
          >
            <defs>
              {/* Soft Drop Shadow Filter for 3D Relief */}
              <filter id="mapShadow3D" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="-12" dy="22" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.55" />
              </filter>

              {/* 3D Extrusion Side Wall Gradient (Thickness Depth) */}
              <linearGradient id="extrusionSide" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Pure White Top Surface with Subtle Satin Sheen */}
              <linearGradient id="districtWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f8fafc" />
              </linearGradient>

              {/* Hover Highlight (Crisp Electric Blue Glow) */}
              <linearGradient id="hoverGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#bfdbfe" />
              </linearGradient>

              {/* Selected Highlight (Deep Government Navy Blue) */}
              <linearGradient id="selectedDistrictGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* 1. LAYER A: 3D EXTRUSION SHADOW & SIDE DEPTH (Real Contours shifted) */}
            <g id="extrusion-depth-layer" transform="translate(-8, 14)" filter="url(#mapShadow3D)">
              {EXACT_TAMIL_NADU_DISTRICTS.map((d) => (
                <path
                  key={`side-${d.id}`}
                  d={d.path}
                  fill="url(#extrusionSide)"
                  stroke="#334155"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              ))}
            </g>

            {/* 2. LAYER B: TOP MONOCHROME WHITE SURFACE WITH EXACT BOUNDARY LINES */}
            <g id="districts-top-surface">
              {EXACT_TAMIL_NADU_DISTRICTS.map((d) => {
                const isSelected = currentSelectedShape?.id === d.id;
                const isHovered = hoveredDistrict?.id === d.id;

                return (
                  <g
                    key={`top-${d.id}`}
                    className="cursor-pointer transition-transform duration-150"
                    onMouseEnter={() => setHoveredDistrict(d)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    onClick={() => {
                      onSelectDistrict(d as any);
                      onSelectTaluk('');
                    }}
                  >
                    {/* Real District Boundary with Separated Border Lines */}
                    <path
                      d={d.path}
                      fill={
                        isSelected
                          ? 'url(#selectedDistrictGlow)'
                          : isHovered
                          ? 'url(#hoverGlow)'
                          : 'url(#districtWhite)'
                      }
                      stroke={
                        isSelected
                          ? '#0f172a'
                          : isHovered
                          ? '#2563eb'
                          : '#94a3b8'
                      }
                      strokeWidth={isSelected ? '2.5' : isHovered ? '2.0' : '1.2'}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="transition-colors duration-150"
                    />

                    {/* Exact Centered District Label */}
                    <text
                      x={d.center[0]}
                      y={d.center[1]}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isSelected ? '9' : '7.5'}
                      fontWeight={isSelected ? 'bold' : '600'}
                      fill={isSelected ? '#ffffff' : '#334155'}
                      className="pointer-events-none select-none tracking-tight font-sans"
                    >
                      {d.name.length > 9 ? d.name.substring(0, 8) + '..' : d.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Hover Badge on Map */}
          {hoveredDistrict && (
            <div className="absolute bottom-5 right-5 z-20 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none text-xs space-y-0.5">
              <div className="font-bold text-sm text-blue-300">{hoveredDistrict.name} District</div>
              <div className="text-[11px] text-slate-300">
                {hoveredDistrict.region} Region • {hoveredDistrict.area_sqkm.toLocaleString()} km²
              </div>
              <div className="text-[11px] text-slate-400">
                Population: {(hoveredDistrict.population / 100000).toFixed(1)} Lakhs • {hoveredDistrict.urban_pct}% Urban
              </div>
            </div>
          )}
        </div>

        {/* Right Info Box & Taluk Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-slate-700" />
              <span>District Profile</span>
            </h3>
            {currentSelectedShape && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {currentSelectedShape.region} TN
              </span>
            )}
          </div>

          {currentSelectedShape ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected District</span>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {currentSelectedShape.name}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {currentSelectedShape.description}
              </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Total Area</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {currentSelectedShape.area_sqkm.toLocaleString()} km²
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Population</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {(currentSelectedShape.population / 100000).toFixed(1)} Lakhs
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">Urban Share</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {currentSelectedShape.urban_pct}%
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-semibold">HQ</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {currentSelectedShape.hq}
                  </div>
                </div>
              </div>

              {/* Taluks / Sub-Areas list */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Areas / Taluks in {currentSelectedShape.name}:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {currentSelectedShape.taluks?.length || 0} Taluks
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {currentSelectedShape.taluks?.map((tname) => {
                    const isTalukActive = selectedTaluk === tname;
                    return (
                      <button
                        key={tname}
                        onClick={() => onSelectTaluk(tname)}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          isTalukActive
                            ? 'bg-blue-800 text-white font-bold shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tname}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedTaluk && (
                <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Active Taluk: {selectedTaluk}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Sub-district focus locked. Ready for land-use change detection and conversion risk forecasting.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Click any district on the 3D map</p>
              <p className="text-[11px]">
                Each district displays its authentic real boundary shape with separated lines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
