"""
Policy Scenario Engine: Transparent Multi-Objective Land Planning
For Tamil Nadu / Tiruppur District Pilot:
1. Scenario 1: Baseline / Business As Usual (BAU)
2. Scenario 2: Industrial Expansion Focus (Textile & Logistics Corridors)
3. Scenario 3: Low-Impact Sustainable Agro-Ecological Development

Land Development Impact Score (0-100 Transparent Formula):
Score = w_suitability * DevelopmentSuitability
      + w_infra * InfrastructureAccess
      - w_agri * AgriculturalLossRisk
      - w_water * WaterHazardRisk
      - w_ecol * EcologicalFragility
"""

from typing import Dict, List, Any

DEFAULT_WEIGHTS = {
    "development_suitability": 0.25,
    "infrastructure_access": 0.25,
    "agricultural_preservation": 0.20,
    "water_flood_safety": 0.15,
    "ecological_protection": 0.15
}

SCENARIO_DEFINITIONS = [
    {
        "id": "scenario_baseline",
        "name": "Scenario 1: Baseline (Business As Usual)",
        "tagline": "Historical trend continuation without additional statutory zoning interventions",
        "assumptions": {
            "annual_conversion_rate_pct": 2.1,
            "highway_buffer_enforcement": "Standard (30m)",
            "agricultural_clearance_rigor": "Moderate (Routine NOCs)",
            "waterbody_buffer_meters": 15,
            "industrial_zoning": "Organic market-driven sprawl along NH-544 and SH-174"
        },
        "raw_indicators": {
            "development_suitability": 74.0,
            "infrastructure_access": 82.0,
            "agricultural_preservation": 52.0,  # lower means higher loss
            "water_flood_safety": 58.0,
            "ecological_protection": 50.0,
            "projected_agri_loss_ha": 3850,
            "projected_built_growth_pct": 14.8,
            "groundwater_stress_exposure": "High (Tiruppur North & Palladam critical)",
            "economic_output_growth_cr": 4200
        }
    },
    {
        "id": "scenario_industrial",
        "name": "Scenario 2: Industrial Expansion Focus",
        "tagline": "Accelerated textile, garment ancillary, and logistics warehousing corridors",
        "assumptions": {
            "annual_conversion_rate_pct": 3.6,
            "highway_buffer_enforcement": "Relaxed for manufacturing clusters",
            "agricultural_clearance_rigor": "Expedited via Single Window Portal",
            "waterbody_buffer_meters": 15,
            "industrial_zoning": "Heavy densification along Avinashi-Tiruppur-Palladam spine"
        },
        "raw_indicators": {
            "development_suitability": 91.0,
            "infrastructure_access": 94.0,
            "agricultural_preservation": 31.0,  # severe agricultural loss
            "water_flood_safety": 44.0,
            "ecological_protection": 35.0,
            "projected_agri_loss_ha": 6900,
            "projected_built_growth_pct": 24.2,
            "groundwater_stress_exposure": "Severe (Accelerated drawdown in Noyyal basin)",
            "economic_output_growth_cr": 7800
        }
    },
    {
        "id": "scenario_sustainable",
        "name": "Scenario 3: Low-Impact Sustainable Agro-Ecological Development",
        "tagline": "Strict preservation of prime agrarian belts, 50m Noyyal buffer, and brownfield infill",
        "assumptions": {
            "annual_conversion_rate_pct": 0.9,
            "highway_buffer_enforcement": "Strict transit-oriented corridors, no ribbon sprawl",
            "agricultural_clearance_rigor": "High (Section 47A mandatory environmental audits)",
            "waterbody_buffer_meters": 50,
            "industrial_zoning": "Restricted exclusively to existing SIPCOT/SIDCO parks with ZLD CETP"
        },
        "raw_indicators": {
            "development_suitability": 68.0,
            "infrastructure_access": 76.0,
            "agricultural_preservation": 89.0,  # high agrarian retention
            "water_flood_safety": 88.0,
            "ecological_protection": 86.0,
            "projected_agri_loss_ha": 1150,
            "projected_built_growth_pct": 6.8,
            "groundwater_stress_exposure": "Low (Recharge zones protected; artificial wells mandated)",
            "economic_output_growth_cr": 3100
        }
    }
]

class ScenarioEngine:
    def __init__(self):
        self.scenarios = SCENARIO_DEFINITIONS
        self.default_weights = DEFAULT_WEIGHTS

    def calculate_score(self, raw_indicators: Dict[str, float], weights: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates normalized 0-100 Land Development Impact Score with full transparency.
        Formula:
          Score = w_dev * Suitability + w_infra * InfraAccess
                + w_agri * AgriPreservation + w_water * FloodSafety
                + w_ecol * EcoProtection
        All positive component scores (higher is better for overall sustainable governance).
        """
        w_dev = weights.get("development_suitability", 0.25)
        w_infra = weights.get("infrastructure_access", 0.25)
        w_agri = weights.get("agricultural_preservation", 0.20)
        w_water = weights.get("water_flood_safety", 0.15)
        w_ecol = weights.get("ecological_protection", 0.15)
        
        # Normalize weights so sum is 1.0
        total_w = w_dev + w_infra + w_agri + w_water + w_ecol
        if total_w > 0:
            w_dev /= total_w
            w_infra /= total_w
            w_agri /= total_w
            w_water /= total_w
            w_ecol /= total_w

        c_dev = raw_indicators["development_suitability"] * w_dev
        c_infra = raw_indicators["infrastructure_access"] * w_infra
        c_agri = raw_indicators["agricultural_preservation"] * w_agri
        c_water = raw_indicators["water_flood_safety"] * w_water
        c_ecol = raw_indicators["ecological_protection"] * w_ecol

        composite_score = round(c_dev + c_infra + c_agri + c_water + c_ecol, 1)

        return {
            "overall_score": composite_score,
            "normalized_weights": {
                "development_suitability": round(w_dev, 2),
                "infrastructure_access": round(w_infra, 2),
                "agricultural_preservation": round(w_agri, 2),
                "water_flood_safety": round(w_water, 2),
                "ecological_protection": round(w_ecol, 2)
            },
            "component_contributions": {
                "development_suitability": round(c_dev, 1),
                "infrastructure_access": round(c_infra, 1),
                "agricultural_preservation": round(c_agri, 1),
                "water_flood_safety": round(c_water, 1),
                "ecological_protection": round(c_ecol, 1)
            },
            "formula_definition": "Score = Σ (Weight_i × Component_i) / Σ Weights. Decision-support metric — not a statutory policy decree."
        }

    def simulate_all(self, custom_weights: Dict[str, float] = None) -> List[Dict[str, Any]]:
        weights = custom_weights if custom_weights else self.default_weights
        results = []
        for s in self.scenarios:
            scoring = self.calculate_score(s["raw_indicators"], weights)
            results.append({
                "id": s["id"],
                "name": s["name"],
                "tagline": s["tagline"],
                "assumptions": s["assumptions"],
                "indicators": s["raw_indicators"],
                "scoring": scoring
            })
        return results

scenario_engine = ScenarioEngine()
