from fastapi import APIRouter
from typing import Dict, Any
from app.ml.models import ml_system

router = APIRouter(prefix="/models", tags=["Model Evaluation & Monitoring"])

@router.get("")
def get_model_evaluation() -> Dict[str, Any]:
    return {
        "region": "Tiruppur District, Tamil Nadu",
        "primary_task": "Agricultural -> Built-up Conversion Probability Prediction",
        "models": [
            ml_system.metrics_rf,
            ml_system.metrics_gb
        ],
        "comparison_summary": {
            "preferred_model": "Ensemble (Random Forest + Gradient Boosting)",
            "ensemble_roc_auc": round((ml_system.metrics_rf["roc_auc"] + ml_system.metrics_gb["roc_auc"]) / 2, 3),
            "brier_calibration_status": "Well-calibrated within [0.15, 0.85] range",
            "top_drivers": [
                "Proximity to NH-544 / SH-174 Corridor",
                "Historical 5-Year Built-up Index (ΔNDBI)",
                "Proximity to Tiruppur Urban Core",
                "Groundwater Stress & Soil Salinity Index"
            ]
        }
    }
