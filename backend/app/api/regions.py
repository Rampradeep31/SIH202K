from fastapi import APIRouter
from typing import Dict, Any
from app.data.tamilnadu_data import TAMIL_NADU_DISTRICTS, TIRUPPUR_TALUKS

router = APIRouter(prefix="/regions", tags=["Regions"])

@router.get("")
def get_regions() -> Dict[str, Any]:
    return {
        "state": "Tamil Nadu",
        "total_districts": len(TAMIL_NADU_DISTRICTS),
        "pilot_district": "Tiruppur",
        "districts": TAMIL_NADU_DISTRICTS,
        "pilot_taluks": TIRUPPUR_TALUKS
    }

@router.get("/tiruppur")
def get_tiruppur_details() -> Dict[str, Any]:
    return {
        "district": "Tiruppur",
        "state": "Tamil Nadu",
        "total_area_ha": 518700,
        "taluks": TIRUPPUR_TALUKS,
        "key_corridors": ["NH-544 (Salem - Coimbatore)", "SH-174", "SH-19"],
        "river_basins": ["Noyyal River Basin (North)", "Amaravathi River Basin (South)"]
    }
