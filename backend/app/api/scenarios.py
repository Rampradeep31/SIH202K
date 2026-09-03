from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.scenarios.engine import scenario_engine

router = APIRouter(prefix="/scenarios", tags=["Policy Scenarios"])

class SimulationRequest(BaseModel):
    weights: Optional[Dict[str, float]] = None

@router.get("")
def list_scenarios() -> Dict[str, Any]:
    scenarios = scenario_engine.simulate_all()
    return {
        "region": "Tiruppur District, Tamil Nadu",
        "total_scenarios": len(scenarios),
        "default_weights": scenario_engine.default_weights,
        "scenarios": scenarios
    }

@router.post("/simulate")
def simulate_scenarios(req: SimulationRequest) -> Dict[str, Any]:
    scenarios = scenario_engine.simulate_all(req.weights)
    return {
        "status": "success",
        "custom_weights_applied": req.weights,
        "scenarios": scenarios
    }
