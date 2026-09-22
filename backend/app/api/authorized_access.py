"""
FastAPI REST API Endpoints for Authorized Land & Property Access in TN-LGIP
"""

from fastapi import APIRouter, Query, Depends, Request
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.data.authorized_access_service import authorized_service
from app.core.rbac import get_current_role

router = APIRouter(prefix="/authorized", tags=["Authorized Land & Property Access"])

class StampDutyRequest(BaseModel):
    guideline_value_inr: float = Field(..., description="Guideline value in INR")
    consideration_value_inr: Optional[float] = Field(None, description="Actual consideration or market value in INR")
    property_type: Optional[str] = Field("Agricultural", description="Property category")

class AuditLogRequest(BaseModel):
    survey_no: str
    district: str
    taluk: str
    village: str
    access_type: str
    data_source: str
    status: str
    reason: str

@router.get("/status")
def get_authorization_status(
    role: str = Query("Public User", description="User role to verify clearance (e.g. Policymaker, Researcher, Government Analyst, Public User)")
) -> Dict[str, Any]:
    """
    Returns role-based authorization clearance and permitted scopes.
    """
    return authorized_service.check_authorization(role)

@router.get("/land-records")
def get_authorized_land_record(
    request: Request,
    survey_no: str = Query(..., description="Survey Number (e.g. 42 or 42/1A)"),
    district: Optional[str] = Query(None, description="District name"),
    taluk: Optional[str] = Query(None, description="Taluk name"),
    village: Optional[str] = Query(None, description="Village name"),
    role: str = Depends(get_current_role)
) -> Dict[str, Any]:
    """
    Returns comprehensive authorized land record details:
    Patta, Chitta, FMB boundaries, Guideline values, Stamp duty calculation, Land use zoning,
    Soil type, Aquifer zone, CRZ status, Proposed road widening, Encumbrance summary, and RERA info.

    Clearance tier is derived from the same X-User-Role header every other
    endpoint trusts (via get_current_role) — previously this accepted an
    arbitrary `role` query parameter, so any caller could pass
    `?role=Policymaker` and self-grant full clearance over masked fields
    (pattadhar names, encumbrance summaries). Still not cryptographically
    secure (no login/session), but now at least consistent with the rest
    of this prototype's RBAC model instead of a strictly weaker bypass.
    """
    return authorized_service.get_authorized_land_record(
        survey_no=survey_no,
        district=district,
        taluk=taluk,
        village=village,
        user_role=role,
        ip_address=request.client.host if request.client else "unknown"
    )

@router.post("/stamp-duty-calc")
def calculate_stamp_duty(request: StampDutyRequest) -> Dict[str, Any]:
    """
    Calculates statutory Stamp Duty (7%) and Registration Fee (4%) as per Tamil Nadu Registration schedule.
    """
    return authorized_service.calculate_stamp_duty(
        guideline_value_inr=request.guideline_value_inr,
        consideration_value_inr=request.consideration_value_inr,
        property_type=request.property_type or "Agricultural"
    )

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, description="Max number of audit log entries to return")
) -> Dict[str, Any]:
    """
    Returns live compliance audit logs of all authorized access queries.
    """
    logs = authorized_service.get_audit_logs(limit)
    return {
        "total_records": len(logs),
        "audit_logs": logs
    }

@router.post("/audit-log")
def record_audit_log(
    entry: AuditLogRequest,
    request: Request,
    role: str = Depends(get_current_role)
) -> Dict[str, Any]:
    """
    Records an access event into the audit trail.

    The role logged is always the caller's own verified X-User-Role header,
    never a client-declared value — the request body previously carried its
    own `user_role` field, so anyone could forge a compliance log entry
    claiming to be any role. An audit trail that can be self-authored isn't
    an audit trail.
    """
    client_ip = request.client.host if request.client else "unknown"
    return authorized_service.log_access(
        user_role=role,
        survey_no=entry.survey_no,
        district=entry.district,
        taluk=entry.taluk,
        village=entry.village,
        access_type=entry.access_type,
        data_source=entry.data_source,
        status=entry.status,
        reason=entry.reason,
        ip_address=client_ip
    )
