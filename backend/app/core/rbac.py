"""
Role-Based Access Control.

Prototype-scope auth: there is no login/session system in this platform, so
identity is asserted by the client via the X-User-Role header (the frontend
sets this from the role selector in Settings). This is NOT cryptographically
secure — a malicious client could just send a different header — but it is
real access control in the sense that matters here: the backend actually
enforces the permission matrix below on every request, independent of
whatever the frontend UI shows or hides. A production deployment would swap
the header for a verified session/JWT claim without changing this module's
interface.
"""

from fastapi import Header, HTTPException
from typing import Optional

ROLES = ["Public User", "Researcher", "Government Analyst", "Policymaker"]

# Permission -> roles allowed to exercise it.
PERMISSIONS = {
    "run_scenario_simulation": {"Government Analyst", "Policymaker"},
    "generate_executive_report": {"Government Analyst", "Policymaker"},
    "export_raw_dataset": {"Researcher", "Government Analyst", "Policymaker"},
    "post_workspace_note": {"Researcher", "Government Analyst", "Policymaker"},
    "create_workspace": {"Researcher", "Government Analyst", "Policymaker"},
}


def get_current_role(x_user_role: Optional[str] = Header(default="Public User")) -> str:
    role = (x_user_role or "Public User").strip()
    return role if role in ROLES else "Public User"


def require_permission(permission: str):
    allowed_roles = PERMISSIONS.get(permission, set())

    def _dependency(role: str = Header(default="Public User", alias="X-User-Role")) -> str:
        resolved = role if role in ROLES else "Public User"
        if resolved not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Role '{resolved}' does not have permission to '{permission}'. "
                    f"Allowed roles: {sorted(allowed_roles)}"
                ),
            )
        return resolved

    return _dependency
