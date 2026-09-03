import React, { useState, useEffect, useRef } from 'react';
import { District, TalukIntelligenceResponse, TalukComparisonResponse, IndustrySuitabilityResponse, TalukFilterResponse } from '../types';
import { EXACT_TAMIL_NADU_DISTRICTS } from '../data/exactDistrictPaths';
import { api } from '../services/api';
import {
  Compass,
  MapPin,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Layers,
  Building2,
  Wheat,
  Activity,
  Box,
  Droplets,
  CloudRain,
  Factory,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Scale,
  ExternalLink,
  HelpCircle,
  Zap,
  Warehouse,
  FileText,
  Map as MapIcon
} from 'lucide-react';
import L from 'leaflet';
import { TamilNaduIsometricMap } from './TamilNaduIsometricMap';
import { DistrictTalukCadastralMap } from './DistrictTalukCadastralMap';

interface MapcnPresentationMapProps {
  districts: District[];
  selectedDistrict: District | null;
  selectedTaluk: string;
  onSelectDistrict: (district: District | null) => void;
  onSelectTaluk: (taluk: string) => void;
}

export const MapcnPresentationMap: React.FC<MapcnPresentationMapProps> = ({
  districts,
  selectedDistrict,
  selectedTaluk,
  onSelectDistrict,
  onSelectTaluk
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const districtGeoLayerRef = useRef<L.GeoJSON | null>(null);
  const talukGeoLayerRef = useRef<L.GeoJSON | null>(null);
  const talukMarkerRef = useRef<L.Marker | null>(null);

  const [districtsGeoJson, setDistrictsGeoJson] = useState<any>(null);
  const [allTaluksGeoJson, setAllTaluksGeoJson] = useState<any>(null);
  
  // Default to Cadastral Revenue Map view when a district is selected, otherwise 3D Isometric
  const [mapStyleMode, setMapStyleMode] = useState<'cadastral_revenue' | 'isometric_3d' | 'mapcn_light'>('cadastral_revenue');
  const [hoveredDistrictName, setHoveredDistrictName] = useState<string | null>(null);
  const [hoveredTalukName, setHoveredTalukName] = useState<string | null>(null);

  // Active analytical filter: High Rainfall + High Agricultural Land
  const [isHighRainAgriFilterActive, setIsHighRainAgriFilterActive] = useState<boolean>(false);
  const [highRainAgriData, setHighRainAgriData] = useState<TalukFilterResponse | null>(null);

  // Taluk Intelligence & Analytics States (Strictly Real Datasets)
  const [talukIntelligence, setTalukIntelligence] = useState<TalukIntelligenceResponse | null>(null);
  const [talukComparison, setTalukComparison] = useState<TalukComparisonResponse | null>(null);
  const [loadingIntel, setLoadingIntel] = useState<boolean>(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('textile');
  const [industrySuitability, setIndustrySuitability] = useState<IndustrySuitabilityResponse | null>(null);
  const [showProvenanceModal, setShowProvenanceModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'intelligence' | 'comparison' | 'suitability'>('intelligence');

  // Quick select popular districts (mapcn pill style)
  const popularDistricts = [
    { id: 'tiruppur', label: '★ Tiruppur (Pilot)' },
    { id: 'coimbatore', label: 'Coimbatore' },
    { id: 'chennai', label: 'Chennai' },
    { id: 'salem', label: 'Salem' },
    { id: 'erode', label: 'Erode' },
    { id: 'madurai', label: 'Madurai' },
    { id: 'thanjavur', label: 'Thanjavur' }
  ];

  // 1. Fetch local exact Tamil Nadu Districts & Taluks GeoJSON
  useEffect(() => {
    fetch('/tamil_nadu_districts_exact.geojson')
      .then((res) => res.json())
      .then((data) => setDistrictsGeoJson(data))
      .catch((err) => console.error('Failed to load local districts GeoJSON:', err));

    fetch('/tamil_nadu_taluks.geojson')
      .then((res) => res.json())
      .then((data) => setAllTaluksGeoJson(data))
      .catch((err) => console.error('Failed to load local taluks GeoJSON:', err));
  }, []);

  // 2. Fetch High Rainfall + High Agriculture Filter Data
  useEffect(() => {
    api.filterHighRainAgriTaluks()
      .then((res) => setHighRainAgriData(res))
      .catch((err) => console.error('Failed to load high rain/agri filter:', err));
  }, []);

  // 3. Load Taluk Intelligence whenever district & taluk change
  useEffect(() => {
    if (!selectedDistrict) {
      setTalukIntelligence(null);
      setTalukComparison(null);
      setIndustrySuitability(null);
      return;
    }

    const distName = selectedDistrict.name;
    const talukName = selectedTaluk || (currentShape?.taluks && currentShape.taluks.length > 0 ? currentShape.taluks[0] : `${distName} North / West`);

    setLoadingIntel(true);

    Promise.all([
      api.getTalukIntelligence(distName, talukName),
      api.getTalukComparison(distName),
      api.getIndustrySuitability(distName, talukName, selectedIndustry)
    ])
      .then(([intelRes, compRes, suitRes]) => {
        setTalukIntelligence(intelRes);
        setTalukComparison(compRes);
        setIndustrySuitability(suitRes);
        setLoadingIntel(false);
      })
      .catch((err) => {
        console.error('Error fetching taluk data:', err);
        setLoadingIntel(false);
      });
  }, [selectedDistrict, selectedTaluk, selectedIndustry]);

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (mapStyleMode !== 'mapcn_light' || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStyleMode]);

  // 5. Render District & Taluk Boundaries on Vector Leaflet Layer
  useEffect(() => {
    if (mapStyleMode !== 'mapcn_light' || !mapInstanceRef.current || !districtsGeoJson) return;
    const map = mapInstanceRef.current;

    if (districtGeoLayerRef.current) {
      map.removeLayer(districtGeoLayerRef.current);
    }
    if (talukGeoLayerRef.current) {
      map.removeLayer(talukGeoLayerRef.current);
    }

    const geoLayer = L.geoJSON(districtsGeoJson, {
      style: (feature) => {
        const props = feature?.properties;
        const isSelected = selectedDistrict?.id === props?.id || selectedDistrict?.name?.toLowerCase() === props?.name?.toLowerCase();
        const isPilot = props?.pilot_focus;

        return {
          fillColor: isSelected
            ? '#1e3a8a'
            : isPilot
            ? '#3b82f6'
            : '#ffffff',
          weight: isSelected ? 2.5 : 1.2,
          opacity: 1,
          color: isSelected ? '#0f172a' : '#64748b',
          fillOpacity: isSelected ? 0.3 : isPilot ? 0.5 : 0.7
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindTooltip(
          `<div class="font-sans text-xs"><strong>${p.name} District</strong><br/><span class="text-slate-500">${p.region} Region • Area: ${p.area_sqkm} km²</span></div>`,
          { sticky: true }
        );

        layer.on({
          mouseover: (e) => {
            setHoveredDistrictName(p.name);
            const target = e.target;
            if (selectedDistrict?.id !== p.id) {
              target.setStyle({
                fillColor: '#93c5fd',
                fillOpacity: 0.75,
                weight: 2,
                color: '#2563eb'
              });
            }
          },
          mouseout: (e) => {
            setHoveredDistrictName(null);
            const target = e.target;
            if (selectedDistrict?.id !== p.id) {
              target.setStyle({
                fillColor: p.pilot_focus ? '#3b82f6' : '#ffffff',
                fillOpacity: p.pilot_focus ? 0.5 : 0.7,
                weight: 1.2,
                color: '#64748b'
              });
            }
          },
          click: () => {
            const d = districts.find((dist) => dist.id === p.id) || p;
            handleDistrictSelect(d);
          }
        });
      }
    }).addTo(map);

    districtGeoLayerRef.current = geoLayer;

    if (allTaluksGeoJson && allTaluksGeoJson.features) {
      const currentDistName = selectedDistrict?.name?.toLowerCase();
      const talukFeatures = allTaluksGeoJson.features.filter((f: any) => {
        const dName = f.properties?.district?.toLowerCase();
        if (selectedDistrict) {
          return dName === currentDistName || dName?.includes(currentDistName) || currentDistName?.includes(dName);
        }
        return false;
      });

      if (talukFeatures.length > 0) {
        const taluksGeoData = { type: 'FeatureCollection', features: talukFeatures };
        const tLayer = L.geoJSON(taluksGeoData as any, {
          style: (feature) => {
            const tProps = feature?.properties;
            const tName = tProps?.taluk;
            const isTalukSelected = selectedTaluk && (tName?.toLowerCase() === selectedTaluk?.toLowerCase() || tName?.toLowerCase()?.includes(selectedTaluk?.toLowerCase()));
            
            const isFilterMatch = isHighRainAgriFilterActive && highRainAgriData?.matched_taluks.some(
              (m) => m.district.toLowerCase() === tProps?.district?.toLowerCase() && m.taluk.toLowerCase() === tName?.toLowerCase()
            );

            return {
              fillColor: isTalukSelected
                ? '#2563eb'
                : isFilterMatch
                ? '#10b981'
                : '#38bdf8',
              weight: isTalukSelected ? 3.0 : 1.5,
              opacity: 1,
              color: isTalukSelected ? '#1e3a8a' : isFilterMatch ? '#047857' : '#0284c7',
              dashArray: isTalukSelected ? '' : '3, 3',
              fillOpacity: isTalukSelected ? 0.65 : isFilterMatch ? 0.6 : 0.35
            };
          },
          onEachFeature: (feature, layer) => {
            const tp = feature.properties;
            layer.bindTooltip(
              `<div class="font-sans text-xs"><strong>${tp.taluk} Taluk</strong><br/><span class="text-blue-700 font-semibold">${tp.district} District</span><br/><span class="text-slate-500">Authentic Taluk GIS Geometry</span></div>`,
              { sticky: true }
            );

            layer.on({
              mouseover: (e) => {
                setHoveredTalukName(tp.taluk);
                const target = e.target;
                target.setStyle({
                  fillOpacity: 0.8,
                  weight: 2.5
                });
              },
              mouseout: (e) => {
                setHoveredTalukName(null);
                const target = e.target;
                const isTalukSelected = selectedTaluk && (tp.taluk?.toLowerCase() === selectedTaluk?.toLowerCase());
                target.setStyle({
                  fillOpacity: isTalukSelected ? 0.65 : 0.35,
                  weight: isTalukSelected ? 3.0 : 1.5
                });
              },
              click: () => {
                handleTalukSelect(tp.taluk);
              }
            });
          }
        }).addTo(map);

        talukGeoLayerRef.current = tLayer;
      }
    }
  }, [mapStyleMode, districtsGeoJson, allTaluksGeoJson, selectedDistrict, selectedTaluk, isHighRainAgriFilterActive, highRainAgriData, districts]);

  // Handle District Selection
  const handleDistrictSelect = (d: District | null) => {
    onSelectDistrict(d);
    onSelectTaluk('');

    if (d) {
      setMapStyleMode('cadastral_revenue');
    }

    if (mapInstanceRef.current) {
      if (d) {
        mapInstanceRef.current.flyTo([d.lat || 11.1075, d.lon || 77.3411], 9, {
          duration: 1.2
        });
      } else {
        mapInstanceRef.current.flyTo([11.1271, 78.6569], 7, {
          duration: 1.2
        });
      }
    }
  };

  // Handle Taluk Selection
  const handleTalukSelect = (talukName: string) => {
    onSelectTaluk(talukName);

    if (mapInstanceRef.current && selectedDistrict) {
      if (!talukName) {
        mapInstanceRef.current.flyTo([selectedDistrict.lat || 11.1075, selectedDistrict.lon || 77.3411], 9, {
          duration: 1.0
        });
        if (talukMarkerRef.current) {
          mapInstanceRef.current.removeLayer(talukMarkerRef.current);
          talukMarkerRef.current = null;
        }
      } else {
        const coordsMap: Record<string, [number, number]> = {
          'Avinashi': [11.193, 77.269],
          'Tiruppur North': [11.145, 77.341],
          'Tiruppur South': [11.082, 77.355],
          'Palladam': [10.998, 77.291],
          'Kangeyam': [11.005, 77.561],
          'Dharapuram': [10.728, 77.526],
          'Udumalaipettai': [10.583, 77.248],
          'Madathukulam': [10.534, 77.379]
        };

        const target = coordsMap[talukName] || [selectedDistrict.lat || 11.1075, selectedDistrict.lon || 77.3411];
        mapInstanceRef.current.flyTo(target, 11, { duration: 1.2 });

        if (talukMarkerRef.current) {
          mapInstanceRef.current.removeLayer(talukMarkerRef.current);
        }

        const customIcon = L.divIcon({
          className: 'mapcn-taluk-pin',
          html: `<div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-700 border-2 border-white shadow-md"></span>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker(target, { icon: customIcon }).addTo(mapInstanceRef.current);
        marker.bindPopup(`<strong>${talukName} Taluk</strong><br/><span class="text-xs text-slate-500">${selectedDistrict.name} District</span>`).openPopup();
        talukMarkerRef.current = marker;
      }
    }
  };

  const currentShape = EXACT_TAMIL_NADU_DISTRICTS.find(
    (d) => d.id === selectedDistrict?.id || d.name.toLowerCase() === selectedDistrict?.name?.toLowerCase()
  );

  return (
    <div className="space-y-4">
      {/* Top Controls Bar (mapcn Aesthetic) */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Header + View Style Switcher + High Rain/Agri Filter Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              Tamil Nadu State Administrative Map
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Exact Boundaries • Grounded in User Datasets
            </span>

            {/* High Rain + High Agri Analytical Filter Button */}
            <button
              onClick={() => setIsHighRainAgriFilterActive(!isHighRainAgriFilterActive)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center space-x-1.5 border ${
                isHighRainAgriFilterActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Wheat className="w-3.5 h-3.5" />
              <span>Filter: High Rainfall + High Agri</span>
              {highRainAgriData && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isHighRainAgriFilterActive ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                  {highRainAgriData.total_matches}
                </span>
              )}
            </button>
          </div>

          {/* Presentation Style Toggle: Revenue Taluk Map vs 3D Isometric vs Vector Leaflet */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
            {selectedDistrict && (
              <button
                onClick={() => setMapStyleMode('cadastral_revenue')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  mapStyleMode === 'cadastral_revenue'
                    ? 'bg-[#b91c1c] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Split Taluk Revenue Map</span>
              </button>
            )}
            <button
              onClick={() => setMapStyleMode('isometric_3d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                mapStyleMode === 'isometric_3d'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-slate-700" />
              <span>3D State Map</span>
            </button>
            <button
              onClick={() => setMapStyleMode('mapcn_light')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                mapStyleMode === 'mapcn_light'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-700" />
              <span>Vector Canvas</span>
            </button>
          </div>
        </div>

        {/* High Rainfall + High Agri Active Banner */}
        {isHighRainAgriFilterActive && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong>Active Analytical Filter:</strong> Taluks with Agricultural Land ≥ 50% AND Post-Monsoon Moisture (NDWI) ≥ -0.42.
                <span className="text-emerald-700 text-[11px] block mt-0.5">
                  Methodology: Quantile-based classification on authentic Sentinel-2 STAC and IMD long-term rainfall series.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsHighRainAgriFilterActive(false)}
              className="text-[11px] text-emerald-700 underline font-semibold hover:text-emerald-900 ml-3 shrink-0"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Row 2: Quick District Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
            Quick Jump:
          </span>
          <button
            onClick={() => handleDistrictSelect(null)}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all border ${
              !selectedDistrict
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Tamil Nadu
          </button>
          {popularDistricts.map((p) => {
            const isMatch = selectedDistrict?.id === p.id;
            const matchedObj = EXACT_TAMIL_NADU_DISTRICTS.find((d) => d.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => matchedObj && handleDistrictSelect(matchedObj as any)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all border ${
                  isMatch
                    ? 'bg-blue-800 text-white border-blue-800 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: Dropdown Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Dropdown 1: District */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              1. Select District ({EXACT_TAMIL_NADU_DISTRICTS.length} Districts):
            </label>
            <select
              value={selectedDistrict?.id || ''}
              onChange={(e) => {
                const shape = EXACT_TAMIL_NADU_DISTRICTS.find((d) => d.id === e.target.value);
                handleDistrictSelect(shape ? (shape as any) : null);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Choose a District --</option>
              {EXACT_TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.pilot_focus ? '★ (Pilot)' : ''} ({d.region} Region)
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Area / Taluk */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              2. Select Taluk in {selectedDistrict ? selectedDistrict.name : 'District'}:
            </label>
            <select
              value={selectedTaluk}
              onChange={(e) => handleTalukSelect(e.target.value)}
              disabled={!selectedDistrict}
              className={`w-full border rounded-lg px-3 py-2 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer ${
                selectedDistrict
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <option value="">
                {selectedDistrict ? `-- Select Taluk in ${selectedDistrict.name} --` : '-- Choose District First --'}
              </option>
              {currentShape?.taluks?.map((tname) => (
                <option key={tname} value={tname}>
                  {tname} Taluk
                </option>
              ))}
            </select>
          </div>

          {/* Active Focus Display */}
          <div className="flex flex-col justify-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Focus</span>
            <div className="text-xs font-bold text-slate-900 truncate">
              {selectedDistrict ? `${selectedDistrict.name} District` : 'State of Tamil Nadu'}
              {selectedTaluk ? ` → ${selectedTaluk} Taluk` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Presentation Stage */}
      {selectedDistrict ? (
        mapStyleMode === 'isometric_3d' ? (
          <TamilNaduIsometricMap
            districts={districts}
            selectedDistrict={selectedDistrict}
            selectedTaluk={selectedTaluk}
            onSelectDistrict={handleDistrictSelect}
            onSelectTaluk={handleTalukSelect}
          />
        ) : mapStyleMode === 'mapcn_light' ? (
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-md h-[560px] bg-[#e2e8f0]">
            {/* Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* FLOATING CARD 1: District Overview Stat Overlay */}
            <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg text-xs space-y-2 max-w-[260px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Land Governance Region
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  Tamil Nadu
                </span>
              </div>

              <div className="text-base font-extrabold text-slate-900">
                {selectedDistrict ? `${selectedDistrict.name} District` : 'Tamil Nadu State'}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Area</span>
                  <span className="font-bold text-slate-800">
                    {selectedDistrict ? `${selectedDistrict.area_sqkm.toLocaleString()} km²` : '130,060 km²'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Population</span>
                  <span className="font-bold text-slate-800">
                    {selectedDistrict ? `${(selectedDistrict.population / 100000).toFixed(1)}L` : '7.21 Cr'}
                  </span>
                </div>
              </div>

              {selectedDistrict && (
                <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 leading-tight">
                  {selectedDistrict.description}
                </p>
              )}
            </div>

            {/* FLOATING CARD 2: Sub-Areas / Taluks Quick List */}
            {selectedDistrict && (
              <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg text-xs space-y-2.5 max-w-[280px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    Taluk Boundaries ({currentShape?.taluks?.length || 0})
                  </span>
                  <span className="text-[10px] text-slate-400">Click to focus</span>
                </div>

                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                  {currentShape?.taluks?.map((tname) => {
                    const isMatch = selectedTaluk === tname;
                    return (
                      <button
                        key={tname}
                        onClick={() => handleTalukSelect(tname)}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                          isMatch
                            ? 'bg-blue-800 text-white font-bold shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {tname}
                      </button>
                    );
                  })}
                </div>

                {selectedTaluk && (
                  <div className="p-2 rounded bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                    <strong>Selected Taluk:</strong> {selectedTaluk}
                  </div>
                )}
              </div>
            )}

            {/* FLOATING CARD 3: Legend */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Boundary & Layer Key
              </span>
              <div className="flex items-center space-x-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-white border border-slate-400" />
                  <span className="text-slate-700">District Boundary</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500 border border-blue-700" />
                  <span className="text-slate-700">Taluk Boundary</span>
                </div>
                {isHighRainAgriFilterActive && (
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-700" />
                    <span className="text-emerald-900 font-bold">High Rain + Agri Match</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* OFFICIAL REVENUE DISTRICT TALUK CADASTRAL MAP VIEW (Matching User's Reference Image) */
          <DistrictTalukCadastralMap
            district={selectedDistrict}
            selectedTaluk={selectedTaluk}
            onSelectTaluk={handleTalukSelect}
            onBackToStateMap={() => handleDistrictSelect(null)}
          />
        )
      ) : (
        /* STATE LEVEL: Complete Tamil Nadu Administrative State Map */
        <TamilNaduIsometricMap
          districts={districts}
          selectedDistrict={null}
          selectedTaluk=""
          onSelectDistrict={handleDistrictSelect}
          onSelectTaluk={handleTalukSelect}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: TALUK INTELLIGENCE & COMPARATIVE ANALYTICS & INDUSTRY SUITABILITY */}
      {/* ========================================================================= */}
      {selectedDistrict && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-800" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedTaluk ? `${selectedTaluk} Taluk Intelligence` : `${selectedDistrict.name} District Taluk Analysis`}
                </h3>
                <p className="text-xs text-slate-500">
                  Evidence-based metrics computed from authentic Sentinel-2 STAC, Cadastral survey parcels, IMD rainfall, and Census 2011 datasets.
                </p>
              </div>
            </div>

            {/* Sub-tab switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'intelligence' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Taluk Indicators
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'comparison' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                District Taluk Comparison
              </button>
              <button
                onClick={() => setActiveTab('suitability')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'suitability' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Industry Suitability
              </button>
            </div>
          </div>

          {loadingIntel ? (
            <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading authentic dataset metrics...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: TALUK INDICATORS */}
              {activeTab === 'intelligence' && talukIntelligence && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Metric 1: Rainfall Status */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                          <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                          <span>Rainfall & Moisture</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          talukIntelligence.metrics.rainfall_status === 'High'
                            ? 'bg-emerald-100 text-emerald-800'
                            : talukIntelligence.metrics.rainfall_status === 'Moderate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {talukIntelligence.metrics.rainfall_status}
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        {talukIntelligence.metrics.rainfall_category}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        IMD State Normal: <strong>{talukIntelligence.metrics.rainfall_normal_mm} mm/yr</strong>
                      </div>
                    </div>

                    {/* Metric 2: Agricultural Land % */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                          <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Agricultural Land %</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {talukIntelligence.metrics.agricultural_land_pct ? `${talukIntelligence.metrics.agricultural_land_pct}%` : 'Available'}
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        {talukIntelligence.metrics.agricultural_land_pct ? `${talukIntelligence.metrics.agricultural_land_pct}%` : 'Data in LULC'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        NDVI Post-Monsoon Greenery: <strong>{talukIntelligence.metrics.ndvi_post_monsoon ?? 'N/A'}</strong>
                      </div>
                    </div>

                    {/* Metric 3: Industrial Activity & NDBI */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                          <Factory className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Industrial Intensity</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          NDBI {talukIntelligence.metrics.ndbi_dry_summer ? talukIntelligence.metrics.ndbi_dry_summer.toFixed(3) : 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 leading-tight">
                        {talukIntelligence.metrics.industrial_activity}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Recorded Industrial Units: <strong>{talukIntelligence.metrics.industrial_units_count ?? 0} units</strong>
                      </div>
                    </div>

                    {/* Metric 4: Water Availability (NDWI) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                          <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Water Availability</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                          NDWI {talukIntelligence.metrics.ndwi_post_monsoon ? talukIntelligence.metrics.ndwi_post_monsoon.toFixed(3) : 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 leading-tight">
                        {talukIntelligence.metrics.water_availability}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Dry Summer NDWI: <strong>{talukIntelligence.metrics.ndwi_dry_summer ?? 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Population & Density */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demographics (Census 2011)</span>
                      <div className="font-bold text-slate-900 text-sm">
                        {talukIntelligence.metrics.population ? `${talukIntelligence.metrics.population.toLocaleString()} persons` : 'District Level Census'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Density: <strong>{talukIntelligence.metrics.population_density ?? 'N/A'} / km²</strong> • Urban Ratio: <strong>{talukIntelligence.metrics.urbanisation_pct ? `${talukIntelligence.metrics.urbanisation_pct}%` : 'N/A'}</strong>
                      </div>
                    </div>

                    {/* Infrastructure & Logistics */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Infrastructure & Logistics</span>
                      <div className="font-bold text-slate-900 text-sm">
                        {talukIntelligence.metrics.infrastructure_access}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Roads Layer: <strong>Connected via National & State Highways</strong>
                      </div>
                    </div>

                    {/* Soil Condition (Transparent Missing Notice) */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Soil Chemical Condition</span>
                      </div>
                      <div className="font-bold text-amber-950 text-xs">
                        {talukIntelligence.metrics.soil_condition.status}
                      </div>
                      <div className="text-amber-800 text-[11px] leading-tight">
                        {talukIntelligence.metrics.soil_condition.notice}
                      </div>
                    </div>
                  </div>

                  {/* Provenance Expander */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowProvenanceModal(!showProvenanceModal)}
                      className="text-xs font-semibold text-blue-800 hover:text-blue-900 flex items-center space-x-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{showProvenanceModal ? 'Hide Data Provenance & Methodology' : 'View Data Provenance & Calculation Formulas'}</span>
                    </button>

                    {showProvenanceModal && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Strict Data Provenance Table (Grounded in Provided Files)</span>
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-300 text-slate-600 text-[11px]">
                                <th className="pb-1.5 font-bold">Indicator</th>
                                <th className="pb-1.5 font-bold">Dataset File</th>
                                <th className="pb-1.5 font-bold">Field / Method</th>
                                <th className="pb-1.5 font-bold">Vintage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-[11px]">
                              {talukIntelligence.provenance.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-100/60">
                                  <td className="py-2 font-semibold text-slate-900">{p.indicator}</td>
                                  <td className="py-2 text-blue-700 font-mono text-[10px]">{p.dataset}</td>
                                  <td className="py-2 text-slate-600">{p.calculation}</td>
                                  <td className="py-2 text-slate-500">{p.vintage}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DISTRICT TALUK COMPARISON */}
              {activeTab === 'comparison' && talukComparison && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {talukComparison.rankings.map((rk, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block">
                          {rk.category}
                        </span>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {rk.top_taluk}
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md inline-block">
                          {rk.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                        <tr>
                          <th className="p-3 font-bold">Taluk</th>
                          <th className="p-3 font-bold">Rainfall / Moisture</th>
                          <th className="p-3 font-bold">Agri Land %</th>
                          <th className="p-3 font-bold">NDVI Greenery</th>
                          <th className="p-3 font-bold">NDBI Built-up</th>
                          <th className="p-3 font-bold">Industrial Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {talukComparison.taluks.map((tRec, idx) => {
                          const isSelected = selectedTaluk && tRec.taluk.toLowerCase().includes(selectedTaluk.toLowerCase());
                          return (
                            <tr
                              key={idx}
                              onClick={() => handleTalukSelect(tRec.taluk)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/90 font-semibold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="p-3 text-slate-900 font-bold flex items-center space-x-1.5">
                                <span>{tRec.taluk}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tRec.rainfall_status === 'High' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {tRec.rainfall_status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-800 font-semibold">
                                {tRec.agricultural_land_pct ? `${tRec.agricultural_land_pct}%` : 'N/A'}
                              </td>
                              <td className="p-3 text-slate-600">
                                {tRec.ndvi_greenery ?? 'N/A'}
                              </td>
                              <td className="p-3 text-slate-600">
                                {tRec.ndbi_built_up ? tRec.ndbi_built_up.toFixed(3) : 'N/A'}
                              </td>
                              <td className="p-3 text-slate-700">
                                {tRec.industrial_activity}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <div>
                      <strong>District Averages:</strong> Agri Land: <strong>{talukComparison.district_averages.avg_agricultural_land_pct ?? 'N/A'}%</strong> • Avg NDBI: <strong>{talukComparison.district_averages.avg_ndbi_built_up ?? 'N/A'}</strong> • State Normal Rainfall: <strong>{talukComparison.district_averages.rainfall_normal_mm} mm</strong>
                    </div>
                    <span className="text-[10px] text-slate-400">Calculated from user dataset values</span>
                  </div>
                </div>
              )}

              {/* TAB 3: INDUSTRY SUITABILITY */}
              {activeTab === 'suitability' && (
                <div className="space-y-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Select Industry:
                    </span>
                    {[
                      { id: 'textile', label: 'Textile / Garments', icon: Factory },
                      { id: 'food', label: 'Food & Agro Processing', icon: Wheat },
                      { id: 'warehouse', label: 'Warehousing & Logistics', icon: Warehouse },
                      { id: 'renewable', label: 'Renewable Energy (Solar/Wind)', icon: Zap },
                      { id: 'electronics', label: 'Electronics / Light Mfg', icon: Building2 }
                    ].map((ind) => {
                      const IconComp = ind.icon;
                      const isChosen = selectedIndustry === ind.id;
                      return (
                        <button
                          key={ind.id}
                          onClick={() => setSelectedIndustry(ind.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 border ${
                            isChosen
                              ? 'bg-blue-800 text-white border-blue-900 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{ind.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {industrySuitability && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-7 space-y-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                              Industry Suitability Assessment
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              industrySuitability.suitability_grade === 'High'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-400 text-slate-900'
                            }`}>
                              {industrySuitability.suitability_grade} Suitability
                            </span>
                          </div>

                          <div className="flex items-baseline space-x-3">
                            <div className="text-3xl font-extrabold tracking-tight">
                              {industrySuitability.suitability_score}
                            </div>
                            <div className="text-blue-300 text-sm font-semibold">
                              / 100 Score
                            </div>
                            <div className="text-xs text-blue-200 ml-auto">
                              Target: <strong>{industrySuitability.taluk}</strong>
                            </div>
                          </div>

                          <p className="text-xs text-blue-100 leading-relaxed pt-1 border-t border-blue-800/80">
                            <strong>Decision Support Recommendation:</strong> {industrySuitability.recommendation}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                          <h4 className="font-extrabold text-emerald-950 text-xs flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Positive Ground Factors (Empirically Observed):</span>
                          </h4>
                          <ul className="space-y-1 text-[11px] text-emerald-900">
                            {industrySuitability.positive_factors.map((pos, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{pos}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {industrySuitability.constraints.length > 0 && (
                          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                            <h4 className="font-extrabold text-amber-950 text-xs flex items-center space-x-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-700" />
                              <span>Statutory & Environmental Constraints:</span>
                            </h4>
                            <ul className="space-y-1 text-[11px] text-amber-900">
                              {industrySuitability.constraints.map((c, idx) => (
                                <li key={idx} className="flex items-start space-x-1.5">
                                  <span className="text-amber-700 font-bold">⚠</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-xs">
                            Alternative Taluks in {selectedDistrict.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">Comparative Ranking</span>
                        </div>

                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {industrySuitability.alternative_taluk_rankings.map((alt, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleTalukSelect(alt.taluk)}
                              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-bold text-slate-900">{alt.taluk}</div>
                                <div className="text-[10px] text-slate-500">
                                  Agri %: <strong>{alt.agricultural_land_pct}%</strong> • NDBI: <strong>{alt.ndbi_built_up.toFixed(3)}</strong>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                                  alt.suitability_status === 'High' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {alt.suitability_score} / 100
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-tight">
                          <strong>Methodology:</strong> Multi-Criteria Evaluation (MCE) applying transparent weights to user Sentinel-2 NDBI/NDWI, Cadastral survey agricultural parcel areas, and transportation layers.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
