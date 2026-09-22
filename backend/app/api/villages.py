"""
FastAPI REST API Endpoints for Authentic Tamil Nadu Villages (Local Government Directory - LGD)
"""

from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.data.parcel_data_service import parcel_service

router = APIRouter(prefix="/villages", tags=["Village Directory"])

@router.get("")
def get_villages(
    district: Optional[str] = Query(None, description="District name filter (e.g. Tiruppur, Coimbatore, Namakkal)"),
    taluk: Optional[str] = Query(None, description="Taluk / Mandal name filter (e.g. Palladam, Rasipuram)"),
    q: Optional[str] = Query(None, description="Keyword search in English or native Tamil name, village code, or pincode"),
    limit: int = Query(100, description="Max records to return")
) -> Dict[str, Any]:
    """
    Returns authentic Revenue Villages from the 15,179-village dataset with Village Codes, Mandal Codes, and Pincodes.
    """
    return parcel_service.get_villages(district, taluk, q, limit)
