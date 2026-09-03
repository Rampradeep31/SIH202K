"""
FastAPI REST API Endpoints for Taluk Intelligence, Comparison, Filtering, and Industry Suitability
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from app.data.taluk_data_service import taluk_service

router = APIRouter(prefix="/taluks", tags=["Taluk Intelligence"])

@router.get("")
def get_taluks(district: Optional[str] = Query(None, description="District name to filter taluks")) -> Dict[str, Any]:
    """
    Returns list of taluks for a district or all districts.
    """
    if district:
        taluks = taluk_service.get_taluks_for_district(district)
        if not taluks:
            taluks = [f"{district} North / West", f"{district} South / East"]
        return {
            "district": district,
            "total_taluks": len(taluks),
            "taluks": taluks
        }
    return {
        "districts_count": len(taluk_service.district_taluk_map),
        "district_taluk_map": taluk_service.district_taluk_map
    }

@router.get("/geojson")
def get_taluks_geojson(district: Optional[str] = Query(None, description="District name to filter GeoJSON polygons")) -> Dict[str, Any]:
    """
    Returns authentic GeoJSON boundaries for Taluks from tamil_nadu_taluks.geojson.
    """
    return taluk_service.get_taluks_geojson(district)

@router.get("/intelligence")
def get_taluk_intelligence(
    district: str = Query(..., description="District name (e.g. Tiruppur, Coimbatore, Chennai)"),
    taluk: str = Query(..., description="Taluk name (e.g. Palladam, Avinashi, Tiruppur North)")
) -> Dict[str, Any]:
    """
    Returns authentic Taluk Intelligence metrics grounded in Sentinel-2 STAC, Cadastral parcels, and Census 2011.
    """
    return taluk_service.get_taluk_intelligence(district, taluk)

@router.get("/compare")
def get_taluk_comparison(
    district: str = Query(..., description="District name to compare all taluks within")
) -> Dict[str, Any]:
    """
    Returns side-by-side comparative analysis of all taluks inside the selected district with district averages and rankings.
    """
    return taluk_service.get_district_taluk_comparison(district)

@router.get("/filter/high-rain-agri")
def filter_high_rain_high_agri(
    district: Optional[str] = Query(None, description="Optional district filter")
) -> Dict[str, Any]:
    """
    Analytical filter identifying Taluks with High Rainfall / Moisture + High Agricultural Land Cover.
    """
    return taluk_service.filter_high_rain_high_agri(district)

@router.get("/industry-suitability")
def get_industry_suitability(
    district: str = Query(..., description="District name"),
    taluk: str = Query(..., description="Taluk name"),
    industry: str = Query("textile", description="Industry type: textile, food, warehousing, renewable, electronics")
) -> Dict[str, Any]:
    """
    Computes Multi-Criteria Industry Suitability score (0-100), positive factors, constraints, and alternative taluk ranking.
    """
    return taluk_service.calculate_industry_suitability(district, taluk, industry)
