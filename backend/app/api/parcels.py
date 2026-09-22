"""
FastAPI REST API Endpoints for TNGIS Land Parcel Intelligence, Survey Boundaries & Cadastral Analytics
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from app.data.parcel_data_service import parcel_service

router = APIRouter(prefix="/parcels", tags=["Land Parcel Intelligence"])

@router.get("")
def get_parcels(
    district: Optional[str] = Query(None, description="Filter parcels by district name (e.g. Thiruvallur, Tiruppur)"),
    taluk: Optional[str] = Query(None, description="Filter parcels by taluk name (e.g. Gummidipoondi, Palladam)"),
    village: Optional[str] = Query(None, description="Filter parcels by village name"),
    limit: int = Query(400, description="Max number of parcels to return")
) -> Dict[str, Any]:
    """
    Returns authentic GeoJSON FeatureCollection of Cadastral Land Parcels.
    """
    return parcel_service.get_parcels_geojson(district, taluk, village, limit)

@router.get("/intelligence")
def get_parcel_intelligence(
    survey_no: str = Query(..., description="Survey Number (e.g. TN-THI-000001 or 42/1A)"),
    district: Optional[str] = Query(None, description="District name"),
    taluk: Optional[str] = Query(None, description="Taluk name"),
    village: Optional[str] = Query(None, description="Village name")
) -> Dict[str, Any]:
    """
    Returns complete 9-section structured Parcel Intelligence with empirical provenance.
    Strictly adheres to official government datasets with zero hallucinated figures.
    """
    return parcel_service.get_parcel_intelligence(survey_no, district, taluk, village)

@router.get("/search")
def search_parcels(
    q: str = Query(..., description="Search query: Survey Number or Parcel ID"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    taluk: Optional[str] = Query(None, description="Optional taluk filter")
) -> Dict[str, Any]:
    """
    Fast search for parcels by survey number, returning centroid coordinates and bounding geometry for immediate map zoom & highlight.
    """
    return parcel_service.search_parcels(q, district, taluk)
