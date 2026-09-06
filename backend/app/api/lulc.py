from collections import defaultdict
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.data.tamilnadu_data import ALL_DISTRICT_PARCELS, TAMIL_NADU_DISTRICTS

router = APIRouter(prefix="/lulc", tags=["Land Use Land Cover"])

DISTRICT_INFO_BY_NAME = {d["name"]: d for d in TAMIL_NADU_DISTRICTS}


def _get_parcels_or_404(district: str):
    parcels = ALL_DISTRICT_PARCELS.get(district)
    if not parcels:
        available = sorted(ALL_DISTRICT_PARCELS.keys())
        raise HTTPException(
            status_code=404,
            detail=(
                f"No parcel-level LULC data for '{district}'. This is a real gap, not a bug: "
                f"either it's outside the cadastral dataset used (5 districts split off after that "
                f"dataset was built: Chengalpattu, Ranipet, Tirupathur, Kallakurichi, Tenkasi; plus "
                f"Mayiladuthurai, split in 2020), or the name doesn't match. "
                f"{len(available)} districts have data: {', '.join(available)}"
            )
        )
    return parcels


@router.get("")
def get_lulc_summary(district: str = Query("Tiruppur", description="District name, e.g. Erode, Chennai, Salem")) -> Dict[str, Any]:
    parcels = _get_parcels_or_404(district)

    summary_2018: Dict[str, float] = {}
    summary_2023: Dict[str, float] = {}
    total_area = sum(p["area_ha"] for p in parcels)

    for p in parcels:
        c18 = p["lulc_2018"]
        c23 = p["lulc_2023"]
        summary_2018[c18] = summary_2018.get(c18, 0) + p["area_ha"]
        summary_2023[c23] = summary_2023.get(c23, 0) + p["area_ha"]

    classes = sorted(set(list(summary_2018.keys()) + list(summary_2023.keys())))
    comparison = []
    for c in classes:
        a18 = round(summary_2018.get(c, 0), 1)
        a23 = round(summary_2023.get(c, 0), 1)
        delta_ha = round(a23 - a18, 1)
        delta_pct = round((delta_ha / a18 * 100) if a18 > 0 else 0, 1)
        comparison.append({
            "lulc_class": c,
            "area_2018_ha": a18,
            "pct_2018": round(a18 / total_area * 100, 1) if total_area else 0,
            "area_2023_ha": a23,
            "pct_2023": round(a23 / total_area * 100, 1) if total_area else 0,
            "net_change_ha": delta_ha,
            "net_change_pct": delta_pct
        })

    return {
        "region": f"{district} District, Tamil Nadu",
        "sample_analyzed_area_ha": round(total_area, 1),
        "sensor": (
            "Modeled conversion labels over real cadastral parcel geometry, real OSM highway/rail "
            "network, and real district HQ centroids — NOT a measured satellite classification. "
            "See scripts/tn_satellite_indices_pipeline.py for the real Sentinel-2 NDVI/NDBI data "
            "this platform does have (zonal statistics, not per-parcel LULC)."
        ),
        "data_source": "synthetic_model",
        "comparison_periods": ["2018 Baseline", "2023 Current"],
        "comparison": comparison
    }


@router.get("/change")
def get_lulc_transition_matrix(district: str = Query("Tiruppur", description="District name, e.g. Erode, Chennai, Salem")) -> Dict[str, Any]:
    parcels = _get_parcels_or_404(district)
    dist_info = DISTRICT_INFO_BY_NAME.get(district, {})

    matrix: Dict[str, Dict[str, float]] = {}
    for p in parcels:
        from_c = p["lulc_2018"]
        to_c = p["lulc_2023"]
        matrix.setdefault(from_c, {})
        matrix[from_c][to_c] = round(matrix[from_c].get(to_c, 0) + p["area_ha"], 1)

    classes = ["Agriculture", "Built-up", "Waterbody", "Barren/Scrub"]
    formatted_matrix = []
    for fc in classes:
        row = {"from_class": fc}
        for tc in classes:
            row[tc] = matrix.get(fc, {}).get(tc, 0.0)
        formatted_matrix.append(row)

    agri_to_built = matrix.get("Agriculture", {}).get("Built-up", 0.0)
    agri_retained = matrix.get("Agriculture", {}).get("Agriculture", 0.0)
    total_agri_18 = sum(matrix.get("Agriculture", {}).values())

    # Hotspots/drivers derived from this district's actual parcels and real
    # profile data, not copy-pasted Tiruppur-specific filler text (the
    # original version of this endpoint showed "Avinashi NH-544 Bypass" and
    # "Dharapuram PAP Canal Belt" for every district regardless of which one
    # was requested).
    converted_area_by_taluk: Dict[str, float] = defaultdict(float)
    retained_area_by_taluk: Dict[str, float] = defaultdict(float)
    for p in parcels:
        if p["converted_agri_to_built"]:
            converted_area_by_taluk[p["taluk"]] += p["area_ha"]
        elif p["lulc_2018"] == "Agriculture":
            retained_area_by_taluk[p["taluk"]] += p["area_ha"]

    top_converted_taluks = sorted(converted_area_by_taluk, key=converted_area_by_taluk.get, reverse=True)[:3]
    top_retained_taluks = sorted(retained_area_by_taluk, key=retained_area_by_taluk.get, reverse=True)[:2]
    district_desc = dist_info.get("description", "regional industrial and urban growth pressure")

    return {
        "region": f"{district} District, Tamil Nadu",
        "data_source": "synthetic_model",
        "matrix": formatted_matrix,
        "classes": classes,
        "key_transitions": [
            {
                "transition": "Agriculture -> Built-up",
                "area_ha": agri_to_built,
                "pct_of_original_agri": round(agri_to_built / total_agri_18 * 100, 1) if total_agri_18 > 0 else 0,
                "hotspots": top_converted_taluks or ["No modeled conversion hotspots in this sample"],
                "drivers": [district_desc]
            },
            {
                "transition": "Agriculture -> Agriculture (Retained)",
                "area_ha": agri_retained,
                "pct_of_original_agri": round(agri_retained / total_agri_18 * 100, 1) if total_agri_18 > 0 else 0,
                "hotspots": top_retained_taluks or ["No retained-agriculture parcels in this sample"],
                "drivers": ["Lower modeled proximity to highway/urban/rail conversion pressure"]
            }
        ]
    }


@router.get("/districts")
def list_lulc_districts() -> Dict[str, Any]:
    """Districts with parcel-level LULC data available, for the frontend's district selector."""
    return {
        "available_districts": sorted(ALL_DISTRICT_PARCELS.keys()),
        "total_available": len(ALL_DISTRICT_PARCELS),
        "total_districts": len(TAMIL_NADU_DISTRICTS),
        "missing": sorted(set(DISTRICT_INFO_BY_NAME.keys()) - set(ALL_DISTRICT_PARCELS.keys()))
    }
