import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { District } from '../types';
import { MapcnPresentationMap } from './MapcnPresentationMap';
import {
  Compass,
  ExternalLink,
  Globe2,
  AlertTriangle
} from 'lucide-react';

interface RiskLandUseMapViewProps {
  onNavigateTab: (tab: any) => void;
}

// Tamil Nadu's approximate bounding box, used to request a Bhuvan WMS tile
// image scoped to this platform's own jurisdiction rather than all of India.
const TN_BBOX = '76.0,8.0,80.5,13.6';

type BhuvanState =
  | { status: 'loading' }
  | { status: 'unavailable'; message: string }
  | { status: 'success'; layers: { name: string; title: string }[]; wmsBaseUrl: string };

const BhuvanInteropPanel: React.FC = () => {
  const [state, setState] = useState<BhuvanState>({ status: 'loading' });
  const [selectedLayer, setSelectedLayer] = useState<string>('');

  useEffect(() => {
    api.getBhuvanLayers()
      .then((res) => {
        if (res.status === 'success' && res.layers.length > 0) {
          setState({ status: 'success', layers: res.layers, wmsBaseUrl: res.wms_base_url || '' });
          setSelectedLayer(res.layers[0].name);
        } else {
          setState({ status: 'unavailable', message: res.message || 'Bhuvan returned no layers.' });
        }
      })
      .catch(() => setState({ status: 'unavailable', message: 'Could not reach the backend interoperability endpoint.' }));
  }, []);

  const tileUrl = state.status === 'success' && selectedLayer
    ? `${state.wmsBaseUrl}?service=WMS&version=1.1.1&request=GetMap&layers=${encodeURIComponent(selectedLayer)}&bbox=${TN_BBOX}&width=640&height=420&srs=EPSG:4326&format=image/png&transparent=true`
    : null;

  return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex items-center gap-2">
        <Globe2 className="w-4 h-4 text-emerald-700" />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">External Interoperability — Bhuvan (NRSC/ISRO) Live WMS</h3>
      </div>
      <p className="text-[11px] text-slate-500">
        A live call to Bhuvan's public GetCapabilities service (no API key — Bhuvan publishes this as open access), not a static citation.
        The layer list below is whatever Bhuvan is actually serving right now.
      </p>

      {state.status === 'loading' && (
        <div className="text-xs text-slate-400">Querying Bhuvan's live WMS capabilities…</div>
      )}

      {state.status === 'unavailable' && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === 'success' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-semibold">{state.layers.length} live layers found. Preview:</span>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white max-w-[280px]"
            >
              {state.layers.slice(0, 100).map((l) => (
                <option key={l.name} value={l.name}>{l.title}</option>
              ))}
            </select>
          </div>
          {tileUrl && (
            <img
              src={tileUrl}
              alt={`Bhuvan WMS layer: ${selectedLayer}`}
              className="w-full rounded-lg border border-slate-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * The platform's original ML risk-visualization GIS view: LULC layers,
 * conversion-risk overlay, and district/taluk drill-down over the Tiruppur
 * pilot's cadastral parcels. Kept as one mode inside GIS Explorer alongside
 * the village/cadastre finder (a different tool with a different purpose —
 * real-parcel lookup rather than ML risk scoring).
 */
export const RiskLandUseMapView: React.FC<RiskLandUseMapViewProps> = ({
  onNavigateTab
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
    <div className="space-y-5">
      {/* Top Bar with mapcn styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-blue-800" />
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Tamil Nadu State GIS &amp; District Intelligence
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

      {loading ? (
        <div className="text-sm text-slate-500 p-6">Loading district map…</div>
      ) : (
        <MapcnPresentationMap
          districts={districtsList}
          selectedDistrict={selectedDistrict}
          selectedTaluk={selectedTaluk}
          onSelectDistrict={setSelectedDistrict}
          onSelectTaluk={setSelectedTaluk}
        />
      )}

      <BhuvanInteropPanel />
    </div>
  );
};
