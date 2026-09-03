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
}

export interface RAGResponse {
  question: string;
  answer: string;
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

export interface DataProvenanceItem {
  indicator: string;
  value: string;
  dataset: string;
  field: string;
  vintage: string;
  calculation: string;
}

export interface TalukMetrics {
  rainfall_status: 'High' | 'Moderate' | 'Low' | string;
  rainfall_category: string;
  rainfall_normal_mm: number;
  ndvi_post_monsoon?: number | null;
  ndvi_dry_summer?: number | null;
  ndwi_post_monsoon?: number | null;
  ndwi_dry_summer?: number | null;
  ndbi_dry_summer?: number | null;
  agricultural_land_pct?: number | null;
  dry_vacant_area_pct?: number | null;
  industrial_land_pct?: number | null;
  industrial_units_count?: number;
  industrial_activity: string;
  urbanisation_pct?: number | null;
  water_availability: string;
  infrastructure_access: string;
  population?: number | null;
  population_density?: number | null;
  literacy_rate?: number | null;
  soil_condition: {
    status: string;
    notice: string;
    available: boolean;
  };
}

export interface TalukIntelligenceResponse {
  taluk: string;
  district: string;
  metrics: TalukMetrics;
  provenance: DataProvenanceItem[];
}

export interface TalukComparisonRecord {
  taluk: string;
  rainfall_status: string;
  agricultural_land_pct?: number | null;
  ndvi_greenery?: number | null;
  ndwi_moisture?: number | null;
  ndbi_built_up?: number | null;
  industrial_activity: string;
  urbanisation_pct?: number | null;
  water_availability: string;
}

export interface TalukComparisonResponse {
  district: string;
  total_taluks_evaluated: number;
  taluks: TalukComparisonRecord[];
  district_averages: {
    avg_agricultural_land_pct?: number | null;
    avg_ndbi_built_up?: number | null;
    avg_ndwi_moisture?: number | null;
    rainfall_normal_mm: number;
    source: string;
  };
  rankings: {
    category: string;
    top_taluk: string;
    value: string;
  }[];
}

export interface TalukFilterMatch {
  district: string;
  taluk: string;
  agricultural_land_pct?: number | null;
  ndvi_greenery?: number | null;
  ndwi_moisture?: number | null;
  rainfall_status: string;
  water_availability: string;
  criteria_matched: string;
}

export interface TalukFilterResponse {
  filter_name: string;
  methodology: string;
  total_matches: number;
  matched_taluks: TalukFilterMatch[];
}

export interface AlternativeTaluk {
  taluk: string;
  suitability_score: number;
  agricultural_land_pct: number;
  ndbi_built_up: number;
  water_availability: string;
  suitability_status: 'High' | 'Moderate' | 'Low';
}

export interface IndustrySuitabilityResponse {
  industry_type: string;
  district: string;
  taluk: string;
  suitability_score: number;
  suitability_grade: 'High' | 'Moderate' | 'Low';
  positive_factors: string[];
  constraints: string[];
  recommendation: string;
  methodology: {
    scoring_model: string;
    factors_evaluated: string[];
    data_sources: string[];
  };
  alternative_taluk_rankings: AlternativeTaluk[];
}
