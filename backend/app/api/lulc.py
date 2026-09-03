from fastapi import APIRouter
from typing import Dict, Any
from app.data.tamilnadu_data import TIRUPPUR_PARCELS

router = APIRouter(prefix="/lulc", tags=["Land Use Land Cover"])

@router.get("")
def get_lulc_summary() -> Dict[str, Any]:
    # Calculate totals for 2018 vs 2023
    summary_2018 = {}
    summary_2023 = {}
    total_area = sum(p["area_ha"] for p in TIRUPPUR_PARCELS)
    
    for p in TIRUPPUR_PARCELS:
        c18 = p["lulc_2018"]
        c23 = p["lulc_2023"]
        summary_2018[c18] = summary_2018.get(c18, 0) + p["area_ha"]
        summary_2023[c23] = summary_2023.get(c23, 0) + p["area_ha"]

    classes = sorted(list(set(list(summary_2018.keys()) + list(summary_2023.keys()))))
    comparison = []
    for c in classes:
        a18 = round(summary_2018.get(c, 0), 1)
        a23 = round(summary_2023.get(c, 0), 1)
        delta_ha = round(a23 - a18, 1)
        delta_pct = round((delta_ha / a18 * 100) if a18 > 0 else 0, 1)
        comparison.append({
            "lulc_class": c,
            "area_2018_ha": a18,
            "pct_2018": round(a18 / total_area * 100, 1),
            "area_2023_ha": a23,
            "pct_2023": round(a23 / total_area * 100, 1),
            "net_change_ha": delta_ha,
            "net_change_pct": delta_pct
        })
        
    return {
        "region": "Tiruppur District, Tamil Nadu",
        "sample_analyzed_area_ha": round(total_area, 1),
        "sensor": "Sentinel-2 Multi-Spectral (10m) + Bhuvan LULC validation",
        "comparison_periods": ["2018 Baseline", "2023 Current"],
        "comparison": comparison
    }

@router.get("/change")
def get_lulc_transition_matrix() -> Dict[str, Any]:
    # Transition matrix
    matrix = {}
    for p in TIRUPPUR_PARCELS:
        from_c = p["lulc_2018"]
        to_c = p["lulc_2023"]
        if from_c not in matrix:
            matrix[from_c] = {}
        matrix[from_c][to_c] = round(matrix[from_c].get(to_c, 0) + p["area_ha"], 1)

    classes = ["Agriculture", "Built-up", "Waterbody", "Barren/Scrub"]
    formatted_matrix = []
    for fc in classes:
        row = {"from_class": fc}
        for tc in classes:
            row[tc] = matrix.get(fc, {}).get(tc, 0.0)
        formatted_matrix.append(row)

    # Calculate key conversion highlight: Agri -> Built-up
    agri_to_built = matrix.get("Agriculture", {}).get("Built-up", 0.0)
    total_agri_18 = sum(matrix.get("Agriculture", {}).values())

    return {
        "matrix": formatted_matrix,
        "classes": classes,
        "key_transitions": [
            {
                "transition": "Agriculture -> Built-up",
                "area_ha": agri_to_built,
                "pct_of_original_agri": round(agri_to_built / total_agri_18 * 100, 1) if total_agri_18 > 0 else 0,
                "hotspots": ["Avinashi NH-544 Bypass", "Tiruppur North Peri-urban", "Palladam Textile Corridor"],
                "drivers": ["Textile auxiliary units", "Logistics expansion", "Groundwater salinity push"]
            },
            {
                "transition": "Agriculture -> Agriculture (Retained)",
                "area_ha": matrix.get("Agriculture", {}).get("Agriculture", 0.0),
                "pct_of_original_agri": round(matrix.get("Agriculture", {}).get("Agriculture", 0.0) / total_agri_18 * 100, 1) if total_agri_18 > 0 else 0,
                "hotspots": ["Dharapuram PAP Canal Belt", "Udumalaipettai Southern Tracts"],
                "drivers": ["Perennial canal irrigation", "Favorable soil depth"]
            }
        ]
    }
