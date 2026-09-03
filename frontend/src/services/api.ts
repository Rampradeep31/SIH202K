import {
  District,
  Taluk,
  LulcComparisonItem,
  TransitionMatrixRow,
  KeyTransitionItem,
  PredictionCell,
  CellExplanationResponse,
  RAGResponse,
  ScenarioItem,
  ModelMetrics,
  DatasetItem,
  ExecutiveReport
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}, using fallback if available:`, err);
    throw err;
  }
}

export const api = {
  // Regions
  getRegions: () => fetchJson<{ total_districts: number; districts: District[]; pilot_taluks: Taluk[] }>('/regions'),
  getTiruppurDetails: () => fetchJson<{ district: string; taluks: Taluk[]; key_corridors: string[]; river_basins: string[] }>('/regions/tiruppur'),

  // LULC
  getLulcSummary: () => fetchJson<{ sample_analyzed_area_ha: number; comparison: LulcComparisonItem[] }>('/lulc'),
  getLulcChange: () => fetchJson<{ matrix: TransitionMatrixRow[]; classes: string[]; key_transitions: KeyTransitionItem[] }>('/lulc/change'),

  // GIS
  getGisLayers: () => fetchJson<{ available_layers: any[]; pilot_center: { lat: number; lon: number; zoom: number } }>('/gis/layers'),
  getParcelsGeoJson: () => fetchJson<any>('/gis/geojson'),
  getTamilNaduDistrictsGeoJson: () => fetchJson<any>('/gis/tamilnadu-districts'),

  // Predictions
  getPredictions: (taluk?: string, risk?: string) => {
    const params = new URLSearchParams();
    if (taluk) params.append('taluk', taluk);
    if (risk) params.append('risk', risk);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<{ total_evaluated_cells: number; risk_breakdown: Record<string, number>; predictions: PredictionCell[] }>(`/predictions${queryStr}`);
  },
  getCellExplanation: (cellId: string) => fetchJson<CellExplanationResponse>(`/predictions/${cellId}`),

  // Ask-the-Map
  askMap: (query: string) => fetchJson<{
    query: string;
    interpretation: any;
    explanation: string;
    matched_count: number;
    matched_cells: any[];
  }>('/ask-map', {
    method: 'POST',
    body: JSON.stringify({ query })
  }),

  // Research Copilot RAG
  queryResearch: (question: string) => fetchJson<RAGResponse>('/research/query', {
    method: 'POST',
    body: JSON.stringify({ question })
  }),
  getDocuments: () => fetchJson<{ policies: any[]; research: any[]; total_documents: number }>('/research/documents'),

  // Scenarios
  getScenarios: () => fetchJson<{ scenarios: ScenarioItem[]; default_weights: Record<string, number> }>('/scenarios'),
  simulateScenarios: (weights?: Record<string, number>) => fetchJson<{ status: string; scenarios: ScenarioItem[] }>('/scenarios/simulate', {
    method: 'POST',
    body: JSON.stringify({ weights })
  }),

  // Models Evaluation
  getModelsEvaluation: () => fetchJson<{
    models: ModelMetrics[];
    comparison_summary: any;
  }>('/models'),

  // Datasets & Quality
  getDatasets: () => fetchJson<{ datasets: DatasetItem[] }>('/datasets'),
  getDataQuality: () => fetchJson<{
    overall_platform_quality_index: number;
    average_completeness_pct: number;
    datasets_status: DatasetItem[];
  }>('/data-quality'),

  // Evidence
  getEvidenceChain: (cellId: string) => fetchJson<any>(`/evidence/chain/${cellId}`),

  // Taluk Intelligence & Industry Suitability (Strictly Real Datasets)
  getTaluks: (district?: string) => {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    return fetchJson<{ district?: string; total_taluks?: number; taluks?: string[]; district_taluk_map?: Record<string, string[]> }>(`/taluks${q}`);
  },
  getTaluksGeoJson: (district?: string) => {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    return fetchJson<any>(`/taluks/geojson${q}`);
  },
  getTalukIntelligence: (district: string, taluk: string) => {
    return fetchJson<any>(`/taluks/intelligence?district=${encodeURIComponent(district)}&taluk=${encodeURIComponent(taluk)}`);
  },
  getTalukComparison: (district: string) => {
    return fetchJson<any>(`/taluks/compare?district=${encodeURIComponent(district)}`);
  },
  filterHighRainAgriTaluks: (district?: string) => {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    return fetchJson<any>(`/taluks/filter/high-rain-agri${q}`);
  },
  getIndustrySuitability: (district: string, taluk: string, industry: string = 'textile') => {
    return fetchJson<any>(`/taluks/industry-suitability?district=${encodeURIComponent(district)}&taluk=${encodeURIComponent(taluk)}&industry=${encodeURIComponent(industry)}`);
  },

  // Executive Report
  generateReport: (scenarioId: string, focusTaluk: string, userRole: string) => fetchJson<ExecutiveReport>('/generate-report', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId, focus_taluk: focusTaluk, user_role: userRole })
  })
};
