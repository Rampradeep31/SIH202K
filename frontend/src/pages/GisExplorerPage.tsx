import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { District } from '../types';
import { MapcnPresentationMap } from '../components/MapcnPresentationMap';
import {
  Compass,
  MapPin,
  ExternalLink,
  Info,
  Building2,
  Wheat,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface GisExplorerPageProps {
  initialQuery?: string;
  onNavigateTab: (tab: any) => void;
  onSelectCell: (cellId: string) => void;
}

export const GisExplorerPage: React.FC<GisExplorerPageProps> = ({
  onNavigateTab,
  onSelectCell
}) => {
  const [loading, setLoading] = useState(true);
  const [districtsList, setDistrictsList] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedTaluk, setSelectedTaluk] = useState<string>('');

  useEffect(() => {
    api.getRegions()
      .then((regRes) => {
        setDistrictsList(regRes.districts);
        // Pre-select Tiruppur pilot by default
        const tiruppur = regRes.districts.find((d: District) => d.id === 'tiruppur');
        if (tiruppur) {
          setSelectedDistrict(tiruppur);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Bar with mapcn styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-blue-800" />
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Tamil Nadu State GIS & District Intelligence
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              mapcn.dev Presentation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Minimalist district map with crisp separator lines, quick-jump pills, and sub-district taluk selection.
          </p>
        </div>

        {selectedDistrict?.id === 'tiruppur' && (
          <button
            onClick={() => onNavigateTab('predictions')}
            className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 self-start"
          >
            <span>View AI Farmland Predictions</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* mapcn Presentation Map Component */}
      <MapcnPresentationMap
        districts={districtsList}
        selectedDistrict={selectedDistrict}
        selectedTaluk={selectedTaluk}
        onSelectDistrict={setSelectedDistrict}
        onSelectTaluk={setSelectedTaluk}
      />
    </div>
  );
};
