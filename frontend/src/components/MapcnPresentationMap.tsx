import React, { useState, useEffect, useRef } from 'react';
import { District } from '../types';
import { EXACT_TAMIL_NADU_DISTRICTS, ExactDistrictShape } from '../data/exactDistrictPaths';
import {
  Compass,
  MapPin,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Layers,
  Search,
  Building2,
  Wheat,
  Activity,
  Box
} from 'lucide-react';
import L from 'leaflet';
import { TamilNaduIsometricMap } from './TamilNaduIsometricMap';

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
  const talukMarkerRef = useRef<L.Marker | null>(null);

  const [districtsGeoJson, setDistrictsGeoJson] = useState<any>(null);
  // Default to the clean 3D isometric outline map with exact boundaries!
  const [mapStyleMode, setMapStyleMode] = useState<'isometric_3d' | 'mapcn_light'>('isometric_3d');
  const [hoveredDistrictName, setHoveredDistrictName] = useState<string | null>(null);

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

  // Fetch local exact Tamil Nadu Districts GeoJSON (NO external API key needed!)
  useEffect(() => {
    fetch('/tamil_nadu_districts_exact.geojson')
      .then((res) => res.json())
      .then((data) => setDistrictsGeoJson(data))
      .catch((err) => console.error('Failed to load local districts GeoJSON:', err));
  }, []);

  // Initialize Leaflet Map (Vector Only Canvas - NO external API keys or watermarked tile URLs!)
  useEffect(() => {
    if (mapStyleMode !== 'mapcn_light' || !mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Tamil Nadu State (11.1271, 78.6569)
    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    // Add minimal zoom control on bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStyleMode]);

  // Render Real Exact District Outlines on Leaflet Vector Layer
  useEffect(() => {
    if (mapStyleMode !== 'mapcn_light' || !mapInstanceRef.current || !districtsGeoJson) return;
    const map = mapInstanceRef.current;

    if (districtGeoLayerRef.current) {
      map.removeLayer(districtGeoLayerRef.current);
    }

    const geoLayer = L.geoJSON(districtsGeoJson, {
      style: (feature) => {
        const props = feature?.properties;
        const isSelected = selectedDistrict?.id === props?.id;
        const isPilot = props?.pilot_focus;

        return {
          fillColor: isSelected
            ? '#1e3a8a' // Deep navy for selected
            : isPilot
            ? '#3b82f6' // Blue for pilot focus
            : '#ffffff', // Clean white
          weight: isSelected ? 2.5 : 1.2,
          opacity: 1,
          color: isSelected ? '#0f172a' : '#64748b', // Separating border lines
          fillOpacity: isSelected ? 0.8 : isPilot ? 0.5 : 0.7
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
  }, [mapStyleMode, districtsGeoJson, selectedDistrict, districts]);

  // Handle District Selection & Zoom
  const handleDistrictSelect = (d: District | null) => {
    onSelectDistrict(d);
    onSelectTaluk('');

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

  // Handle Area / Taluk Selection
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

  // Matched district object from exact records
  const currentShape = EXACT_TAMIL_NADU_DISTRICTS.find(
    (d) => d.id === selectedDistrict?.id || d.name.toLowerCase() === selectedDistrict?.name?.toLowerCase()
  );

  return (
    <div className="space-y-4">
      {/* Top Controls Bar (mapcn.dev Aesthetic) */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Header + View Style Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              Tamil Nadu State Administrative Map
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Exact Boundaries • 100% Free / No API Key Required
            </span>
          </div>

          {/* Presentation Style Toggle: 3D Isometric View vs Vector Leaflet Map */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setMapStyleMode('isometric_3d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                mapStyleMode === 'isometric_3d'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-slate-700" />
              <span>3D Isometric Outline Map</span>
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
              <span>Vector Pan/Zoom Canvas</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick District Pills (mapcn Signature Feature) */}
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
            <div className="relative">
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
          </div>

          {/* Dropdown 2: Area / Taluk */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              2. Select Area / Taluk in {selectedDistrict ? selectedDistrict.name : 'District'}:
            </label>
            <div className="relative">
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
                  {selectedDistrict ? `-- All Areas in ${selectedDistrict.name} --` : '-- Choose District First --'}
                </option>
                {currentShape?.taluks?.map((tname) => (
                  <option key={tname} value={tname}>
                    {tname} Taluk
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Focus Display */}
          <div className="flex flex-col justify-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Selection</span>
            <div className="text-xs font-bold text-slate-900 truncate">
              {selectedDistrict ? `${selectedDistrict.name} District` : 'State of Tamil Nadu'}
              {selectedTaluk ? ` → ${selectedTaluk} Taluk` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Presentation Stage */}
      {mapStyleMode === 'isometric_3d' ? (
        /* Exact 3D Isometric Outline Map matching user reference image */
        <TamilNaduIsometricMap
          districts={districts}
          selectedDistrict={selectedDistrict}
          selectedTaluk={selectedTaluk}
          onSelectDistrict={handleDistrictSelect}
          onSelectTaluk={handleTalukSelect}
        />
      ) : (
        /* Vector Canvas Map with Exact Boundaries & Zero External Tile Watermarks */
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-md h-[640px] bg-[#e2e8f0]">
          {/* Leaflet Map Container */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* FLOATING CARD 1: mapcn Top-Left Glassmorphic Stat Overlay */}
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

          {/* FLOATING CARD 2: Selected Area / Taluk Inspector (Top-Right) */}
          {selectedDistrict && (
            <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg text-xs space-y-2.5 max-w-[280px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  Sub-Areas & Taluks ({currentShape?.taluks?.length || 0})
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
                  <strong>Focused Area:</strong> {selectedTaluk} Taluk
                  <br />
                  <span className="text-slate-600">Sub-district boundary centered.</span>
                </div>
              )}
            </div>
          )}

          {/* FLOATING CARD 3: Minimalist Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Boundary Key
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-white border border-slate-400" />
                <span className="text-slate-700">Exact District Boundary</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-blue-800 border border-blue-900" />
                <span className="text-slate-700">Active Selection</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
