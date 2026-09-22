export type UserRole = 'Researcher' | 'Policymaker' | 'Government Analyst' | 'Public User';

export interface District {
  id: string;
  name: string;
  region: string;
  hq: string;
  area_sqkm: number;
  population: number;
  urban_pct: number;
  pilot_focus: boolean;
  description: string;
  lat?: number;
  lon?: number;
  taluks?: string[];
}

export interface Taluk {
  id: string;
  name: string;
  hq: string;
  area_ha: number;
  urban_pressure: string;
  lat: number;
  lon: number;
  gw_status: string;
}

export interface LulcComparisonItem {
  lulc_class: string;
  area_2018_ha: number;
  pct_2018: number;
  area_2023_ha: number;
  pct_2023: number;
  net_change_ha: number;
  net_change_pct: number;
}

export interface TransitionMatrixRow {
  from_class: string;
  [to_class: string]: string | number;
}

export interface KeyTransitionItem {
  transition: string;
  area_ha: number;
  pct_of_original_agri: number;
  hotspots: string[];
  drivers: string[];
}

export interface ContributingFactor {
  factor: string;
  direction: 'increases_risk' | 'decreases_risk';
  contribution_pct: number;
  detail: string;
}

export interface PredictionCell {
  cell_id: string;
  taluk: string;
  lat: number;
  lon: number;
  transition_probability: number;
  risk_category: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | string;
  confidence: number;
  model_version: string;
  contributing_factors: ContributingFactor[];
  polygon: [number, number][];
}

export interface EvidenceChain {
  prediction_value: string;
  model_architecture: string;
  validation_roc_auc: number;
  input_features: string[];
  primary_datasets: {
    dataset: string;
    authority: string;
    resolution: string;
  }[];
  training_period: string;
  target_horizon: string;
  decision_support_notice: string;
}

export interface CellExplanationResponse {
  prediction: PredictionCell;
  parcel_metadata: any;
  evidence_chain: EvidenceChain;
}

export interface RAGSource {
  type: string;
  title: string;
  year: number;
  url: string;
  verification_status?: string;
  is_validated?: boolean;
}

export interface RAGResponse {
  question: string;
  answer: string;
  synthesis_method?: string;
  search_method?: string;
  web_search_used?: boolean;
  confidence_score: number;
  key_evidence: string[];
  relevant_locations: string[];
  relevant_policies: string[];
  relevant_research: string[];
  assumptions: string;
  limitations: string;
  sources: RAGSource[];
}

export interface ScenarioScoring {
  overall_score: number;
  normalized_weights: {
    development_suitability: number;
    infrastructure_access: number;
    agricultural_preservation: number;
    water_flood_safety: number;
    ecological_protection: number;
  };
  component_contributions: {
    development_suitability: number;
    infrastructure_access: number;
    agricultural_preservation: number;
    water_flood_safety: number;
    ecological_protection: number;
  };
  formula_definition: string;
}

export interface ScenarioItem {
  id: string;
  name: string;
  tagline: string;
  assumptions: Record<string, any>;
  indicators: {
    development_suitability: number;
    infrastructure_access: number;
    agricultural_preservation: number;
    water_flood_safety: number;
    ecological_protection: number;
    projected_agri_loss_ha: number;
    projected_built_growth_pct: number;
    groundwater_stress_exposure: string;
    economic_output_growth_cr: number;
  };
  scoring: ScenarioScoring;
}

export interface ModelMetrics {
  model_name: string;
  version: string;
  sample_size: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  calibration_curve: {
    predicted_bin: number;
    observed_fraction: number;
  }[];
  feature_importance: {
    feature_key: string;
    label: string;
    importance_pct: number;
  }[];
  training_period: string;
  data_sources: string[];
  limitations: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  authority: string;
  spatial_resolution: string;
  temporal_coverage: string;
  update_frequency: string;
  license: string;
  completeness_pct: number;
  freshness: string;
  quality_score: number;
  status: string;
  limitation_note?: string;
}

export interface DisputeStats {
  data_source: string;
  total_cases: number;
  pending_case_rate_pct: number;
  by_type: { dispute_type: string; count: number }[];
  by_status: { status: string; count: number }[];
  by_year: { year: number; count: number }[];
  top_districts: { district: string; count: number }[];
}

export interface ClimateMetrics {
  data_source: string;
  coverage: string;
  long_term_annual_avg_mm: number;
  recent_decade_annual_avg_mm: number;
  recent_vs_baseline_pct_change: number;
  recent_decade_years: number[];
  monthly_seasonality: { month: string; avg_rainfall_mm: number }[];
  annual_totals: { year: number; total_rainfall_mm: number }[];
}

export interface InnovationProgramme {
  id: string;
  name: string;
  type: string;
  organizer: string;
  description: string;
  focus_area: string;
  source_url: string;
  status: string;
}

export interface WorkspaceNote {
  id: string;
  author_name: string;
  author_role: string;
  text: string;
  posted_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  focus_district?: string | null;
  created_by_role: string;
  created_at: string;
  notes: WorkspaceNote[];
  note_count?: number;
}

export interface CustomPolicyResult {
  status: 'success' | 'unavailable' | 'not_a_policy';
  message?: string;
  district?: string;
  policy_text?: string;
  component_scores?: Record<string, number>;
  rationale?: Record<string, string>;
  comparison_to_baseline?: string;
  suggestions?: string[];
  scoring?: ScenarioScoring;
  synthesis_method?: string;
  baseline_scenarios?: { id: string; name: string; overall_score: number }[];
}

export interface ExecutiveReport {
  title: string;
  jurisdiction: string;
  issuing_entity: string;
  generated_for_role: string;
  date_generated: string;
  pilot_region: {
    district: string;
    state: string;
    focal_taluk: string;
    total_evaluated_hectares: number;
  };
  executive_summary: string;
  evidence_taxonomy: {
    observed_data: string[];
    research_evidence: string[];
    model_predictions: string[];
    scenario_estimates: string[];
    statutory_assumptions: string[];
  };
  actionable_policy_recommendations: string[];
  disclaimer: string;
}

export interface VillageRecord {
  district: string;
  taluk: string;
  village_name: string;
  village_native: string;
  village_code: string;
  pincode: string;
  district_code?: string;
  mandal_code?: string;
  source: string;
}

export interface VillageResponse {
  total_matches: number;
  district?: string;
  taluk?: string;
  villages: VillageRecord[];
}

export interface PattaChittaRecord {
  patta_number: string;
  display_survey_no: string;
  raw_survey_no: string;
  main_survey_no: string;
  subdivision_no: string;
  pattadhar_name_ta: string;
  pattadhar_name_en: string;
  father_husband_name_ta: string;
  father_husband_name_en: string;
  ownership_type_ta: string;
  ownership_type_en?: string;
  land_type_ta: string;
  land_type_en: string;
  tax_assessment: string;
  irrigation_source_ta: string;
  irrigation_source_en?: string;
  extent_hectare_are: string;
  extent_acres_cents: string;
  fmb_boundaries: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  chitta_extract_note: string;
  fmb_sketch_verified: boolean;
  tngis_gi_viewer_url: string;
  eservices_chitta_url: string;
  eservices_fmb_url: string;
}

export interface ParcelIntelligenceResponse {
  land_identification: {
    district: string;
    taluk: string;
    village: string;
    survey_number: string;
    subdivision_number: string;
    main_survey_number?: string;
    raw_survey_code?: string;
    parcel_id: string;
    area_sqm: number;
    area_acres: number;
    area_ha: number;
    centroid: {
      lat: number;
      lon: number;
    };
  };
  patta_chitta_record?: PattaChittaRecord;
  land_information: {
    land_classification: string;
    land_classification_ta?: string;
    current_land_use: string;
    agricultural_status: string;
    irrigation_information: string;
    soil_condition: {
      status: string;
      notice: string;
      available: boolean;
    };
  };
  environment: {
    rainfall_status: string;
    rainfall_normal_mm: number;
    water_availability: string;
    vegetation_vitality: string;
    flood_hazard_exposure: string;
    environmental_sensitivity: string;
  };
  infrastructure: {
    nearby_roads: string;
    major_road_distance_km: number;
    waterbody_distance_km: number;
    industrial_infrastructure: string;
    nearby_facilities: string;
  };
  historical_intelligence: {
    historical_land_use_2018: string;
    current_land_use_2023: string;
    transition_trend: string;
    conversion_risk_score: number;
    conversion_risk_grade: string;
    vegetation_loss_5yr_pct: number;
  };
  policy_research: {
    applicable_building_rules: string;
    land_ceiling_act: string;
    encroachment_protection: string;
    zonal_planning_mandate: string;
  };
  patta_ownership: {
    patta_number?: string;
    pattadhar_name?: string;
    patta_status: string;
    ownership_status: string;
    access_notice: string;
    dispute_status: string;
    fmb_ladder_status: string;
  };
  provenance: {
    indicator: string;
    source: string;
    dataset: string;
    field: string;
    vintage: string;
    access: string;
  }[];
}

export interface ParcelSearchResult {
  survey_no: string;
  display_survey_no?: string;
  patta_no?: string;
  pattadhar_name?: string;
  district: string;
  taluk: string;
  village?: string;
  land_use: string;
  area_sqm: number;
  area_acres?: number;
  centroid: {
    lat: number;
    lon: number;
  };
  geometry: any;
}

export interface ParcelSearchResponse {
  query: string;
  total_matches: number;
  results: ParcelSearchResult[];
}
