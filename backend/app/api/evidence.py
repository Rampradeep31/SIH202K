from fastapi import APIRouter
from typing import Dict, Any
from app.ml.models import ml_system

router = APIRouter(prefix="/evidence", tags=["Evidence Chain & Provenance"])

# A generic /evidence/{evidence_id} stub used to live here, returning
# identical hardcoded provenance data for any ID (dead code — never called
# from the frontend, and would have looked fabricated to anyone testing it
# directly). Removed rather than half-wired, per the audit recommendation:
# a fake-but-plausible endpoint is worse than no endpoint on a platform
# whose whole differentiator is honest data provenance.

@router.get("/chain/{cell_id}")
def get_evidence_chain_for_cell(cell_id: str) -> Dict[str, Any]:
    cell_info = ml_system.get_cell_explanation(cell_id)
    return cell_info
