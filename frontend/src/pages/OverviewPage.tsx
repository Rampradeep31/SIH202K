import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  MapPin,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  HelpCircle,
  TrendingDown,
  Building2,
  Wheat,
  Droplets
} from 'lucide-react';
import L from 'leaflet';

interface OverviewPageProps {
  onNavigateTab: (tab: any) => void;
  onRunAskMap: (query: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab, onRunAskMap }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [mapMode, setMapMode] = useState<'risk' | 'lulc'>('risk');
  const [searchQuery, setSearchQuery] = useState('Show farmlands at high risk near highway');

  useEffect(() => {
    Promise.all([
      api.getParcelsGeoJson(),
    ])
      .then(([parcelsRes]) => {
        setGeoData(parcelsRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Initialize interactive map on Overview
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || loading) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.08, 77.36],
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [loading]);

  // Update map layer
  useEffect(() => {
    if (!mapInstanceRef.current || !geoData) return;

    const map = mapInstanceRef.current;

    // Clear previous geojson layers
    map.eachLayer((layer) => {
      if ((layer as any).feature) {
        map.removeLayer(layer);
      }
    });

    L.geoJSON(geoData, {
      style: (feature) => {
        const p = feature?.properties;
        let color = '#10b981';

        if (mapMode === 'risk') {
          const prob = p?.transition_probability || 0;
          if (prob > 0.7) color = '#dc2626'; // High Risk (Red)
          else if (prob > 0.4) color = '#f59e0b'; // Medium (Orange)
          else color = '#10b981'; // Safe Farm (Green)
        } else {
          // LULC mode
          if (p?.lulc_2023 === 'Built-up') color = '#ef4444';
          else if (p?.lulc_2023 === 'Agriculture') color = '#22c55e';
          else if (p?.lulc_2023 === 'Waterbody') color = '#3b82f6';
          else color = '#eab308';
        }

        const isSelected = selectedCell?.cell_id === p?.cell_id;
        return {
          fillColor: color,
          weight: isSelected ? 3 : 1,
          opacity: 1,
          color: isSelected ? '#000000' : '#ffffff',
          fillOpacity: 0.8
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.on({
          click: () => {
            setSelectedCell(p);
          }
        });
      }
    }).addTo(map);
  }, [geoData, mapMode, selectedCell]);

  const handleAsk = (text: string) => {
    onRunAskMap(text);
    onNavigateTab('gis');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Visual Hero Card - Plain English Explanation */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold border border-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pilot Region: Tiruppur District, Tamil Nadu</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            Where Farmland is Turning into Factories & Buildings
          </h1>

          <p className="text-blue-100 text-sm leading-relaxed">
            Tiruppur is India's knitwear capital, but its rapid industrial boom is rapidly swallowing agricultural fields along the <strong>NH-544 highway</strong> and drying up groundwater in the Noyyal river basin. 
            This platform uses <strong>satellite AI (Sentinel-2)</strong> to show you exactly which farmlands are under danger of conversion, and lets policymakers test solutions before farms disappear.
          </p>

          {/* 3 Simple Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('gis')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-2"
            >
              <span>Explore Interactive Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('research')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all border border-white/20 flex items-center space-x-2"
            >
              <span>Ask Policy Questions (RAG)</span>
            </button>
            <button
              onClick={() => onNavigateTab('scenarios')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-2"
            >
              <span>Test Policy Scenarios</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Step Visual Explainer (How It Works) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <Wheat className="w-4 h-4 text-emerald-600" />
            <span>The Farmland Problem</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In 5 years, over <strong>14,200 hectares</strong> of farmland have been converted into garment factories, dye houses, and logistics warehouses, creating acute water stress.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-red-600" />
            <span>What Our AI Predicts</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The AI scans highway distance, population growth, and satellite greenery loss to calculate a <strong>0% to 100% risk score</strong> for every farmland parcel.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>How Policymakers Fix It</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Simulate 3 different policy plans: Compare business-as-usual vs green buffers along rivers to protect farmers while keeping industry thriving.
          </p>
        </div>
      </div>

      {/* Main Interactive Map Showcase on Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <span>Live Tiruppur District Land Risk Map</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any colored square to see what it is and why the AI scored it.
            </p>
          </div>

          {/* Toggle Map Color Modes */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Color Map by:</span>
            <button
              onClick={() => setMapMode('risk')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                mapMode === 'risk'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⚠️ Risk of Conversion
            </button>
            <button
              onClick={() => setMapMode('lulc')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                mapMode === 'lulc'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🌾 Land Type (Farms vs Built)
            </button>
          </div>
        </div>

        {/* Map and Details Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Map */}
          <div className="lg:col-span-8 h-96 rounded-lg overflow-hidden border border-slate-200 relative">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Simple Visual Legend on Map */}
            <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                {mapMode === 'risk' ? 'Conversion Danger Level' : 'Current Land Cover'}
              </span>
              {mapMode === 'risk' ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-red-600 shrink-0" />
                    <span><strong>High Risk:</strong> Farmland likely to be lost</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0" />
                    <span><strong>Moderate:</strong> Under rising pressure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0" />
                    <span><strong>Safe:</strong> Stable agricultural zone</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-green-500 shrink-0" />
                    <span>🌾 Agricultural Field</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-red-500 shrink-0" />
                    <span>🏢 Factory / Built-up</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded bg-blue-500 shrink-0" />
                    <span>💧 River / Water Tank</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Identified Parcel Box */}
          <div className="lg:col-span-4 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-blue-700" />
                <span>Selected Land Plot Details</span>
              </h3>

              {selectedCell ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot ID:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedCell.cell_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taluk:</span>
                      <span className="font-bold text-slate-800">{selectedCell.taluk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Type:</span>
                      <span className="font-semibold text-emerald-700">{selectedCell.lulc_2023}</span>
                    </div>
                  </div>

                  {/* Danger score */}
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-1">
                    <span className="text-slate-600 block text-[11px]">Probability of turning into factories:</span>
                    <div className="text-2xl font-black text-red-600">
                      {Math.round((selectedCell.transition_probability || 0) * 100)}%
                    </div>
                    <span className="text-[11px] font-bold text-red-800">
                      Risk Category: {selectedCell.risk_category}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-slate-200">
                      <span>Distance to NH-544 Highway:</span>
                      <span className="font-bold text-slate-800">{selectedCell.dist_to_nh_km} km</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200">
                      <span>Groundwater Condition:</span>
                      <span className="font-bold text-amber-700">{selectedCell.groundwater_status}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <MapPin className="w-8 h-8 text-blue-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Click any plot on the map to see details!</p>
                  <p className="text-slate-400 text-[11px]">
                    Try clicking a red plot along the top left (Avinashi highway corridor).
                  </p>
                </div>
              )}
            </div>

            {selectedCell && (
              <button
                onClick={() => onNavigateTab('predictions')}
                className="w-full mt-3 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md font-semibold text-xs transition-colors"
              >
                See Full AI Factor Breakdown →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Questions You Can Ask */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Search className="w-4 h-4 text-blue-700" />
          <span>Try One of These Questions in Plain English:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {[
            "Where is farmland disappearing fastest in Tiruppur?",
            "What does Tamil Nadu rule TNCDBR 2019 say about farm conversion?",
            "Show agricultural areas at high risk within 5 km of highway"
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              className="p-3 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all text-xs text-slate-800 flex items-center justify-between group"
            >
              <span>{q}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
