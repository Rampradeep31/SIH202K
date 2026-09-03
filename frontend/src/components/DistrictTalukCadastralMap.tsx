import React, { useState } from 'react';
import { District } from '../types';
import { getCadastralDistrictData, DistrictCadastralData, CadastralTaluk } from '../data/districtCadastralMaps';
import { EXACT_TAMIL_NADU_DISTRICTS } from '../data/exactDistrictPaths';
import {
  MapPin,
  BookOpen,
  Users,
  Compass,
  Home,
  Maximize2,
  Info,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Building2,
  Wheat,
  Layers,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';

interface DistrictTalukCadastralMapProps {
  district: District;
  selectedTaluk: string;
  onSelectTaluk: (talukName: string) => void;
  onBackToStateMap: () => void;
}

export const DistrictTalukCadastralMap: React.FC<DistrictTalukCadastralMapProps> = ({
  district,
  selectedTaluk,
  onSelectTaluk,
  onBackToStateMap
}) => {
  const [hoveredTalukId, setHoveredTalukId] = useState<string | null>(null);

  // Retrieve authentic cadastral map dataset for this district
  const cadastralData: DistrictCadastralData = getCadastralDistrictData(district.id, district.name);

  // Exact district shape from statewide dataset for the mini inset maps
  const districtShape = EXACT_TAMIL_NADU_DISTRICTS.find(
    (d) => d.id.toLowerCase() === district.id.toLowerCase() || d.name.toLowerCase() === district.name.toLowerCase()
  ) || EXACT_TAMIL_NADU_DISTRICTS.find((d) => d.id === 'erode') || EXACT_TAMIL_NADU_DISTRICTS[0];

  // Helper to test if a taluk is currently selected
  const isTalukActive = (taluk: CadastralTaluk) => {
    if (!selectedTaluk) return false;
    const s = selectedTaluk.toLowerCase().replace(/ taluk/g, '').trim();
    const t = taluk.name.toLowerCase().replace(/ taluk/g, '').trim();
    return s.includes(t) || t.includes(s) || taluk.id.toLowerCase() === s;
  };

  // Find active taluk object
  const activeTaluk = cadastralData.taluks.find((t) => isTalukActive(t));

  // Dynamic SVG viewBox for each district (standardized 800x800 coordinate grid for GIS polygons)
  const getViewBox = () => "0 0 800 800";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-4 sm:p-6 space-y-4 max-w-[1400px] mx-auto font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* TOP HEADER & BREADCRUMBS BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {cadastralData.districtName} DISTRICT – TALUK WISE MAP
          </h1>
          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Revenue Taluks of {district.name} District, Tamil Nadu</span>
          </div>
        </div>

        {/* Breadcrumbs Pill Container (Matching Reference Image) */}
        <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-1.5 text-xs text-slate-600 shadow-2xs self-start md:self-auto">
          <button
            onClick={onBackToStateMap}
            className="font-medium hover:text-blue-800 transition-colors flex items-center space-x-1"
          >
            <span>Tamil Nadu</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => onSelectTaluk('')}
            className={`font-semibold hover:text-blue-800 transition-colors ${!selectedTaluk ? 'text-blue-900 font-bold' : ''}`}
          >
            {district.name} District
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-blue-700">
            {selectedTaluk ? `${selectedTaluk} Taluk` : 'Select Taluk'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN 3-COLUMN DASHBOARD GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: Mini Map, Inset District Silhouette, Taluk List */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-3.5 flex flex-col">
          
          {/* CARD 1: TAMIL NADU Context Map (Mini State Inset) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col items-center">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase text-center mb-1">
              TAMIL NADU
            </span>
            <div className="w-full h-36 flex items-center justify-center relative">
              <svg viewBox="0 0 600 720" className="w-full h-full max-h-36 drop-shadow-2xs">
                {EXACT_TAMIL_NADU_DISTRICTS.map((d) => {
                  const isCurrent =
                    d.id.toLowerCase() === district.id.toLowerCase() ||
                    d.name.toLowerCase() === district.name.toLowerCase();
                  return (
                    <path
                      key={`tn-mini-${d.id}`}
                      d={d.path}
                      fill={isCurrent ? '#f87171' : '#f1f5f9'}
                      stroke={isCurrent ? '#dc2626' : '#cbd5e1'}
                      strokeWidth={isCurrent ? '2.5' : '1'}
                      className="transition-colors"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 self-center">
              <span className="w-2.5 h-2.5 bg-[#f87171] border border-red-500 rounded-xs inline-block" />
              <span>{district.name} District</span>
            </div>
          </div>

          {/* CARD 2: DISTRICT Inset Map */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col items-center">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase text-center mb-1">
              {district.name.toUpperCase()} DISTRICT
            </span>
            <div className="w-full h-28 flex items-center justify-center relative p-1">
              <svg
                viewBox={getViewBox()}
                className="w-full h-full max-h-28 drop-shadow-xs"
              >
                {cadastralData.taluks.map((t) => (
                  <path
                    key={`inset-${t.id}`}
                    d={t.path}
                    fill="#fef08a"
                    stroke="#475569"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>
            <span className="text-[11px] font-extrabold text-blue-900 text-center mt-1">
              Total Taluks: {cadastralData.taluks.length}
            </span>
          </div>

          {/* CARD 3: TALUK LIST */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase block mb-2.5">
              TALUK LIST
            </span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              {cadastralData.taluks.map((taluk, idx) => {
                const isSelected = isTalukActive(taluk);
                const isHovered = hoveredTalukId === taluk.id;
                const talukNum = taluk.number || idx + 1;

                return (
                  <button
                    key={`list-${taluk.id}`}
                    onClick={() => onSelectTaluk(taluk.name.replace(' TALUK', ''))}
                    onMouseEnter={() => setHoveredTalukId(taluk.id)}
                    onMouseLeave={() => setHoveredTalukId(null)}
                    className={`flex items-center space-x-2 p-1.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 shadow-2xs ring-1 ring-blue-400'
                        : isHovered
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Number Badge with matching pastel color */}
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-slate-900 shrink-0 shadow-2xs"
                      style={{ backgroundColor: taluk.color }}
                    >
                      {talukNum}
                    </span>
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {taluk.name.replace(' TALUK', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CENTER COLUMN: Main District Taluk Map Canvas */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs relative flex flex-col justify-between min-h-[580px] overflow-hidden select-none">
          
          {/* Top Canvas Bar: Title & North Compass Arrow */}
          <div className="flex items-start justify-between z-10">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {district.name} District – Taluk Map
              </h2>
            </div>

            {/* North Arrow Compass (Matching Reference Image) */}
            <div className="flex flex-col items-center pr-2">
              <span className="font-sans font-black text-[11px] text-slate-900 leading-none">N</span>
              <div className="w-0 h-0 border-x-[5px] border-x-transparent border-b-[14px] border-b-slate-900 mt-0.5" />
            </div>
          </div>

          {/* Surrounding Neighboring Districts Labels */}
          {cadastralData.neighbors.north && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center pointer-events-none">
              {cadastralData.neighbors.north}
            </div>
          )}
          {cadastralData.neighbors.east && (
            <div className="absolute top-28 right-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right pointer-events-none max-w-[80px]">
              {cadastralData.neighbors.east}
            </div>
          )}
          {cadastralData.neighbors.north_east && (
            <div className="absolute top-64 right-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right pointer-events-none max-w-[80px]">
              {cadastralData.neighbors.north_east}
            </div>
          )}
          {cadastralData.neighbors.south_east && (
            <div className="absolute bottom-20 right-8 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right pointer-events-none">
              {cadastralData.neighbors.south_east}
            </div>
          )}
          {cadastralData.neighbors.south_west && (
            <div className="absolute bottom-40 left-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider pointer-events-none max-w-[90px]">
              {cadastralData.neighbors.south_west}
            </div>
          )}
          {cadastralData.neighbors.west && (
            <div className="absolute bottom-16 left-6 text-[10px] font-bold text-slate-600 uppercase tracking-wider pointer-events-none max-w-[90px]">
              {cadastralData.neighbors.west}
            </div>
          )}

          {/* SVG Vector Map Container */}
          <div className="w-full flex items-center justify-center my-auto py-2">
            <svg
              viewBox={getViewBox()}
              className="w-full max-w-[620px] h-auto drop-shadow-sm select-none"
            >
              <defs>
                <filter id="activeTalukGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#1e3a8a" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* 1. TALUK POLYGONS */}
              <g id="taluk-polygons">
                {cadastralData.taluks.map((taluk, idx) => {
                  const isSelected = isTalukActive(taluk);
                  const isHovered = hoveredTalukId === taluk.id;
                  const talukNum = taluk.number || idx + 1;

                  return (
                    <g
                      key={`poly-${taluk.id}`}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredTalukId(taluk.id)}
                      onMouseLeave={() => setHoveredTalukId(null)}
                      onClick={() => onSelectTaluk(taluk.name.replace(' TALUK', ''))}
                    >
                      {/* Polygon Shape */}
                      <path
                        d={taluk.path}
                        fill={taluk.color}
                        stroke={isSelected ? '#1e3a8a' : isHovered ? '#0f172a' : '#334155'}
                        strokeWidth={isSelected ? '3.8' : isHovered ? '2.8' : '1.8'}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter={isSelected ? 'url(#activeTalukGlow)' : undefined}
                        className="transition-all duration-150"
                      />

                      {/* HQ Center Marker Dot (Matching Reference Image) */}
                      <circle
                        cx={taluk.labelPosition[0]}
                        cy={taluk.labelPosition[1] + 16}
                        r="3.5"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="pointer-events-none"
                      />

                      {/* Taluk Name Label */}
                      <text
                        x={taluk.labelPosition[0]}
                        y={taluk.labelPosition[1]}
                        textAnchor="middle"
                        fontSize={isSelected ? '14' : '12'}
                        fontWeight={isSelected ? '900' : '700'}
                        fontFamily="sans-serif"
                        fill={isSelected ? '#1e3a8a' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        paintOrder="stroke fill"
                        strokeLinejoin="round"
                        className="pointer-events-none select-none drop-shadow-xs"
                      >
                        {taluk.name.replace(' TALUK', '')}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* 2. OUTER DISTRICT BOUNDARY STROKE */}
              <g id="outer-boundary-accent" pointerEvents="none">
                {cadastralData.taluks.map((t) => (
                  <path
                    key={`outer-${t.id}`}
                    d={t.path}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Bottom Left Scale Bar */}
          <div className="absolute bottom-10 left-6 flex flex-col items-start text-[10px] font-bold text-slate-700">
            <div className="flex justify-between w-28 text-[9px] text-slate-600 px-0.5">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30 km</span>
            </div>
            <div className="w-28 h-1.5 bg-slate-900 border border-slate-900 flex">
              <div className="w-1/3 h-full bg-slate-900" />
              <div className="w-1/3 h-full bg-white border-x border-slate-900" />
              <div className="w-1/3 h-full bg-slate-900" />
            </div>
          </div>

          {/* Bottom Legend Bar (Matching Reference Image) */}
          <div className="flex flex-wrap items-center justify-start gap-4 sm:gap-6 border-t border-slate-200/80 pt-2.5 mt-2 text-xs text-slate-700 font-semibold">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              LEGEND
            </span>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-6 h-0 border-b-2 border-dashed border-slate-700 inline-block" />
              <span>District Boundary</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-6 h-0.5 bg-slate-700 inline-block" />
              <span>Taluk Boundary</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-3 h-3 rounded-full border border-slate-800 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              </span>
              <span>Taluk Headquarters</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Taluk Details & About District Info */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-3.5 flex flex-col">
          
          {/* CARD 1: TALUK DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase block text-center mb-2">
                TALUK DETAILS
              </span>

              {/* Dropdown Selector */}
              <div className="relative mb-3">
                <select
                  value={selectedTaluk}
                  onChange={(e) => onSelectTaluk(e.target.value)}
                  aria-label="Select Taluk"
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300/80 rounded-xl px-3 py-2 text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Select Taluk</option>
                  {cadastralData.taluks.map((t, idx) => (
                    <option key={`opt-${t.id}`} value={t.name.replace(' TALUK', '')}>
                      {(t.number || idx + 1) + '. ' + t.name.replace(' TALUK', '')}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                  ▼
                </div>
              </div>

              {/* Illustration when no taluk is selected (Matching Reference Image) */}
              {!activeTaluk ? (
                <div className="py-2 flex flex-col items-center text-center">
                  <div className="w-full h-32 flex items-center justify-center">
                    <svg viewBox="0 0 240 140" className="w-full h-full max-h-32 text-emerald-700/60 stroke-current fill-none">
                      {/* Sun in sky */}
                      <circle cx="180" cy="35" r="10" strokeWidth="1.5" stroke="#eab308" fill="#fef9c3" />
                      {/* Distant Hills */}
                      <path d="M 10,95 Q 60,40 120,95 Q 170,45 230,95" strokeWidth="1.2" stroke="#94a3b8" />
                      <path d="M 0,105 Q 80,60 160,105 Q 200,75 240,105" strokeWidth="1.2" stroke="#cbd5e1" fill="#f8fafc" />
                      {/* Temple Gopuram Silhouette */}
                      <g strokeWidth="1.3" stroke="#059669" fill="#ecfdf5">
                        <polygon points="110,95 105,40 115,40" />
                        <rect x="103" y="40" width="14" height="6" rx="1" />
                        <rect x="100" y="48" width="20" height="7" rx="1" />
                        <rect x="98" y="57" width="24" height="8" rx="1" />
                        <rect x="95" y="67" width="30" height="10" rx="1" />
                        <rect x="92" y="79" width="36" height="12" rx="1" />
                        <rect x="88" y="93" width="44" height="14" rx="1" />
                        <line x1="110" y1="32" x2="110" y2="40" strokeWidth="2" stroke="#d97706" />
                      </g>
                      {/* Village Trees & Huts */}
                      <g strokeWidth="1.2" stroke="#16a34a" fill="#dcfce7">
                        <path d="M 40,95 Q 30,70 50,70 Q 70,70 60,95 Z" />
                        <path d="M 65,98 Q 55,78 75,78 Q 95,78 85,98 Z" />
                        <path d="M 145,95 Q 135,70 155,70 Q 175,70 165,95 Z" />
                        <path d="M 175,98 Q 165,75 185,75 Q 205,75 195,98 Z" />
                      </g>
                      {/* Water Body Foreground */}
                      <path d="M 0,118 Q 60,110 120,118 Q 180,126 240,118 L 240,140 L 0,140 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
                      <line x1="40" y1="128" x2="90" y2="128" stroke="#60a5fa" strokeWidth="1" />
                      <line x1="140" y1="132" x2="190" y2="132" stroke="#60a5fa" strokeWidth="1" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500 font-medium px-1 mt-1">
                    Select a taluk to view Firka and Revenue Village details.
                  </p>
                </div>
              ) : (
                /* Detailed info when a taluk is selected */
                <div className="space-y-2.5 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-slate-900 shadow-2xs"
                        style={{ backgroundColor: activeTaluk.color }}
                      >
                        {activeTaluk.number || 1}
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {activeTaluk.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectTaluk('')}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 block font-medium">Division</span>
                      <span className="font-bold text-slate-800">{activeTaluk.revenueDivision || 'Erode'}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 block font-medium">Total Firkas</span>
                      <span className="font-bold text-blue-900">{activeTaluk.firkas.length} Firkas</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                      Firkas in this Taluk
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {activeTaluk.firkas.map((firka, fIdx) => (
                        <div
                          key={`f-${fIdx}`}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                        >
                          <span className="font-semibold text-slate-800">{firka.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{firka.villages || 10} villages</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: ABOUT DISTRICT (Matching Reference Image) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase block border-b border-slate-100 pb-1.5">
              ABOUT {cadastralData.districtName} DISTRICT
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium">Formed on</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">
                  {cadastralData.formed_on || '1st January 1979'}
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium">Total Taluks</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">
                  {cadastralData.taluks.length}
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium">Total Firkas</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">
                  {cadastralData.total_firkas || 52}
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Home className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium">Total Revenue Villages</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">
                  {cadastralData.total_revenue_villages || '~ 1,000+'}
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium">Total Area</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">
                  {cadastralData.area_sqkm.toLocaleString()} sq.km
                </span>
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-medium">Population (2011)</span>
                </div>
                <span className="text-[11px] font-bold text-slate-900">
                  {cadastralData.population_total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER NOTE & SOURCE BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Note: Map is for reference purpose only. Boundaries are indicative.</span>
        </div>
        <div className="text-slate-600 font-semibold">
          Source: {district.name} District Administration, Government of Tamil Nadu
        </div>
      </div>
    </div>
  );
};
