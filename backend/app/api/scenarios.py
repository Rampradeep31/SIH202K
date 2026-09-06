from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.scenarios.engine import scenario_engine
from app.core.rbac import require_permission
from app.data.tamilnadu_data import TAMIL_NADU_DISTRICTS, ALL_DISTRICT_PARCELS
from app.rag import llm_synthesis

router = APIRouter(prefix="/scenarios", tags=["Policy Scenarios"])

DISTRICT_INFO_BY_NAME = {d["name"]: d for d in TAMIL_NADU_DISTRICTS}

class SimulationRequest(BaseModel):
    weights: Optional[Dict[str, float]] = None

class CustomPolicyRequest(BaseModel):
    policy_text: str
    district: Optional[str] = "Tiruppur"

@router.get("")
def list_scenarios() -> Dict[str, Any]:
    scenarios = scenario_engine.simulate_all()
    return {
        "region": "Tiruppur District, Tamil Nadu",
        "total_scenarios": len(scenarios),
        "default_weights": scenario_engine.default_weights,
        "scenarios": scenarios
    }

@router.post("/simulate")
def simulate_scenarios(
    req: SimulationRequest,
    role: str = Depends(require_permission("run_scenario_simulation"))
) -> Dict[str, Any]:
    scenarios = scenario_engine.simulate_all(req.weights)
    return {
        "status": "success",
        "custom_weights_applied": req.weights,
        "run_by_role": role,
        "scenarios": scenarios
    }


REQUIRED_COMPONENTS = [
    "development_suitability", "infrastructure_access",
    "agricultural_preservation", "water_flood_safety", "ecological_protection"
]


@router.post("/analyze-custom")
def analyze_custom_policy(
    req: CustomPolicyRequest,
    role: str = Depends(require_permission("run_scenario_simulation"))
) -> Dict[str, Any]:
    """
    Scores an arbitrary user-submitted policy against the same transparent
    formula as the 3 baked-in scenarios. The LLM only estimates the 5
    component scores (0-100) from the policy text — the overall score is
    always computed server-side via scenario_engine.calculate_score(), the
    exact same function the fixed scenarios use, never trusted from the
    model's own arithmetic. If no LLM provider is configured or the call
    fails, this returns status "unavailable" rather than fabricating a score.
    """
    if not req.policy_text or not req.policy_text.strip():
        raise HTTPException(status_code=400, detail="policy_text is required")

    district = req.district or "Tiruppur"
    dist_info = DISTRICT_INFO_BY_NAME.get(district, {})
    parcels = ALL_DISTRICT_PARCELS.get(district, [])
    total_ha = sum(p["area_ha"] for p in parcels)
    agri_ha = sum(p["area_ha"] for p in parcels if p["lulc_2023"] == "Agriculture")
    built_ha = sum(p["area_ha"] for p in parcels if p["lulc_2023"] == "Built-up")

    baseline_scenarios = scenario_engine.simulate_all()
    baseline_summary = "; ".join(
        f"{s['name']}: {s['scoring']['overall_score']}/100" for s in baseline_scenarios
    )

    district_context = (
        f"District: {district}\n"
        f"Profile: {dist_info.get('description', 'N/A')}\n"
        f"Population: {dist_info.get('population', 'N/A')}, Urban %: {dist_info.get('urban_pct', 'N/A')}, "
        f"Area: {dist_info.get('area_sqkm', 'N/A')} sq.km\n"
        f"Taluks: {', '.join(dist_info.get('taluks', []) or ['N/A'])}\n"
        f"Current modeled land use (sample parcels): Agriculture {round(agri_ha, 1)} ha "
        f"({round(100 * agri_ha / total_ha, 1) if total_ha else 0}%), "
        f"Built-up {round(built_ha, 1)} ha ({round(100 * built_ha / total_ha, 1) if total_ha else 0}%)\n"
        f"Existing baseline scenarios on this platform for comparison: {baseline_summary}"
    )

    result = llm_synthesis.analyze_custom_policy(req.policy_text, district_context)
    if not result:
        return {
            "status": "unavailable",
            "message": (
                "Custom policy analysis requires a working LLM provider (ANTHROPIC_API_KEY or "
                "GEMINI_API_KEY) — none is configured, or the request failed (e.g. rate limit). "
                "No score is shown when this isn't available; we don't fabricate one."
            )
        }

    component_scores = result.get("component_scores", {})
    try:
        clamped = {
            k: max(0.0, min(100.0, float(component_scores[k])))
            for k in REQUIRED_COMPONENTS
        }
    except (KeyError, TypeError, ValueError):
        return {
            "status": "unavailable",
            "message": "The model's response couldn't be parsed into the expected 5-component score shape. Try again or rephrase the policy description."
        }

    scoring = scenario_engine.calculate_score(clamped, scenario_engine.default_weights)

    return {
        "status": "success",
        "district": district,
        "policy_text": req.policy_text,
        "requested_by_role": role,
        "component_scores": clamped,
        "rationale": result.get("rationale", {}),
        "comparison_to_baseline": result.get("comparison_to_baseline", ""),
        "suggestions": result.get("suggestions", []),
        "scoring": scoring,
        "synthesis_method": f"llm_generated ({result.get('_model', 'unknown')})",
        "baseline_scenarios": [
            {"id": s["id"], "name": s["name"], "overall_score": s["scoring"]["overall_score"]}
            for s in baseline_scenarios
        ]
    }
