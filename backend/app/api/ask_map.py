from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
import re
from app.data.tamilnadu_data import TIRUPPUR_PARCELS
from app.ml.models import ml_system

router = APIRouter(prefix="/ask-map", tags=["Natural Language Spatial Query"])

class QueryRequest(BaseModel):
    query: str

from app.data.taluk_data_service import taluk_service

@router.post("")
def ask_map_query(req: QueryRequest) -> Dict[str, Any]:
    q = req.query.lower().strip()
    
    # 0. Check for Taluk-level queries (e.g. High rain + High agri, Industry suitability, Taluk comparison)
    if "high rain" in q or "rainfall" in q and "agri" in q or "suitable" in q or "taluk" in q and ("highest" in q or "compare" in q):
        # Handle high rain + high agri query
        if ("rain" in q and "agri" in q) or "high moisture" in q:
            res = taluk_service.filter_high_rain_high_agri()
            matched_names = [f"{m['taluk']} ({m['district']})" for m in res["matched_taluks"][:6]]
            return {
                "query": req.query,
                "interpretation": {
                    "query_type": "Taluk Spatial Filter",
                    "criteria": "High Rainfall / Moisture (NDWI >= -0.42) + High Agricultural Land (>= 50%)",
                    "methodology": res["methodology"]
                },
                "explanation": f"Identified {res['total_matches']} Taluks matching High Rainfall & Agricultural preservation criteria across Tamil Nadu based on authentic Sentinel-2 STAC and IMD datasets: {', '.join(matched_names)}.",
                "matched_count": res["total_matches"],
                "matched_taluks": res["matched_taluks"],
                "matched_cells": []
            }
        elif "industry" in q or "textile" in q or "suitab" in q:
            # Industry suitability query
            ind = "textile" if "textile" in q or "garment" in q else ("food" if "food" in q or "agro" in q else ("warehouse" if "warehouse" in q else "renewable"))
            suit_res = taluk_service.calculate_industry_suitability("Tiruppur", "Palladam", ind)
            return {
                "query": req.query,
                "interpretation": {
                    "query_type": "Taluk Industry Suitability",
                    "industry": suit_res["industry_type"],
                    "evaluation_district": "Tiruppur"
                },
                "explanation": f"Evaluation for {suit_res['industry_type']}: Top candidate Palladam scores {suit_res['suitability_score']}/100 ({suit_res['suitability_grade']}). Key positive factor: {suit_res['positive_factors'][0] if suit_res['positive_factors'] else 'Infrastructure'}. Primary constraint: {suit_res['constraints'][0] if suit_res['constraints'] else 'Water availability'}.",
                "matched_count": len(suit_res.get("alternative_taluk_rankings", [])),
                "suitability_details": suit_res,
                "matched_cells": []
            }

    # 1. Parse LULC filter
    lulc_target = None
    if "agri" in q or "farm" in q or "crop" in q:
        lulc_target = "Agriculture"
    elif "built" in q or "urban" in q or "industrial" in q:
        lulc_target = "Built-up"
    elif "water" in q or "wetland" in q or "river" in q:
        lulc_target = "Waterbody"

    # 2. Parse Risk filter
    risk_targets = []
    if "high" in q or "critical" in q or "very high" in q:
        risk_targets.extend(["High", "Very High"])
    elif "moderate" in q or "medium" in q:
        risk_targets.append("Moderate")
    elif "low" in q:
        risk_targets.extend(["Low", "Very Low"])

    # 3. Parse Road proximity distance (e.g. "within 5 km", "within 3 km")
    dist_max = None
    dist_match = re.search(r'within\s*(\d+(?:\.\d+)?)\s*km', q)
    if not dist_match:
        dist_match = re.search(r'(\d+(?:\.\d+)?)\s*km\s*of\s*(?:major\s*)?roads?', q)
    if dist_match:
        dist_max = float(dist_match.group(1))

    # 4. Parse Taluk filter
    taluk_target = None
    for tname in ["tiruppur north", "tiruppur south", "avinashi", "palladam", "kangeyam", "dharapuram", "udumalaipettai", "madathukulam"]:
        if tname in q:
            taluk_target = tname.title()
            break

    # Execute structured query against dataset
    matched_cells = []
    for p in TIRUPPUR_PARCELS:
        cid = p["cell_id"]
        pred = ml_system.predictions_cache.get(cid, {})
        
        # Check lulc
        if lulc_target and p["lulc_2018"] != lulc_target and p["lulc_2023"] != lulc_target:
            continue
            
        # Check risk
        if risk_targets and pred.get("risk_category") not in risk_targets:
            continue
            
        # Check road distance
        if dist_max is not None and p["dist_to_nh_km"] > dist_max:
            continue
            
        # Check taluk
        if taluk_target and p["taluk"].lower() != taluk_target.lower():
            continue
            
        matched_cells.append({
            "cell_id": cid,
            "taluk": p["taluk"],
            "lat": p["lat"],
            "lon": p["lon"],
            "lulc": p["lulc_2023"],
            "dist_to_nh_km": p["dist_to_nh_km"],
            "transition_probability": pred.get("transition_probability", 0.0),
            "risk_category": pred.get("risk_category", "Low"),
            "polygon": p["polygon"]
        })

    # Summary synthesis
    interpretation = {
        "lulc_filter": lulc_target or "All",
        "risk_levels": risk_targets or "All",
        "max_road_distance_km": dist_max if dist_max is not None else "Unrestricted",
        "taluk_filter": taluk_target or "Entire District"
    }

    explanation_msg = (
        f"Filtered {len(matched_cells)} spatial parcels matching criteria: "
        f"LULC = {interpretation['lulc_filter']}, "
        f"Predicted Risk = {', '.join(risk_targets) if risk_targets else 'Any'}, "
        f"Distance to Major Roads < {dist_max} km." if dist_max else "Road Distance = Unrestricted."
    )

    return {
        "query": req.query,
        "interpretation": interpretation,
        "explanation": explanation_msg,
        "matched_count": len(matched_cells),
        "matched_cells": matched_cells
    }
