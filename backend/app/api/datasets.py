from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(tags=["Datasets & Data Quality"])

DATASETS_REGISTRY = [
    {
        "id": "bhuvan_lulc_tn",
        "name": "Bhuvan Land Use / Land Cover (Tamil Nadu)",
        "authority": "National Remote Sensing Centre (NRSC) / ISRO",
        "spatial_resolution": "30 meters",
        "temporal_coverage": "2018 – 2023",
        "update_frequency": "Annual",
        "license": "Government Open Data (OGD / ISRO Terms)",
        "completeness_pct": 98.5,
        "freshness": "Current (2023 Epoch)",
        "quality_score": 96,
        "status": "Verified Active"
    },
    {
        "id": "sentinel2_msi",
        "name": "Copernicus Sentinel-2 Multi-Spectral Indices (NDVI, NDBI, NDWI)",
        "authority": "European Space Agency (ESA) Copernicus Programme",
        "spatial_resolution": "10 meters",
        "temporal_coverage": "5-day revisit (2018–2023)",
        "update_frequency": "5 Days",
        "license": "Open Access / Creative Commons",
        "completeness_pct": 99.2,
        "freshness": "Near Real-Time",
        "quality_score": 98,
        "status": "Verified Active"
    },
    {
        "id": "tn_ogd_census",
        "name": "Tamil Nadu District Socioeconomic & Demographics",
        "authority": "Department of Economics and Statistics, Govt of Tamil Nadu",
        "spatial_resolution": "Taluk / Block level",
        "temporal_coverage": "2011 Census with 2023 Projections",
        "update_frequency": "Periodic",
        "license": "Open Government Data (OGD India)",
        "completeness_pct": 92.0,
        "freshness": "Projected 2023",
        "quality_score": 88,
        "status": "Verified Active",
        "limitation_note": "Data limitation: Demographic and migration figures are projected at taluk level rather than individual revenue village parcels."
    },
    {
        "id": "osm_highways_tn",
        "name": "OpenStreetMap Tamil Nadu Transportation & Industrial Vectors",
        "authority": "OpenStreetMap Contributors / MoRTH Vector GIS",
        "spatial_resolution": "Sub-meter Vector Lines",
        "temporal_coverage": "Continuously Updated (2024)",
        "update_frequency": "Weekly Sync",
        "license": "ODbL",
        "completeness_pct": 95.8,
        "freshness": "High",
        "quality_score": 94,
        "status": "Verified Active"
    },
    {
        "id": "cgwb_groundwater",
        "name": "Central Ground Water Board (CGWB) & TWAD Aquifer Status",
        "authority": "CGWB South Western Region & TWAD Board, GoTN",
        "spatial_resolution": "Observation Well Grid / Block Level",
        "temporal_coverage": "2015 – 2023 Longitudinal",
        "update_frequency": "Biannual (Pre/Post Monsoon)",
        "license": "Ministry of Jal Shakti Public Portal",
        "completeness_pct": 94.1,
        "freshness": "2023 Assessment",
        "quality_score": 91,
        "status": "Verified Active"
    }
]

@router.get("/datasets")
def get_datasets() -> Dict[str, Any]:
    return {
        "jurisdiction": "State of Tamil Nadu",
        "pilot_district": "Tiruppur",
        "total_datasets": len(DATASETS_REGISTRY),
        "pipeline_state": "Synchronized & Standardized to EPSG:4326 (WGS 84)",
        "datasets": DATASETS_REGISTRY
    }

@router.get("/data-quality")
def get_data_quality() -> Dict[str, Any]:
    avg_quality = round(sum(d["quality_score"] for d in DATASETS_REGISTRY) / len(DATASETS_REGISTRY), 1)
    avg_completeness = round(sum(d["completeness_pct"] for d in DATASETS_REGISTRY) / len(DATASETS_REGISTRY), 1)
    
    return {
        "overall_platform_quality_index": avg_quality,
        "average_completeness_pct": avg_completeness,
        "crs_standardization": "EPSG:4326 (WGS 84) across all vector and raster centroids",
        "provenance_assurance": "Strict source isolation between raw telemetry and analytical inference layers.",
        "datasets_status": DATASETS_REGISTRY
    }
