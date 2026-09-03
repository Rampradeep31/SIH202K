"""
Collaborative Workspaces.

Genuinely shared, backend-persisted state (a JSON file on the server) so
that every viewer of this platform sees the same workspaces and notes —
unlike a localStorage-only implementation, which would be private to one
browser and not actually collaborative. This is a prototype-scope store
(a single JSON file, not a database with concurrent-write guarantees at
scale), appropriate for a hackathon demo, not a production multi-tenant
deployment.
"""

import os
import json
import threading
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from app.core.rbac import require_permission, get_current_role

router = APIRouter(prefix="/workspaces", tags=["Collaborative Workspaces"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STORE_DIR = os.path.join(BASE_DIR, "data_store")
STORE_PATH = os.path.join(STORE_DIR, "workspaces.json")
_lock = threading.Lock()


def _ensure_store():
    os.makedirs(STORE_DIR, exist_ok=True)
    if not os.path.exists(STORE_PATH):
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump({"workspaces": []}, f)


def _read_store() -> Dict[str, Any]:
    _ensure_store()
    with open(STORE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_store(data: Dict[str, Any]):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


class WorkspaceCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    focus_district: Optional[str] = None


class NoteCreateRequest(BaseModel):
    author_name: str
    text: str


@router.get("")
def list_workspaces() -> Dict[str, Any]:
    with _lock:
        data = _read_store()
    workspaces = data["workspaces"]
    return {
        "total_workspaces": len(workspaces),
        "workspaces": [
            {**w, "note_count": len(w.get("notes", []))}
            for w in workspaces
        ]
    }


@router.post("")
def create_workspace(
    req: WorkspaceCreateRequest,
    role: str = Depends(require_permission("create_workspace"))
) -> Dict[str, Any]:
    workspace = {
        "id": str(uuid.uuid4())[:8],
        "name": req.name,
        "description": req.description,
        "focus_district": req.focus_district,
        "created_by_role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notes": [],
    }
    with _lock:
        data = _read_store()
        data["workspaces"].append(workspace)
        _write_store(data)
    return workspace


@router.get("/{workspace_id}")
def get_workspace(workspace_id: str) -> Dict[str, Any]:
    with _lock:
        data = _read_store()
    workspace = next((w for w in data["workspaces"] if w["id"] == workspace_id), None)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/{workspace_id}/notes")
def add_note(
    workspace_id: str,
    req: NoteCreateRequest,
    role: str = Depends(require_permission("post_workspace_note"))
) -> Dict[str, Any]:
    with _lock:
        data = _read_store()
        workspace = next((w for w in data["workspaces"] if w["id"] == workspace_id), None)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        note = {
            "id": str(uuid.uuid4())[:8],
            "author_name": req.author_name,
            "author_role": role,
            "text": req.text,
            "posted_at": datetime.now(timezone.utc).isoformat(),
        }
        workspace["notes"].append(note)
        _write_store(data)
    return note
