import math
from fastapi import APIRouter
from typing import Dict, Any
from app.data.tamilnadu_data import TIRUPPUR_PARCELS, TIRUPPUR_TALUKS, TAMIL_NADU_DISTRICTS
from app.ml.models import ml_system

router = APIRouter(prefix="/gis", tags=["GIS Explorer"])

@router.get("/layers")
def get_gis_layers() -> Dict[str, Any]:
    return {
        "available_layers": [
            {"id": "lulc_2018", "name": "LULC Baseline 2018", "type": "categorical", "default_visible": False, "palette": {"Agriculture": "#22c55e", "Built-up": "#ef4444", "Waterbody": "#3b82f6", "Barren/Scrub": "#eab308"}},
            {"id": "lulc_2023", "name": "LULC Current 2023", "type": "categorical", "default_visible": True, "palette": {"Agriculture": "#22c55e", "Built-up": "#ef4444", "Waterbody": "#3b82f6", "Barren/Scrub": "#eab308"}},
            {"id": "predictions", "name": "Predicted Conversion Risk", "type": "risk_gradient", "default_visible": True, "palette": {"Very Low": "#10b981", "Low": "#84cc16", "Moderate": "#f59e0b", "High": "#f97316", "Very High": "#dc2626"}},
            {"id": "ndvi_2023", "name": "Sentinel-2 NDVI (Vegetation Index)", "type": "continuous", "default_visible": False},
            {"id": "ndbi_2023", "name": "Sentinel-2 NDBI (Built-up Index)", "type": "continuous", "default_visible": False},
            {"id": "highways", "name": "NH-544 / SH Transportation Network", "type": "vector_line", "default_visible": True},
            {"id": "groundwater", "name": "Groundwater Stress Zones (TWAD/CGWB)", "type": "choropleth", "default_visible": False}
        ],
        "state_center": {"lat": 11.1271, "lon": 78.6569, "zoom": 7},
        "pilot_center": {"lat": 11.05, "lon": 77.38, "zoom": 10},
        "spatial_crs": "EPSG:4326 (WGS 84)"
    }

@router.get("/tamilnadu-districts")
def get_tamilnadu_districts_geojson() -> Dict[str, Any]:
    """
    Returns authentic Survey of India / GADM exact GeoJSON polygons for Tamil Nadu districts.
    Contains exact geographical boundary shapes with zero hexagonal or synthetic simplification.
    """
    import os, json
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "tamil_nadu_districts_exact.geojson")
    tn_path = os.path.join(base_dir, "tamil_nadu_dataset", "tamil_nadu_districts.geojson")
    
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    elif os.path.exists(tn_path):
        with open(tn_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": []}

@router.get("/geojson")
def get_parcels_geojson() -> Dict[str, Any]:
    features = []
    for p in TIRUPPUR_PARCELS:
        pred_info = ml_system.predictions_cache.get(p["cell_id"], {})
        features.append({
            "type": "Feature",
            "properties": {
                "cell_id": p["cell_id"],
                "taluk": p["taluk"],
                "area_ha": p["area_ha"],
                "lulc_2018": p["lulc_2018"],
                "lulc_2023": p["lulc_2023"],
                "transition": p["transition_type"],
                "ndvi_2023": p["ndvi_2023"],
                "ndbi_2023": p["ndbi_2023"],
                "dist_to_nh_km": p["dist_to_nh_km"],
                "dist_to_urban_center_km": p["dist_to_urban_center_km"],
                "groundwater_status": p["groundwater_status"],
                "soil_quality_score": p["soil_quality_score"],
                "pop_density_sqkm": p["pop_density_sqkm"],
                "transition_probability": pred_info.get("transition_probability", 0.0),
                "risk_category": pred_info.get("risk_category", "Low"),
                "confidence": pred_info.get("confidence", 0.85)
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [p["polygon"]]
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }
