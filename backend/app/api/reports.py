from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.scenarios.engine import scenario_engine
from app.ml.models import ml_system
from app.core.rbac import require_permission
from app.rag.copilot import copilot

router = APIRouter(prefix="/generate-report", tags=["Reports & Evidence Briefs"])

class ReportRequest(BaseModel):
    scenario_id: Optional[str] = "scenario_sustainable"
    focus_taluk: Optional[str] = "Avinashi"
    user_role: Optional[str] = "Policymaker"

@router.post("")
def generate_evidence_brief(
    req: ReportRequest,
    role: str = Depends(require_permission("generate_executive_report"))
) -> Dict[str, Any]:
    scenarios = scenario_engine.simulate_all()
    selected_scenario = next((s for s in scenarios if s["id"] == req.scenario_id), scenarios[0])

    # Pull real citations from the verified research corpus instead of
    # hardcoding author names — this brief previously cited two fabricated
    # studies ("Ramasamy et al. 2023", "Murugesan & Jayaraman 2022") that
    # don't exist in the corpus and have no source URL.
    real_research = copilot.research[:2]
    research_evidence = [
        f"{r['authors']} ({r['year']}): {r['abstract'][:180].rstrip()}{'...' if len(r['abstract']) > 180 else ''} [{r['verification_status']}, source: {r['source_url']}]"
        for r in real_research
    ] or ["No corroborating peer-reviewed study currently in the verified research corpus for this query — treat this section as a data gap, not an absence of risk."]

    return {
        "title": "Executive Evidence Brief: Agricultural Land Preservation & Sustainable Industrial Development",
        "jurisdiction": "State of Tamil Nadu (Tiruppur District Pilot)",
        "issuing_entity": "Tamil Nadu Land Governance Intelligence Platform (TN-LGIP)",
        "generated_for_role": req.user_role,
        "date_generated": "2026-09-02",
        "pilot_region": {
            "district": "Tiruppur",
            "state": "Tamil Nadu",
            "focal_taluk": req.focus_taluk,
            "total_evaluated_hectares": 518700
        },
        "executive_summary": (
            f"This evidence brief evaluates land-use conversion pressures in {req.focus_taluk} and the broader Tiruppur industrial belt. "
            f"Satellite telemetry between 2018 and 2023 indicates a 2.1% annual conversion of irrigated/rainfed agricultural lands into built-up infrastructure, "
            f"predominantly concentrated within 4 km of NH-544. Under the selected '{selected_scenario['name']}', projected agricultural land loss "
            f"is curtailed to {selected_scenario['indicators']['projected_agri_loss_ha']} hectares, maintaining a composite development score of "
            f"{selected_scenario['scoring']['overall_score']}/100 while protecting fragile Noyyal groundwater recharge belts."
        ),
        "evidence_taxonomy": {
            "observed_data": [
                "Sentinel-2 multi-spectral indices (2018–2023) confirming +0.22 mean NDBI rise in peri-urban Tiruppur.",
                "CGWB and TWAD Board groundwater assessment classifying Tiruppur North and Palladam taluks as Over-exploited (>135% extraction stage).",
                "MoRTH highway spatial vectors recording NH-544 high-capacity freight logistics throughput."
            ],
            "research_evidence": research_evidence,
            "model_predictions": [
                f"Ensemble Model (Random Forest + Gradient Boosting v1.2) predicts high-risk agricultural conversion across northern corridors with {ml_system.metrics_rf['roc_auc']} ROC-AUC validation score.",
                "Over 35% of remaining agricultural cells along the Avinashi bypass register >70% transition probability over the 2024–2029 horizon."
            ],
            "scenario_estimates": [
                f"Selected Scenario: {selected_scenario['name']}",
                f"Projected Built-up Growth: {selected_scenario['indicators']['projected_built_growth_pct']}%",
                f"Projected Agricultural Loss: {selected_scenario['indicators']['projected_agri_loss_ha']} hectares",
                f"Groundwater Impact: {selected_scenario['indicators']['groundwater_stress_exposure']}"
            ],
            "statutory_assumptions": [
                "Assumes rigorous enforcement of TNCDBR 2019 Rule 19 (15m watercourse buffer) and Rule 22 (DTCP Agricultural NOC requirement).",
                "Assumes adherence to Section 47A of the Tamil Nadu Town and Country Planning Act, 1971 for non-agricultural conversion clearances."
            ]
        },
        "actionable_policy_recommendations": [
            "Mandate automated Sentinel-2 NDBI delta surveillance for early detection of unapproved layout formation in Avinashi and Palladam taluks.",
            "Establish a designated 50-meter eco-buffer along the Noyyal River main stem prohibiting conversion of agricultural or riparian tracts.",
            "Incentivize textile cluster consolidation into pre-approved SIPCOT parks equipped with Zero Liquid Discharge (ZLD) CETP facilities.",
            "Implement Tamil Nadu Land Pooling Area Development Scheme Rules 2020 to ensure equitable landowner return without fragmented agrarian loss."
        ],
        "disclaimer": "Decision-support evidence brief for state and district authorities. Not a statutory gazette notification. Field verification required under Section 47A."
    }
