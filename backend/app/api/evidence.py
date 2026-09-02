from fastapi import APIRouter
from typing import Dict, Any
from app.data.tamilnadu_data import TIRUPPUR_PARCELS
from app.ml.models import ml_system

router = APIRouter(prefix="/evidence", tags=["Evidence Chain & Provenance"])

@router.get("/{evidence_id}")
def get_evidence_item(evidence_id: str) -> Dict[str, Any]:
    return {
        "evidence_id": evidence_id,
        "region": "Tiruppur District, Tamil Nadu",
        "authority": "Directorate of Town and Country Planning (DTCP) / NRSC Bhuvan",
        "provenance_chain": [
            {"step": "Raw Sentinel-2 Level-2A Tile (T43PGM)", "source": "ESA Copernicus Hub", "timestamp": "2023-04-15"},
            {"step": "Radiometric Calibration & Cloud Masking", "source": "Automated Pipeline", "timestamp": "2023-04-16"},
            {"step": "NDBI & NDVI Index Computation", "source": "Spatial Feature Extractor", "timestamp": "2023-04-16"},
            {"step": "Spatial Overlay with NH-544 Vector Buffer", "source": "TN Highways GIS Vector", "timestamp": "2023-04-17"},
            {"step": "ML Conversion Probability Inference", "source": "Ensemble Model v1.2", "timestamp": "2023-04-18"}
        ],
        "audit_hash": "sha256-a9b7c84e912f4510b001a7c3e59321",
        "data_license": "Government Open Data (OGD India)"
    }

@router.get("/chain/{cell_id}")
def get_evidence_chain_for_cell(cell_id: str) -> Dict[str, Any]:
    cell_info = ml_system.get_cell_explanation(cell_id)
    return cell_info
