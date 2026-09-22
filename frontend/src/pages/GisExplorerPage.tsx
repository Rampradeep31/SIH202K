import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  Maximize2,
  Minimize2,
  Layers,
  CloudSun,
  FlaskConical,
  Store,
  FileText,
  Globe2,
  Users,
  Building2,
  CloudRain,
  Factory,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Wheat,
  Activity,
  Search,
  RotateCcw,
  HelpCircle,
  Droplets,
  Scale,
  Zap,
  ChevronRight
} from 'lucide-react';
import {
  TAMIL_NADU_DISTRICT_PROFILES,
  getDistrictProfile,
  DistrictSocioProfile
} from '../data/tamilNaduDistrictProfiles';
import {
  KolamCorner,
  TamilGeometricDivider,
  TamilEmblemBadge,
  AgriculturalEriScene,
  TextileWeavingScene,
  PalmLeafCartographyScene,
  RadialProgressRing,
  MiniSparklineArea,
  DualSegmentBarMeter,
  MetricGaugeDial
} from '../components/common/TraditionalMotifs';
import { api } from '../services/api';
import { VillageRecord, ParcelIntelligenceResponse, ParcelSearchResult } from '../types';
import { AuthorizedAccessDrawer } from '../components/AuthorizedAccessDrawer';
import { RiskLandUseMapView } from '../components/RiskLandUseMapView';

interface GisExplorerPageProps {
  initialQuery?: string;
  onNavigateTab: (tab: any) => void;
  onSelectCell: (cellId: string) => void;
}

type GisViewMode = 'risk_map' | 'village_finder' | 'all_states_hub';

interface StateOption {
  id: string;
  name: string;
  nativeName: string;
  url: string;
  districts: number;
  taluks: number;
  villages: number;
  hasCadastre: boolean;
  accent: string;
}

const STATE_OPTIONS: StateOption[] = [
  {
    id: 'tamil_nadu',
    name: 'Tamil Nadu',
    nativeName: 'தமிழ்நாடு',
    url: '/india-village-finder/tamil_nadu/web/index.html',
    districts: 38,
    taluks: 317,
    villages: 18681,
    hasCadastre: true,
    accent: 'border-[#C04A26] text-[#C04A26] bg-[#C04A26]/10'
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    nativeName: 'ಕರ್ನಾಟಕ',
    url: '/india-village-finder/karnataka/web/index.html',
    districts: 31,
    taluks: 240,
    villages: 29300,
    hasCadastre: false,
    accent: 'border-[#D49B28] text-[#996B1E] bg-[#D49B28]/15'
  },
  {
    id: 'andhra_pradesh',
    name: 'Andhra Pradesh',
    nativeName: 'ఆంధ్రప్రదేశ్',
    url: '/india-village-finder/andhra_pradesh/web/index.html',
    districts: 26,
    taluks: 679,
    villages: 17900,
    hasCadastre: true,
    accent: 'border-[#254E7A] text-[#254E7A] bg-[#254E7A]/10'
  },
  {
    id: 'kerala',
    name: 'Kerala',
    nativeName: 'കേരളം',
    url: '/india-village-finder/kerala/web/index.html',
    districts: 14,
    taluks: 78,
    villages: 1664,
    hasCadastre: false,
    accent: 'border-[#1E6B48] text-[#1E6B48] bg-[#1E6B48]/10'
  },
  {
    id: 'telangana',
    name: 'Telangana',
    nativeName: 'తెలంగాణ',
    url: '/india-village-finder/telangana/web/index.html',
    districts: 33,
    taluks: 612,
    villages: 10900,
    hasCadastre: false,
    accent: 'border-[#1E6B48] text-[#1E6B48] bg-[#1E6B48]/10'
  }
];

// Popular preset districts for quick inspection
const POPULAR_DISTRICT_PRESETS = [
  { id: 'tiruppur', label: 'Tiruppur' },
  { id: 'coimbatore', label: 'Coimbatore' },
  { id: 'chennai', label: 'Chennai' },
  { id: 'salem', label: 'Salem' },
  { id: 'erode', label: 'Erode' },
  { id: 'madurai', label: 'Madurai' },
  { id: 'thanjavur', label: 'Thanjavur' },
  { id: 'karur', label: 'Karur' },
  { id: 'namakkal', label: 'Namakkal' },
  { id: 'kanchipuram', label: 'Kanchipuram' },
  { id: 'vellore', label: 'Vellore' },
  { id: 'virudhunagar', label: 'Virudhunagar' }
];

export const GisExplorerPage: React.FC<GisExplorerPageProps> = ({
  onNavigateTab
}) => {
  // View mode — defaults to the existing risk map so current app behavior
  // is unchanged unless the user explicitly switches to village/cadastre search.
  const [viewMode, setViewMode] = useState<GisViewMode>('risk_map');
  const [selectedStateId, setSelectedStateId] = useState<string>('tamil_nadu');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Administrative Hierarchy State (State -> District -> Taluk -> Village -> Survey Parcel)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('tiruppur');
  const [selectedTalukName, setSelectedTalukName] = useState<string>('Palladam');
  const [selectedVillageName, setSelectedVillageName] = useState<string>('');
  const [selectedSurveyNo, setSelectedSurveyNo] = useState<string>('');
  
  // Authentic Village Records from LGD
  const [villagesList, setVillagesList] = useState<VillageRecord[]>([]);
  const [loadingVillages, setLoadingVillages] = useState<boolean>(false);
  const [villageSearchQuery, setVillageSearchQuery] = useState<string>('');

  // Survey Number & Patta Search State
  const [surveySearchQuery, setSurveySearchQuery] = useState<string>('');
  const [surveySearchResults, setSurveySearchResults] = useState<ParcelSearchResult[]>([]);
  const [isSearchingSurvey, setIsSearchingSurvey] = useState<boolean>(false);
  const [showSearchResultsDropdown, setShowSearchResultsDropdown] = useState<boolean>(false);

  // Parcel Intelligence State (TNGIS / Tamil Nilam Structured 9-Section Dataset)
  const [parcelIntelligence, setParcelIntelligence] = useState<ParcelIntelligenceResponse | null>(null);
  const [loadingParcelIntel, setLoadingParcelIntel] = useState<boolean>(false);

  // Analytics Drawer State
  const [isAnalyticsDrawerOpen, setIsAnalyticsDrawerOpen] = useState<boolean>(true);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'indicators' | 'patta_chitta' | 'parcel_intelligence' | 'famous_industries' | 'suitability'>('indicators');
  const [selectedIndustryType, setSelectedIndustryType] = useState<'textile' | 'agro' | 'logistics' | 'renewable'>('textile');
  const [showChittaModal, setShowChittaModal] = useState<boolean>(false);
  const [isAuthorizedDrawerOpen, setIsAuthorizedDrawerOpen] = useState<boolean>(false);

  const currentProfile: DistrictSocioProfile = getDistrictProfile(selectedDistrictId);
  const currentState = STATE_OPTIONS.find((s) => s.id === selectedStateId) || STATE_OPTIONS[0];

  const currentIframeSrc =
    viewMode === 'all_states_hub'
      ? '/india-village-finder/index.html'
      : currentState.url;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 1. Fetch authentic villages whenever district or taluk changes
  useEffect(() => {
    if (selectedStateId !== 'tamil_nadu') return;
    setLoadingVillages(true);
    api.getVillages(currentProfile.name, selectedTalukName, undefined, 60)
      .then((res) => {
        setVillagesList(res.villages || []);
        setLoadingVillages(false);
      })
      .catch((err) => {
        console.error('Failed to load authentic villages:', err);
        setLoadingVillages(false);
      });
  }, [selectedDistrictId, selectedTalukName, selectedStateId]);

  // 2. Fetch parcel intelligence whenever survey number or village is selected
  useEffect(() => {
    if (!selectedSurveyNo && !selectedVillageName) return;
    const targetSurvey = selectedSurveyNo || '1';
    setLoadingParcelIntel(true);
    api.getParcelIntelligence(targetSurvey, currentProfile.name, selectedTalukName, selectedVillageName)
      .then((res) => {
        setParcelIntelligence(res);
        setLoadingParcelIntel(false);
        // Automatically synchronize district & taluk if resolved from LGD village directory
        if (res.land_identification) {
          const respDist = res.land_identification.district;
          const respTaluk = res.land_identification.taluk;
          if (respDist && respDist.toLowerCase() !== currentProfile.name.toLowerCase()) {
            const matchD = Object.values(TAMIL_NADU_DISTRICT_PROFILES).find(
              (p) =>
                p.name.toLowerCase() === respDist.toLowerCase() ||
                respDist.toLowerCase().includes(p.name.toLowerCase()) ||
                p.name.toLowerCase().includes(respDist.toLowerCase()) ||
                p.id.toLowerCase() === respDist.toLowerCase().replace(/[-_\s]/g, '')
            );
            if (matchD && matchD.id !== selectedDistrictId) {
              setSelectedDistrictId(matchD.id);
            }
          }
          if (respTaluk && respTaluk.toLowerCase() !== selectedTalukName.toLowerCase()) {
            setSelectedTalukName(respTaluk);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load parcel intelligence:', err);
        setLoadingParcelIntel(false);
      });
  }, [selectedSurveyNo, selectedDistrictId, selectedTalukName, selectedVillageName]);

  // 3. Listen to postMessage from embedded GIS Village Finder
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === 'VF_LOCATION_SELECT') {
        const distName = e.data.district;
        if (distName) {
          const matched = Object.values(TAMIL_NADU_DISTRICT_PROFILES).find(
            (p) =>
              p.name.toLowerCase() === distName.toLowerCase() ||
              p.id.toLowerCase() === distName.toLowerCase().replace(/[-_\s]/g, '') ||
              distName.toLowerCase().includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(distName.toLowerCase())
          );
          if (matched) {
            setSelectedDistrictId(matched.id);
            if (e.data.mandal) {
              setSelectedTalukName(e.data.mandal);
            } else if (matched.taluks && matched.taluks.length > 0) {
              setSelectedTalukName(matched.taluks[0]);
            }
            if (e.data.village) {
              setSelectedVillageName(e.data.village);
            }
          }
        }
      } else if (e.data.type === 'VF_PARCEL_SELECT') {
        if (e.data.survey_no) {
          setSelectedSurveyNo(e.data.survey_no);
          if (e.data.village) setSelectedVillageName(e.data.village);
          if (e.data.taluk) setSelectedTalukName(e.data.taluk);
          setIsAnalyticsDrawerOpen(true);
          setAnalyticsSubTab('patta_chitta');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    const prof = getDistrictProfile(distId);
    if (prof.taluks && prof.taluks.length > 0) {
      setSelectedTalukName(prof.taluks[0]);
    }
    setSelectedVillageName('');
    setSelectedSurveyNo('');
  };

  const handleTalukChange = (talukName: string) => {
    setSelectedTalukName(talukName);
    setSelectedVillageName('');
    setSelectedSurveyNo('');
  };

  const handleVillageChange = (villageName: string) => {
    const vObj = villagesList.find((v) => v.village_name === villageName);
    setSelectedVillageName(vObj?.village_native ? `${vObj.village_name} (${vObj.village_native})` : villageName);
    if (!selectedSurveyNo) {
      setSelectedSurveyNo('1');
    }
    setAnalyticsSubTab('patta_chitta');
  };

  // Fast Survey Number / Patta Search Handler
  const handleSurveySearch = (val: string) => {
    setSurveySearchQuery(val);
    if (val.trim().length >= 1) {
      setIsSearchingSurvey(true);
      api.searchParcels(val.trim(), currentProfile.name, selectedTalukName)
        .then((res) => {
          setSurveySearchResults(res.results || []);
          setIsSearchingSurvey(false);
          setShowSearchResultsDropdown(true);
        })
        .catch(() => {
          setIsSearchingSurvey(false);
        });
    } else {
      setSurveySearchResults([]);
      setShowSearchResultsDropdown(false);
    }
  };

  const selectSearchedParcel = (parcel: ParcelSearchResult) => {
    const sNo = parcel.display_survey_no || parcel.survey_no;
    setSelectedSurveyNo(sNo);
    if (parcel.district) {
      const matchD = Object.values(TAMIL_NADU_DISTRICT_PROFILES).find(
        (p) =>
          p.name.toLowerCase() === parcel.district.toLowerCase() ||
          parcel.district.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(parcel.district.toLowerCase()) ||
          p.id.toLowerCase() === parcel.district.toLowerCase().replace(/[-_\s]/g, '')
      );
      if (matchD) setSelectedDistrictId(matchD.id);
    }
    if (parcel.taluk) setSelectedTalukName(parcel.taluk);
    if (parcel.village) setSelectedVillageName(parcel.village);
    setShowSearchResultsDropdown(false);
    setSurveySearchQuery(sNo);
    setIsAnalyticsDrawerOpen(true);
    setAnalyticsSubTab('patta_chitta');
  };

  // Multi-criteria suitability calculation
  const calculateSuitability = (type: string) => {
    const p = currentProfile;
    const urban = p.urban_ratio_pct;
    const agri = p.cadastral_land_use.agricultural_pct;
    const vacant = p.cadastral_land_use.vacant_barren_pct;
    const ndbi = p.ndbi_builtup_index;
    const ndwi = p.ndwi_moisture_index;

    if (type === 'textile') {
      const score = Math.min(Math.max(Math.round((ndbi + 0.15) * 160 + (100 - agri) * 0.25 + (p.id === 'tiruppur' || p.id === 'coimbatore' || p.id === 'erode' || p.id === 'karur' ? 30 : 10)), 35), 98);
      return {
        title: 'Textile & Garment Manufacturing',
        score,
        badge: score >= 80 ? 'Optimal Manufacturing Hub' : score >= 60 ? 'Suitable with Water Recycling' : 'Moderate Potential',
        pros: [
          `Established Ecosystem: ${p.famous_industries.primary_sector}`,
          `Logistics Network: ${p.logistics_connectivity}`,
          `Workforce Availability: ${urban}% urban demographic base`
        ],
        constraints: [
          agri > 60 ? `Prime Farmland Preservation: ${agri}% agricultural parcel cover` : 'Low topsoil conversion conflict',
          p.rainfall_status === 'Low' ? 'Zero Liquid Discharge (ZLD) mandatory for effluent management' : 'Adequate monsoon recharge'
        ]
      };
    } else if (type === 'agro') {
      const score = Math.min(Math.max(Math.round(agri * 0.5 + (ndwi + 0.6) * 45 + (p.rainfall_status === 'High' ? 25 : 12)), 30), 96);
      return {
        title: 'Food Processing & Agro-Commodities',
        score,
        badge: score >= 80 ? 'Prime Agrarian Processing Zone' : score >= 60 ? 'Moderate Raw Material Hub' : 'Low Agrarian Surplus',
        pros: [
          `High Agrarian Raw Material Base: ${agri}% agricultural land cover`,
          `Major Harvest Clusters: ${p.famous_industries.major_clusters[0] || 'Regulated Mandi Network'}`,
          `Moisture Index: NDWI ${ndwi.toFixed(3)} (${p.rainfall_category})`
        ],
        constraints: [
          urban > 70 ? `High Peri-Urban Land Cost (${urban}% urbanised)` : 'Accessible rural parcel acquisition',
          ndwi < -0.42 ? 'Requires micro-irrigation and seasonal storage facilities' : 'Reliable surface water network'
        ]
      };
    } else if (type === 'logistics') {
      const score = Math.min(Math.max(Math.round(urban * 0.35 + vacant * 1.5 + (p.id === 'chennai' || p.id === 'coimbatore' || p.id === 'salem' ? 35 : 20)), 40), 95);
      return {
        title: 'Warehousing & Freight Logistics',
        score,
        badge: score >= 80 ? 'Strategic Freight Corridor' : 'Regional Transit Point',
        pros: [
          `Trunk Highway Access: ${p.logistics_connectivity}`,
          `Vacant/Barren Buffer Land: ${vacant}% (${Math.round(p.area_sqkm * (vacant / 100))} sq.km available)`,
          `Consumer Market Access: ${p.population_total.toLocaleString()} population base`
        ],
        constraints: [
          agri > 65 ? 'Requires mandatory buffer zoning away from irrigated wetland parcels' : 'Clean industrial conversion status'
        ]
      };
    } else {
      const score = Math.min(Math.max(Math.round(vacant * 2.2 + (100 - agri) * 0.3 + (p.rainfall_status === 'Low' ? 30 : 15)), 35), 94);
      return {
        title: 'Renewable Energy (Solar & Wind Farms)',
        score,
        badge: score >= 75 ? 'High Solar Insolation & Wind Corridor' : 'Moderate Solar Potential',
        pros: [
          `Dry Arid Land Parcel Buffer: ${vacant}% vacant land cover`,
          `Solar Radiation Profile: ${p.rainfall_status === 'Low' ? '300+ Sunny Days / Rain-Shadow Belt' : '250+ Sunny Days'}`,
          `Grid Connectivity: Connected to Tamil Nadu TANTRANSCO High-Voltage Grid`
        ],
        constraints: [
          urban > 60 ? 'Land fragmentation in high-density urban taluks' : 'Large contiguous barren tracts available'
        ]
      };
    }
  };

  const suitabilityData = calculateSuitability(selectedIndustryType);

  return (
    <div className={`p-6 space-y-4 max-w-7xl mx-auto font-sans ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-[#FAF9F5] flex flex-col max-w-none' : ''}`}>
      {/* Top Header Bar with Heritage Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FAF9F5] p-5 rounded-3xl border border-[#E2DDD5] shadow-xs relative overflow-hidden">
        <KolamCorner position="top-right" size={44} opacity={0.2} color="#C04A26" className="absolute top-1 right-1 pointer-events-none" />

        <div className="flex items-center space-x-3">
          <TamilEmblemBadge size={42} />
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h1 className="text-base sm:text-lg font-serif font-bold text-[#1A1F1C] tracking-tight">
                Integrated Land Governance &amp; Village GIS Explorer
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C04A26]/10 text-[#C04A26] border border-[#C04A26]/25">
                EPSG:4326 WGS84
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1E6B48]/10 text-[#1E6B48] border border-[#1E6B48]/25">
                TNGIS Cadastre &bull; LGD Live
              </span>
            </div>
            <p className="text-xs text-[#5E6460] mt-0.5">
              Official demographic population, urban area, long-term rainfall, and land parcel intelligence grounded strictly in official Tamil Nadu datasets.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 self-start lg:self-center">
          <button
            onClick={() => setIsAnalyticsDrawerOpen(!isAnalyticsDrawerOpen)}
            className="px-3.5 py-2 bg-[#FDFBF7] hover:bg-[#F5EFE6] text-[#1A1F1C] rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-[#E2DDD5] shadow-xs"
          >
            <Building2 className="w-4 h-4 text-[#C04A26]" />
            <span>{isAnalyticsDrawerOpen ? 'Hide Intelligence Drawer' : 'Show Intelligence Drawer'}</span>
            {isAnalyticsDrawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-[#FDFBF7] hover:bg-[#F5EFE6] text-[#1A1F1C] rounded-xl transition-all border border-[#E2DDD5] shadow-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTINUOUS HIERARCHY BREADCRUMB & SURVEY SEARCH TOOLBAR — village/cadastre modes only */}
      {viewMode !== 'risk_map' && (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2DDD5] shadow-2xs">
        {/* Continuous Administrative Breadcrumb Navigation */}
        <div className="flex items-center space-x-1.5 text-xs text-[#5E6460] flex-wrap gap-y-1">
          <span className="font-semibold text-[#1A1F1C] flex items-center space-x-1">
            <Globe2 className="w-3.5 h-3.5 text-[#C04A26]" />
            <span>Tamil Nadu</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#858B87]" />
          <button
            onClick={() => { setSelectedTalukName(currentProfile.taluks[0] || ''); setSelectedVillageName(''); setSelectedSurveyNo(''); }}
            className="font-bold text-[#1A1F1C] hover:text-[#C04A26] transition-colors"
          >
            {currentProfile.name} District
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#858B87]" />
          <button
            onClick={() => { setSelectedVillageName(''); setSelectedSurveyNo(''); }}
            className="font-bold text-[#1A1F1C] hover:text-[#C04A26] transition-colors"
          >
            {selectedTalukName} Taluk
          </button>
          {selectedVillageName && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#858B87]" />
              <span className="font-bold text-[#1E6B48]">
                {selectedVillageName} Village
              </span>
            </>
          )}
          {selectedSurveyNo && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#858B87]" />
              <span className="font-mono font-bold text-[#C04A26] px-2 py-0.5 rounded-md bg-[#C04A26]/10 border border-[#C04A26]/20">
                Survey #{selectedSurveyNo}
              </span>
            </>
          )}
        </div>

        {/* Survey Number Search Bar */}
        <div className="relative w-full md:w-96 shrink-0">
          <div className="flex items-center space-x-1.5 bg-[#FAF9F5] border border-[#E2DDD5] rounded-xl px-3 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-[#C04A26]/30 focus-within:border-[#C04A26]">
            <Search className="w-4 h-4 text-[#858B87] shrink-0" />
            <input
              type="text"
              placeholder="Search Survey # (e.g. 42, 1), Village, or Taluk..."
              value={surveySearchQuery}
              onChange={(e) => handleSurveySearch(e.target.value)}
              onFocus={() => { if (surveySearchResults.length > 0) setShowSearchResultsDropdown(true); }}
              className="bg-transparent border-0 text-xs text-[#1A1F1C] placeholder-[#858B87] focus:outline-hidden w-full font-medium"
            />
            {isSearchingSurvey && <div className="w-3.5 h-3.5 border-2 border-[#C04A26] border-t-transparent rounded-full animate-spin shrink-0" />}
          </div>

          {/* Autocomplete Search Dropdown */}
          {showSearchResultsDropdown && surveySearchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1.5 w-full bg-white rounded-xl border border-[#E2DDD5] shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
              <div className="p-2 text-[10px] font-bold text-[#858B87] uppercase tracking-wider bg-[#FAF9F5] border-b border-[#E2DDD5] flex items-center justify-between">
                <span>Matched Cadastral Parcels ({surveySearchResults.length})</span>
                <span className="text-[9px] text-[#1E6B48] font-semibold">TNGIS / Tamil Nilam</span>
              </div>
              {surveySearchResults.map((parcel, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSearchedParcel(parcel)}
                  className="w-full text-left p-2.5 hover:bg-[#FAF9F5] border-b border-[#ECE7DF] last:border-b-0 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[#C04A26] bg-[#C04A26]/10 px-1.5 py-0.5 rounded border border-[#C04A26]/20">
                        Survey No (புல எண்): {parcel.display_survey_no || parcel.survey_no}
                      </span>
                      <span className="text-[10px] text-[#1E6B48] bg-[#1E6B48]/10 px-1.5 py-0.5 rounded font-bold border border-[#1E6B48]/20">
                        {parcel.land_use}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5E6460]">
                      {parcel.village ? `${parcel.village}, ` : ''}{parcel.taluk} Taluk, {parcel.district}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#1E6B48] bg-[#1E6B48]/10 px-2 py-0.5 rounded font-bold shrink-0">
                    {parcel.area_acres ? `${parcel.area_acres} ac` : `${Math.round(parcel.area_sqm / 4046.86)} ac`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Mode Selector & State Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2DDD5] pb-3">
        <div className="inline-flex p-1 bg-[#F5EFE6] rounded-2xl text-xs font-semibold space-x-1 border border-[#E2DDD5]">
          <button
            onClick={() => setViewMode('risk_map')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'risk_map'
                ? 'bg-white text-[#C04A26] shadow-xs font-serif font-bold'
                : 'text-[#5E6460] hover:text-[#1A1F1C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C04A26]" />
            <span>Risk &amp; Land-Use Map</span>
            <span className="px-2 py-0.5 text-[10px] bg-[#C04A26]/10 text-[#C04A26] rounded-md font-mono font-bold">
              ML Conversion Risk
            </span>
          </button>

          <button
            onClick={() => setViewMode('village_finder')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'village_finder'
                ? 'bg-white text-[#C04A26] shadow-xs font-serif font-bold'
                : 'text-[#5E6460] hover:text-[#1A1F1C]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#C04A26]" />
            <span>Village &amp; Cadastre Explorer</span>
            <span className="px-2 py-0.5 text-[10px] bg-[#C04A26]/10 text-[#C04A26] rounded-md font-mono font-bold">
              15.1k Official Villages
            </span>
          </button>

          <button
            onClick={() => setViewMode('all_states_hub')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              viewMode === 'all_states_hub'
                ? 'bg-white text-[#C04A26] shadow-xs font-serif font-bold'
                : 'text-[#5E6460] hover:text-[#1A1F1C]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-[#1E6B48]" />
            <span>5-State Regional Hub</span>
          </button>
        </div>

        {/* State Quick-Switcher Pills */}
        {viewMode === 'village_finder' && (
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 max-w-full">
            <span className="text-[11px] font-bold text-[#858B87] mr-1 shrink-0">State:</span>
            {STATE_OPTIONS.map((state) => (
              <button
                key={state.id}
                onClick={() => setSelectedStateId(state.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedStateId === state.id
                    ? `${state.accent} shadow-xs font-bold ring-1 ring-[#C04A26]/30`
                    : 'bg-white text-[#5E6460] border-[#E2DDD5] hover:bg-[#F5EFE6]'
                }`}
              >
                <span>{state.name}</span>
                <span className="ml-1 text-[10px] opacity-75">({state.nativeName})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SOCIO-ECONOMIC, POPULATION, URBAN AREA, RAINFALL & PARCEL INTELLIGENCE DRAWER */}
      {isAnalyticsDrawerOpen && viewMode === 'village_finder' && selectedStateId === 'tamil_nadu' && (
        <div className="bg-[#FAF9F5] rounded-3xl border border-[#E2DDD5] p-5 shadow-xs space-y-4 relative overflow-hidden">
          <KolamCorner position="top-right" size={36} opacity={0.15} color="#C04A26" className="absolute top-1 right-1 pointer-events-none" />

          {/* Top District & Taluk Selector Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2DDD5] pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#C04A26]/10 text-[#C04A26] rounded-2xl border border-[#C04A26]/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-serif font-bold text-[#1A1F1C]">
                    {currentProfile.name} District Intelligence
                  </h2>
                  <span className="text-xs text-[#5E6460] font-semibold">({currentProfile.nativeName})</span>
                </div>
                <div className="text-[11px] text-[#5E6460] mt-0.5">
                  Area: <strong>{currentProfile.area_sqkm.toLocaleString()} km²</strong> &bull; Headquarters: <strong>{currentProfile.headquarters}</strong> &bull; Taluks: <strong>{currentProfile.taluks.length}</strong>
                </div>
              </div>
            </div>

            {/* Quick District Selector Presets */}
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1 max-w-full">
              <span className="text-[11px] font-bold text-[#858B87] mr-1 shrink-0">District:</span>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="text-xs font-semibold bg-white border border-[#E2DDD5] rounded-xl px-3 py-1.5 text-[#1A1F1C] focus:ring-1 focus:ring-[#C04A26] cursor-pointer shadow-2xs"
              >
                {Object.values(TAMIL_NADU_DISTRICT_PROFILES).map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.name} ({dist.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Taluk Directory Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 text-xs">
            <span className="text-[10px] font-bold text-[#858B87] uppercase tracking-wider shrink-0">Taluks:</span>
            {currentProfile.taluks.map((t) => (
              <button
                key={t}
                onClick={() => handleTalukChange(t)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                  selectedTalukName === t
                    ? 'bg-[#C04A26] text-white shadow-xs font-bold'
                    : 'bg-white text-[#5E6460] border border-[#E2DDD5] hover:bg-[#F5EFE6]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Authentic Village Directory Bar */}
          {villagesList.length > 0 && (
            <div className="p-3 bg-white rounded-2xl border border-[#E2DDD5] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
                <span className="font-serif font-bold text-[#1A1F1C] flex items-center space-x-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#1E6B48]" />
                  <span>{selectedTalukName} Villages ({villagesList.length}):</span>
                </span>
                <div className="flex items-center space-x-1 flex-wrap gap-1">
                  {villagesList.slice(0, 8).map((v) => (
                    <button
                      key={v.village_code || v.village_name}
                      onClick={() => handleVillageChange(v.village_name)}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                        selectedVillageName === v.village_name
                          ? 'bg-[#1E6B48] text-white font-bold'
                          : 'bg-[#FAF9F5] text-[#5E6460] border border-[#E2DDD5] hover:bg-[#F5EFE6]'
                      }`}
                      title={`Code: ${v.village_code} • Pin: ${v.pincode}`}
                    >
                      {v.village_name} ({v.village_native})
                    </button>
                  ))}
                  {villagesList.length > 8 && (
                    <span className="text-[10px] text-[#858B87] font-semibold px-1">
                      +{villagesList.length - 8} more in LGD
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inner Analytics & Intelligence Tabs */}
          <div className="flex items-center space-x-2 border-b border-[#E2DDD5] pb-2 text-xs font-bold overflow-x-auto">
            {/* 1. Demographics & Rainfall (IMD/Census) */}
            <button
              onClick={() => setAnalyticsSubTab('indicators')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
                analyticsSubTab === 'indicators' ? 'bg-white text-[#C04A26] font-bold border border-[#E2DDD5] shadow-xs' : 'text-[#5E6460] hover:text-[#1A1F1C]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#C04A26]" />
              <span>Demographics &amp; Rainfall (IMD/Census)</span>
            </button>

            {/* 2. Patta & Chitta (பட்டா & சிட்டா) */}
            <button
              onClick={() => {
                if (!selectedSurveyNo) setSelectedSurveyNo('26');
                setAnalyticsSubTab('patta_chitta');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
                analyticsSubTab === 'patta_chitta' ? 'bg-[#1E6B48] text-white font-bold shadow-xs' : 'bg-[#1E6B48]/10 text-[#1E6B48] hover:bg-[#1E6B48]/20'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Patta &amp; Chitta (பட்டா &amp; சிட்டா)</span>
            </button>

            {/* 3. Parcel #26 Intelligence */}
            <button
              onClick={() => {
                if (!selectedSurveyNo) setSelectedSurveyNo('26');
                setAnalyticsSubTab('parcel_intelligence');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
                analyticsSubTab === 'parcel_intelligence' ? 'bg-[#C04A26] text-white font-bold shadow-xs' : 'bg-[#C04A26]/10 text-[#C04A26] hover:bg-[#C04A26]/20'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Parcel #{selectedSurveyNo || '26'} Intelligence</span>
            </button>

            {/* 4. Economic Clusters & Industry */}
            <button
              onClick={() => setAnalyticsSubTab('famous_industries')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
                analyticsSubTab === 'famous_industries' ? 'bg-white text-[#C04A26] font-bold border border-[#E2DDD5] shadow-xs' : 'text-[#5E6460] hover:text-[#1A1F1C]'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#D49B28]" />
              <span>Economic Clusters &amp; Industry</span>
            </button>

            {/* 5. Industry Multi-Criteria Suitability */}
            <button
              onClick={() => setAnalyticsSubTab('suitability')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
                analyticsSubTab === 'suitability' ? 'bg-white text-[#C04A26] font-bold border border-[#E2DDD5] shadow-xs' : 'text-[#5E6460] hover:text-[#1A1F1C]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#1E6B48]" />
              <span>Industry Multi-Criteria Suitability</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DEMOGRAPHICS & RAINFALL (IMD/CENSUS) */}
          {/* ========================================================================= */}
          {analyticsSubTab === 'indicators' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Demographics & Population with Density Sparkline */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-[#C04A26]" />
                      <span>Population &amp; Density</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FAF9F5] text-[#1A1F1C] border border-[#E2DDD5] rounded-md font-mono">
                      {currentProfile.density_per_sqkm} / km²
                    </span>
                  </div>
                  <div>
                    <div className="text-xl font-mono font-extrabold text-[#1A1F1C]">
                      {currentProfile.population_total.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#5E6460] mt-0.5">
                      Urban: <strong>{currentProfile.population_urban.toLocaleString()}</strong> ({currentProfile.urban_ratio_pct}%) &bull; Rural: <strong>{currentProfile.population_rural.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-[#E2DDD5]/60">
                    <DualSegmentBarMeter
                      leftValue={currentProfile.urban_ratio_pct}
                      rightValue={100 - currentProfile.urban_ratio_pct}
                      leftLabel="Urban"
                      rightLabel="Rural"
                      leftColor="#C04A26"
                      rightColor="#1E6B48"
                      height={5}
                    />
                  </div>
                </div>

                {/* Metric 2: Urban Area & Built-up Land Use with Dual Split Meter */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-[#C04A26]" />
                      <span>Urban Area &amp; Built-up</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#C04A26]/10 text-[#C04A26] rounded-md font-mono">
                      NDBI {currentProfile.ndbi_builtup_index.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <div className="text-xl font-mono font-extrabold text-[#1A1F1C]">
                      {currentProfile.urban_area_sqkm.toLocaleString()} km²
                    </div>
                    <div className="text-[11px] text-[#5E6460] mt-0.5">
                      Built: <strong>{currentProfile.cadastral_land_use.builtup_urban_pct}%</strong> &bull; Farmland: <strong>{currentProfile.cadastral_land_use.agricultural_pct}%</strong> &bull; Vacant: <strong>{currentProfile.cadastral_land_use.vacant_barren_pct}%</strong>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-[#E2DDD5]/60">
                    <DualSegmentBarMeter
                      leftValue={currentProfile.cadastral_land_use.agricultural_pct}
                      rightValue={currentProfile.cadastral_land_use.builtup_urban_pct}
                      leftLabel="Farmland"
                      rightLabel="Built"
                      leftColor="#1E6B48"
                      rightColor="#C04A26"
                      height={5}
                    />
                  </div>
                </div>

                {/* Metric 3: Long-Term Rainfall with Radial Gauge */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex items-center justify-between space-y-1">
                  <div>
                    <span className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                      <CloudRain className="w-3.5 h-3.5 text-[#1E6B48]" />
                      <span>Rainfall Normal</span>
                    </span>
                    <div className="text-xl font-mono font-extrabold text-[#1A1F1C] mt-1">
                      {currentProfile.rainfall_annual_normal_mm} mm
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${
                      currentProfile.rainfall_status === 'High' ? 'bg-[#1E6B48]/12 text-[#1E6B48]' : currentProfile.rainfall_status === 'Moderate' ? 'bg-[#D49B28]/15 text-[#996B1E]' : 'bg-[#C04A26]/12 text-[#C04A26]'
                    }`}>
                      {currentProfile.rainfall_status} Monsoon
                    </span>
                  </div>
                  <RadialProgressRing
                    value={Math.round((currentProfile.rainfall_annual_normal_mm / 1200) * 100)}
                    size={62}
                    strokeWidth={5}
                    color="#1E6B48"
                    unit="%"
                    sublabel="normal"
                  />
                </div>

                {/* Metric 4: Industrial Intensity & Units */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex flex-col justify-between space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                      <Factory className="w-3.5 h-3.5 text-[#C04A26]" />
                      <span>Industrial Units</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FAF9F5] text-[#1A1F1C] border border-[#E2DDD5] rounded-md font-mono">
                      {currentProfile.industrial_units_count}+ Units
                    </span>
                  </div>
                  <div className="text-sm font-serif font-bold text-[#1A1F1C] leading-tight">
                    {currentProfile.famous_industries.primary_sector.split(',')[0]}
                  </div>
                  <div className="text-[11px] text-[#5E6460] truncate" title={currentProfile.famous_industries.known_as}>
                    {currentProfile.famous_industries.known_as}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: OFFICIAL TAMIL NADU PATTA & CHITTA RECORD (தமிழ் நிலம் நில ஆவணம்) */}
          {/* ========================================================================= */}
          {analyticsSubTab === 'patta_chitta' && (
            <div className="space-y-4">
              {loadingParcelIntel ? (
                <div className="py-12 text-center text-[#5E6460] text-xs flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-[#1E6B48] border-t-transparent rounded-full animate-spin" />
                  <span>Loading authentic Tamil Nadu Patta &amp; Chitta records...</span>
                </div>
              ) : parcelIntelligence ? (
                <div className="space-y-4">
                  {/* Official Record Header */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-[#1E6B48]/10 text-[#1E6B48] border border-[#1E6B48]/25">
                          Survey No (புல எண்): {parcelIntelligence.patta_chitta_record?.display_survey_no || parcelIntelligence.land_identification.survey_number}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-[#D49B28]/15 text-[#996B1E] border border-[#D49B28]/30">
                          Ownership (உரிமை): {parcelIntelligence.patta_chitta_record?.ownership_type_en || 'Private Patta (தனியார் பட்டா)'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAF9F5] text-[#5E6460] border border-[#E2DDD5]">
                          Official Government Record (அதிகாரப்பூர்வ பதிவு)
                        </span>
                      </div>
                      <h3 className="text-base font-serif font-extrabold text-[#1A1F1C]">
                        {parcelIntelligence.patta_chitta_record?.land_type_en || 'Ryotwari Wet (நன்செய்)'} &bull; {parcelIntelligence.land_identification.village}
                      </h3>
                      <div className="text-xs text-[#5E6460]">
                        Taluk (வட்டம்): <strong>{parcelIntelligence.land_identification.taluk}</strong> &bull; District (மாவட்டம்): <strong>{parcelIntelligence.land_identification.district}</strong> &bull; Extent (பரப்பு): <strong>{parcelIntelligence.patta_chitta_record?.extent_acres_cents || `${parcelIntelligence.land_identification.area_acres} Acres`}</strong>
                      </div>
                    </div>

                    {/* Quick Certificate View Button */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2 shrink-0">
                      <button
                        onClick={() => setShowChittaModal(true)}
                        className="px-3.5 py-2 bg-[#1E6B48] hover:bg-[#155034] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Official e-Patta Extract (சிட்டா குறிப்பு)</span>
                      </button>
                    </div>
                  </div>

                  {/* Bilingual Chitta Extract Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Card 1: Revenue Demarcation */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-[#858B87] uppercase tracking-wider flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C04A26]" />
                        <span>Jurisdiction (வருவாய் வரம்பு)</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between border-b border-[#ECE7DF] pb-1">
                          <span className="text-[#5E6460]">District (மாவட்டம்):</span>
                          <strong className="text-[#1A1F1C]">{parcelIntelligence.land_identification.district}</strong>
                        </div>
                        <div className="flex justify-between border-b border-[#ECE7DF] pb-1">
                          <span className="text-[#5E6460]">Taluk (வட்டம்):</span>
                          <strong className="text-[#1A1F1C]">{parcelIntelligence.land_identification.taluk}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#5E6460]">Village (கிராமம்):</span>
                          <strong className="text-[#1A1F1C]">{parcelIntelligence.land_identification.village}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Land Classification & Extent */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-[#858B87] uppercase tracking-wider flex items-center space-x-1">
                        <Wheat className="w-3.5 h-3.5 text-[#1E6B48]" />
                        <span>Classification &amp; Extent (நில வகைப்பாடு &amp; பரப்பு)</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between border-b border-[#ECE7DF] pb-1">
                          <span className="text-[#5E6460]">Land Type (நில வகை):</span>
                          <strong className="text-[#1E6B48]">{parcelIntelligence.patta_chitta_record?.land_type_en || 'Ryotwari Wet (நன்செய்)'}</strong>
                        </div>
                        <div className="flex justify-between border-b border-[#ECE7DF] pb-1">
                          <span className="text-[#5E6460]">Extent (பரப்பு):</span>
                          <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.extent_hectare_are} ({parcelIntelligence.land_identification.area_acres} ac)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#5E6460]">Land Revenue Tax (நிலத் தீர்வை):</span>
                          <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.tax_assessment || 'As per Revenue Standing Orders (வருவாய் நிலை ஆணைப்படி)'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Irrigation & Ownership Title */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-[#858B87] uppercase tracking-wider flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D49B28]" />
                        <span>Title &amp; Water (உரிமை &amp; பாசன விவரம்)</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between border-b border-[#ECE7DF] pb-1">
                          <span className="text-[#5E6460]">Ownership Type (உரிமை வகை):</span>
                          <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.ownership_type_en || 'Private Patta (தனியார் பட்டா)'}</strong>
                        </div>
                        <div className="flex justify-between border-b border-[#ECE7DF] pb-1">
                          <span className="text-[#5E6460]">Irrigation Source (பாசன ஆதாரம்):</span>
                          <strong className="text-[#1A1F1C] truncate max-w-[150px]">{parcelIntelligence.patta_chitta_record?.irrigation_source_en || 'Canal Command (பாசன வாய்க்கால்)'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#5E6460]">Record Status (பதிவேடு நிலை):</span>
                          <strong className="text-[#1E6B48]">Official Digital Record (அதிகாரப்பூர்வ பதிவு)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E2DDD5] space-y-2">
                  <Compass className="w-8 h-8 text-[#1E6B48] mx-auto opacity-40" />
                  <div className="text-sm font-serif font-bold text-[#1A1F1C]">Select Any Parcel On The Map</div>
                  <p className="text-xs text-[#5E6460] max-w-md mx-auto">
                    Click any parcel in the GIS map or search by Survey Number above to view authentic Patta &amp; Chitta records.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COMPREHENSIVE 9-SECTION PARCEL INTELLIGENCE */}
          {/* ========================================================================= */}
          {analyticsSubTab === 'parcel_intelligence' && (
            <div className="space-y-4">
              {loadingParcelIntel ? (
                <div className="py-12 text-center text-[#5E6460] text-xs flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-[#C04A26] border-t-transparent rounded-full animate-spin" />
                  <span>Loading authentic land parcel intelligence...</span>
                </div>
              ) : parcelIntelligence ? (
                <div className="space-y-4">
                  {/* Top Identification Card */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-[#C04A26]/10 text-[#C04A26] border border-[#C04A26]/25">
                          Survey #{parcelIntelligence.land_identification.survey_number}
                        </span>
                        <span className="text-xs font-semibold text-[#5E6460]">
                          Sub-Division {parcelIntelligence.land_identification.subdivision_number}
                        </span>
                        <span className="text-xs text-[#858B87]">
                          &bull; {parcelIntelligence.land_identification.parcel_id}
                        </span>
                      </div>
                      <h3 className="text-base font-serif font-extrabold text-[#1A1F1C] mt-1">
                        {parcelIntelligence.land_identification.village}, {parcelIntelligence.land_identification.taluk} Taluk, {parcelIntelligence.land_identification.district} District
                      </h3>
                      <div className="text-xs text-[#5E6460] mt-0.5">
                        Centroid: <strong className="font-mono text-[#1A1F1C]">{parcelIntelligence.land_identification.centroid.lat}, {parcelIntelligence.land_identification.centroid.lon}</strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 bg-[#FAF9F5] p-3 rounded-xl border border-[#E2DDD5]">
                      <div>
                        <span className="text-[10px] font-bold text-[#858B87] uppercase block">Parcel Extent</span>
                        <div className="text-lg font-mono font-extrabold text-[#1A1F1C]">
                          {parcelIntelligence.land_identification.area_acres} Acres
                        </div>
                        <span className="text-[10px] text-[#5E6460]">
                          {parcelIntelligence.land_identification.area_sqm.toLocaleString()} m² ({parcelIntelligence.land_identification.area_ha} ha)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Grid Core Intelligence Sections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Section 1: Land Info & Classification */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2">
                      <div className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                        <Wheat className="w-3.5 h-3.5 text-[#1E6B48]" />
                        <span>Land Classification</span>
                      </div>
                      <div className="text-sm font-serif font-bold text-[#1A1F1C]">
                        {parcelIntelligence.land_information.land_classification}
                      </div>
                      <div className="space-y-1 text-[11px] text-[#5E6460] pt-1 border-t border-[#ECE7DF]">
                        <div>Use: <strong className="text-[#1A1F1C]">{parcelIntelligence.land_information.current_land_use}</strong></div>
                        <div>Status: <strong className="text-[#1E6B48]">{parcelIntelligence.land_information.agricultural_status}</strong></div>
                        <div>Irrigation: <strong>{parcelIntelligence.land_information.irrigation_information}</strong></div>
                        <div className="text-[10px] text-[#858B87] italic pt-0.5">
                          Soil: {parcelIntelligence.land_information.soil_condition.status}
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Environmental & Climate Indicators */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2">
                      <div className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                        <Droplets className="w-3.5 h-3.5 text-[#254E7A]" />
                        <span>Environment &amp; Water</span>
                      </div>
                      <div className="text-sm font-serif font-bold text-[#1A1F1C]">
                        {parcelIntelligence.environment.water_availability.split('(')[0]}
                      </div>
                      <div className="space-y-1 text-[11px] text-[#5E6460] pt-1 border-t border-[#ECE7DF]">
                        <div>Rainfall: <strong>{parcelIntelligence.environment.rainfall_status} ({parcelIntelligence.environment.rainfall_normal_mm} mm)</strong></div>
                        <div>Vitality: <strong className="text-[#1E6B48]">{parcelIntelligence.environment.vegetation_vitality}</strong></div>
                        <div>Hazard: <strong>{parcelIntelligence.environment.flood_hazard_exposure}</strong></div>
                        <div className="text-[10px] text-[#858B87]">
                          Sensitivity: {parcelIntelligence.environment.environmental_sensitivity}
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Infrastructure Connectivity */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2">
                      <div className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                        <Factory className="w-3.5 h-3.5 text-[#C04A26]" />
                        <span>Infrastructure Access</span>
                      </div>
                      <div className="text-sm font-serif font-bold text-[#1A1F1C]">
                        {parcelIntelligence.infrastructure.major_road_distance_km} km to Trunk Highway
                      </div>
                      <div className="space-y-1 text-[11px] text-[#5E6460] pt-1 border-t border-[#ECE7DF]">
                        <div>Corridor: <strong className="text-[#1A1F1C]">{parcelIntelligence.infrastructure.nearby_roads.split('/')[0]}</strong></div>
                        <div>Waterbody Dist: <strong>{parcelIntelligence.infrastructure.waterbody_distance_km} km</strong></div>
                        <div>Power: <strong>{parcelIntelligence.infrastructure.industrial_infrastructure}</strong></div>
                        <div>Facility: <strong>{parcelIntelligence.infrastructure.nearby_facilities}</strong></div>
                      </div>
                    </div>

                    {/* Section 4: 5-Year LULC Historical Change & Conversion Danger */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-[#5E6460] uppercase tracking-wider flex items-center space-x-1">
                          <Activity className="w-3.5 h-3.5 text-[#C04A26]" />
                          <span>5-Yr Conversion Risk</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          parcelIntelligence.historical_intelligence.conversion_risk_grade === 'High Risk'
                            ? 'bg-[#C04A26]/12 text-[#C04A26]'
                            : 'bg-[#1E6B48]/12 text-[#1E6B48]'
                        }`}>
                          {parcelIntelligence.historical_intelligence.conversion_risk_grade}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-mono font-extrabold text-[#C04A26]">
                            {parcelIntelligence.historical_intelligence.conversion_risk_score}%
                          </div>
                          <div className="text-[10px] text-[#5E6460]">
                            5-Yr Veg Loss: <strong>{parcelIntelligence.historical_intelligence.vegetation_loss_5yr_pct}%</strong>
                          </div>
                        </div>
                        <MetricGaugeDial
                          value={parcelIntelligence.historical_intelligence.conversion_risk_score}
                          size={64}
                          color={parcelIntelligence.historical_intelligence.conversion_risk_score > 60 ? '#C04A26' : '#1E6B48'}
                        />
                      </div>
                      <div className="text-[10px] text-[#5E6460] pt-1 border-t border-[#ECE7DF]">
                        Trend: <strong>{parcelIntelligence.historical_intelligence.transition_trend}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Policy & Statutory Governance + Patta Ownership Notices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Policy & Research Evidence */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] space-y-2.5 shadow-xs">
                      <div className="font-serif font-bold text-[#1A1F1C] flex items-center space-x-1.5">
                        <Scale className="w-4 h-4 text-[#C04A26]" />
                        <span>Statutory Rules &amp; Policy Evidence:</span>
                      </div>
                      <div className="space-y-2 text-[11px] text-[#5E6460]">
                        <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E2DDD5]">
                          <strong className="text-[#1A1F1C] block font-semibold">TNCDBR 2019 Mandate:</strong>
                          <span>{parcelIntelligence.policy_research.applicable_building_rules}</span>
                        </div>
                        <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#E2DDD5]">
                          <strong className="text-[#1A1F1C] block font-semibold">Zonal Planning Clearance:</strong>
                          <span>{parcelIntelligence.policy_research.zonal_planning_mandate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Patta / Chitta / Ownership Access Notice */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] space-y-2.5 shadow-xs">
                      <div className="font-serif font-bold text-[#1A1F1C] flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#1E6B48]" />
                          <span>Ownership &amp; Patta Verification Status:</span>
                        </div>
                        <button
                          onClick={() => setIsAuthorizedDrawerOpen(true)}
                          className="px-3 py-1.5 bg-[#1E6B48] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#155034] transition-colors flex items-center space-x-1"
                        >
                          <span>🔐 Authorized Access</span>
                        </button>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="p-2.5 bg-[#1E6B48]/8 rounded-xl border border-[#1E6B48]/25 text-[#155034]">
                          <strong className="block font-bold">Ownership Classification:</strong>
                          <span>{parcelIntelligence.patta_ownership.ownership_status}</span>
                        </div>
                        <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#D49B28]/30 text-[#996B1E]">
                          <strong className="block font-bold">Authorized Access Notice:</strong>
                          <span>{parcelIntelligence.patta_ownership.access_notice}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#5E6460] px-1">
                          <span>Dispute Status: <strong>{parcelIntelligence.patta_ownership.dispute_status}</strong></span>
                          <span>FMB: <strong>{parcelIntelligence.patta_ownership.fmb_ladder_status.split(' ')[0]} Verified</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E2DDD5] space-y-2">
                  <Compass className="w-8 h-8 text-[#C04A26] mx-auto opacity-40" />
                  <div className="text-sm font-serif font-bold text-[#1A1F1C]">Select Any Parcel On The Map</div>
                  <p className="text-xs text-[#5E6460] max-w-md mx-auto">
                    Click any cadastral parcel polygon in the GIS viewer or search by Survey Number above to inspect authentic 9-section intelligence.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FAMOUS INDUSTRIES & ECONOMIC CLUSTERS */}
          {/* ========================================================================= */}
          {analyticsSubTab === 'famous_industries' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#D49B28]/30 space-y-2 shadow-xs relative overflow-hidden">
                <div className="absolute right-2 top-0 bottom-0 w-1/4 opacity-15 pointer-events-none hidden md:block">
                  <TextileWeavingScene />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-[#D49B28]" />
                    <h3 className="font-serif font-bold text-[#1A1F1C] text-sm">
                      {currentProfile.famous_industries.primary_sector}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#D49B28]/20 text-[#996B1E]">
                    {currentProfile.famous_industries.known_as}
                  </span>
                </div>
                <p className="text-xs text-[#5E6460] font-medium relative z-10">
                  <strong>Economic Impact:</strong> {currentProfile.famous_industries.economic_significance}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] space-y-2.5 text-xs shadow-xs">
                  <h4 className="font-serif font-bold text-[#1A1F1C] flex items-center space-x-1.5">
                    <Factory className="w-4 h-4 text-[#C04A26]" />
                    <span>Major Industrial &amp; Manufacturing Clusters:</span>
                  </h4>
                  <ul className="space-y-1.5 text-[#5E6460]">
                    {currentProfile.famous_industries.major_clusters.map((cluster, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B48] mt-0.5 shrink-0" />
                        <span>{cluster}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E2DDD5] space-y-2.5 text-xs shadow-xs">
                  <h4 className="font-serif font-bold text-[#1A1F1C] flex items-center space-x-1.5">
                    <Store className="w-4 h-4 text-[#1E6B48]" />
                    <span>Prominent Export Commodities &amp; Products:</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentProfile.famous_industries.key_products.map((prod, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#FAF9F5] border border-[#E2DDD5] rounded-xl text-[11px] font-semibold text-[#1A1F1C] shadow-2xs">
                        {prod}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 text-[11px] text-[#5E6460]">
                    Logistics Arteries: <strong>{currentProfile.logistics_connectivity}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: INDUSTRY MULTI-CRITERIA SUITABILITY MATRIX */}
          {/* ========================================================================= */}
          {analyticsSubTab === 'suitability' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 overflow-x-auto text-xs font-semibold">
                <span className="text-[11px] font-bold text-[#858B87] uppercase tracking-wider shrink-0">Select Sector:</span>
                {[
                  { id: 'textile', label: 'Textile & Garment Exports' },
                  { id: 'agro', label: 'Food Processing & Agro' },
                  { id: 'logistics', label: 'Logistics & Warehousing' },
                  { id: 'renewable', label: 'Solar & Wind Energy' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIndustryType(item.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      selectedIndustryType === item.id ? 'bg-[#C04A26] text-white font-bold shadow-xs' : 'bg-white text-[#5E6460] border border-[#E2DDD5] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2DDD5] space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD5] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-[#1A1F1C] text-sm sm:text-base">
                      {suitabilityData.title} in {currentProfile.name}
                    </h3>
                    <p className="text-[11px] text-[#5E6460] mt-0.5">
                      Calculated from NDBI built-up index, agricultural parcel ratio, moisture NDWI, and highway connectivity.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <MetricGaugeDial
                      value={suitabilityData.score}
                      size={86}
                      color="#1E6B48"
                      sublabel="/100"
                    />
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#1E6B48]/12 text-[#1E6B48] border border-[#1E6B48]/25">
                      {suitabilityData.badge}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#1E6B48]/8 border border-[#1E6B48]/25 space-y-2">
                    <div className="font-bold text-[#155034] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1E6B48]" />
                      <span>Positive Location Advantages:</span>
                    </div>
                    <ul className="space-y-1.5 text-[#155034] text-[11px]">
                      {suitabilityData.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span>&bull;</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#D49B28]/30 space-y-2">
                    <div className="font-bold text-[#996B1E] flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#996B1E]" />
                      <span>Environmental &amp; Farmland Preservation Constraints:</span>
                    </div>
                    <ul className="space-y-1.5 text-[#5E6460] text-[11px]">
                      {suitabilityData.constraints.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span>&bull;</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feature Highlight Badges */}
      {viewMode === 'village_finder' && !isFullscreen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-[#1A1F1C] text-xs">
          <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-white border border-[#E2DDD5] shadow-2xs">
            <Layers className="w-4 h-4 text-[#C04A26] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-[#1A1F1C]">TNGIS Cadastre</div>
              <div className="text-[10px] text-[#5E6460]">Survey Parcels</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-white border border-[#E2DDD5] shadow-2xs">
            <Store className="w-4 h-4 text-[#D49B28] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-[#1A1F1C]">Agmarknet Mandi</div>
              <div className="text-[10px] text-[#5E6460]">Daily Crop Prices</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-white border border-[#E2DDD5] shadow-2xs">
            <FlaskConical className="w-4 h-4 text-[#1E6B48] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-[#1A1F1C]">SoilGrids Profile</div>
              <div className="text-[10px] text-[#5E6460]">pH &amp; N-P-K Guide</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-white border border-[#E2DDD5] shadow-2xs">
            <CloudSun className="w-4 h-4 text-[#1E6B48] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-[#1A1F1C]">Open-Meteo Agromet</div>
              <div className="text-[10px] text-[#5E6460]">7-Day Forecast</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-white border border-[#E2DDD5] shadow-2xs">
            <FileText className="w-4 h-4 text-[#C04A26] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-[#1A1F1C]">Farmer Schemes</div>
              <div className="text-[10px] text-[#5E6460]">myScheme Central/State</div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-white border border-[#E2DDD5] shadow-2xs">
            <Globe2 className="w-4 h-4 text-[#1E6B48] shrink-0" />
            <div>
              <div className="font-bold text-[11px] text-[#1A1F1C]">7 Languages</div>
              <div className="text-[10px] text-[#5E6460]">Tamil, English, etc.</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk & Land-Use Map (ML conversion-risk mode) */}
      {viewMode === 'risk_map' && (
        <RiskLandUseMapView onNavigateTab={onNavigateTab} />
      )}

      {/* Main Interactive Map Area — village/cadastre modes only */}
      {viewMode !== 'risk_map' && (
      <div
        ref={iframeContainerRef}
        className={`w-full bg-white rounded-3xl border border-[#E2DDD5] overflow-hidden shadow-xs flex-1 ${
          isFullscreen ? 'h-full flex-1' : 'h-[calc(100vh-290px)] min-h-[580px]'
        }`}
      >
        <iframe
          key={`${viewMode}-${selectedStateId}`}
          src={currentIframeSrc}
          title="Village & Cadastral GIS Explorer"
          className="w-full h-full border-0"
          allow="geolocation; fullscreen"
        />
      </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL TAMIL NADU PATTA & CHITTA CERTIFICATE MODAL VIEW */}
      {/* ========================================================================= */}
      {showChittaModal && parcelIntelligence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] rounded-3xl border-2 border-[#1E6B48] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto font-serif text-[#1A1F1C]">
            <KolamCorner position="top-right" size={40} opacity={0.2} color="#1E6B48" className="absolute top-2 right-2 pointer-events-none" />
            <KolamCorner position="bottom-left" size={40} opacity={0.2} color="#1E6B48" className="absolute bottom-2 left-2 pointer-events-none" />

            {/* Certificate Header */}
            <div className="text-center border-b-2 border-[#1E6B48]/30 pb-4 space-y-1">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <TamilEmblemBadge size={36} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1E6B48] tracking-tight">
                GOVERNMENT OF TAMIL NADU — REVENUE DEPARTMENT
              </h2>
              <h3 className="text-sm font-bold text-[#1A1F1C]">
                தமிழ்நாடு அரசு — வருவாய்த் துறை
              </h3>
              <p className="text-xs font-sans text-[#5E6460]">
                Tamil Nilam Digital Land Record Extract (தமிழ் நிலம் நில உரிமை ஆவணக் குறிப்பு — சிட்டா பதிவு)
              </p>
            </div>

            {/* Jurisdiction Block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-[#E2DDD5] font-sans">
              <div>
                <span className="text-[#858B87] block text-[10px]">District (மாவட்டம்)</span>
                <strong className="text-[#1A1F1C]">{parcelIntelligence.land_identification.district}</strong>
              </div>
              <div>
                <span className="text-[#858B87] block text-[10px]">Taluk (வட்டம்)</span>
                <strong className="text-[#1A1F1C]">{parcelIntelligence.land_identification.taluk}</strong>
              </div>
              <div>
                <span className="text-[#858B87] block text-[10px]">Village (கிராமம்)</span>
                <strong className="text-[#1A1F1C]">{parcelIntelligence.land_identification.village}</strong>
              </div>
              <div>
                <span className="text-[#858B87] block text-[10px]">Survey No (புல எண்)</span>
                <strong className="text-[#C04A26] font-mono font-bold text-sm">#{parcelIntelligence.patta_chitta_record?.display_survey_no || parcelIntelligence.land_identification.survey_number}</strong>
              </div>
            </div>

            {/* Ownership Table */}
            <div className="space-y-2 text-xs font-sans">
              <div className="bg-white rounded-xl border border-[#E2DDD5] p-3 space-y-2">
                <div className="flex justify-between border-b border-[#ECE7DF] pb-1.5">
                  <span className="text-[#5E6460]">Title Category (நில உரிமை வகை):</span>
                  <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.ownership_type_en || 'Private Patta (தனியார் பட்டா)'}</strong>
                </div>
                <div className="flex justify-between border-b border-[#ECE7DF] pb-1.5">
                  <span className="text-[#5E6460]">Pattadhar Record (பட்டாதாரர் பதிவு):</span>
                  <strong className="text-[#1E6B48]">Protected Official Record (தமிழ் நிலம் மூலம் பெறவும்)</strong>
                </div>
                <div className="flex justify-between border-b border-[#ECE7DF] pb-1.5">
                  <span className="text-[#5E6460]">Land Classification (நில வகைப்பாடு):</span>
                  <strong className="text-[#1E6B48]">{parcelIntelligence.patta_chitta_record?.land_type_en || 'Ryotwari Wet (நன்செய்)'}</strong>
                </div>
                <div className="flex justify-between border-b border-[#ECE7DF] pb-1.5">
                  <span className="text-[#5E6460]">Extent (நிலத்தின் பரப்பு):</span>
                  <strong className="text-[#1A1F1C] font-mono">{parcelIntelligence.patta_chitta_record?.extent_hectare_are} ({parcelIntelligence.land_identification.area_acres} Acres)</strong>
                </div>
                <div className="flex justify-between border-b border-[#ECE7DF] pb-1.5">
                  <span className="text-[#5E6460]">Land Revenue Tax (நிலத் தீர்வை):</span>
                  <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.tax_assessment || 'As per Revenue Standing Orders (வருவாய் நிலை ஆணைப்படி)'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6460]">Irrigation Source (பாசன ஆதாரம்):</span>
                  <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.irrigation_source_en || 'Canal Command (பாசன வாய்க்கால்)'}</strong>
                </div>
              </div>

              {/* FMB Boundaries */}
              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E2DDD5] space-y-1.5">
                <span className="font-bold text-[11px] text-[#1A1F1C] block">FMB Boundary Description (புல வரைபட எல்லை விவரங்கள்):</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#5E6460]">
                  <div>North (வடக்கு): <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.fmb_boundaries.north}</strong></div>
                  <div>South (தெற்கு): <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.fmb_boundaries.south}</strong></div>
                  <div>East (கிழக்கு): <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.fmb_boundaries.east}</strong></div>
                  <div>West (மேற்கு): <strong className="text-[#1A1F1C]">{parcelIntelligence.patta_chitta_record?.fmb_boundaries.west}</strong></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2DDD5] font-sans">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1E6B48] hover:bg-[#155034] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print (அச்சு)</span>
              </button>
              <button
                onClick={() => setShowChittaModal(false)}
                className="px-4 py-2 bg-[#F5EFE6] hover:bg-[#E2DDD5] text-[#1A1F1C] rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Access Drawer */}
      <AuthorizedAccessDrawer
        isOpen={isAuthorizedDrawerOpen}
        onClose={() => setIsAuthorizedDrawerOpen(false)}
        surveyNo={selectedSurveyNo}
        district={currentProfile.name}
        taluk={selectedTalukName}
        village={selectedVillageName}
      />
    </div>
  );
};

