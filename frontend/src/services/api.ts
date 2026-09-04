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
  ExecutiveReport,
  DisputeStats,
  ClimateMetrics,
  InnovationProgramme,
  Workspace
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// Prototype-scope role identity: sent as a header on every request so the
// backend's RBAC layer (app/core/rbac.py) can actually enforce permissions
// server-side, not just hide buttons in the UI. Set from the role selector
// in Settings/Header via api.setCurrentRole().
let currentRole = 'Public User';
export function setCurrentRole(role: string) {
  currentRole = role;
}

export class ApiForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiForbiddenError';
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': currentRole,
        ...options?.headers
      }
    });
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      throw new ApiForbiddenError(body.detail || `Role '${currentRole}' does not have permission for this action.`);
    }
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
  getDocuments: () => fetchJson<{ policies: any[]; research: any[]; grounding_facts: any[]; total_documents: number }>('/research/documents'),

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

  // Executive Report
  generateReport: (scenarioId: string, focusTaluk: string, userRole: string) => fetchJson<ExecutiveReport>('/generate-report', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId, focus_taluk: focusTaluk, user_role: userRole })
  }),

  // Land Dispute Statistics
  getDisputeStats: () => fetchJson<DisputeStats>('/disputes'),

  // Climate Resilience
  getClimateMetrics: () => fetchJson<ClimateMetrics>('/climate'),

  // Innovation Portal
  getInnovationProgrammes: () => fetchJson<{ total_programmes: number; by_type: string[]; programmes: InnovationProgramme[] }>('/innovation'),

  // Collaborative Workspaces
  getWorkspaces: () => fetchJson<{ total_workspaces: number; workspaces: Workspace[] }>('/workspaces'),
  getWorkspace: (id: string) => fetchJson<Workspace>(`/workspaces/${id}`),
  createWorkspace: (name: string, description?: string, focusDistrict?: string) => fetchJson<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name, description, focus_district: focusDistrict })
  }),
  addWorkspaceNote: (workspaceId: string, authorName: string, text: string) => fetchJson<Workspace['notes'][number]>(`/workspaces/${workspaceId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ author_name: authorName, text })
  })
};
