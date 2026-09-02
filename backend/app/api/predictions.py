from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.ml.models import ml_system

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.get("")
def get_predictions(
    taluk: Optional[str] = Query(None, description="Filter by taluk"),
    risk: Optional[str] = Query(None, description="Filter by risk category (e.g. High, Very High)")
) -> Dict[str, Any]:
    preds = ml_system.get_predictions(taluk=taluk, risk=risk)
    
    # Aggregate statistics
    total = len(preds)
    risk_counts = {}
    for p in preds:
        rc = p["risk_category"]
        risk_counts[rc] = risk_counts.get(rc, 0) + 1
        
    return {
        "region": "Tiruppur District, Tamil Nadu",
        "total_evaluated_cells": total,
        "risk_breakdown": risk_counts,
        "model_in_use": "Ensemble (Random Forest v1.2 + Gradient Boosting v1.2)",
        "spatial_validation_auc": ml_system.metrics_rf["roc_auc"],
        "predictions": preds
    }

@router.get("/{cell_id}")
def get_cell_prediction_details(cell_id: str) -> Dict[str, Any]:
    return ml_system.get_cell_explanation(cell_id)
