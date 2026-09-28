from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.core.security import get_current_user

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.get("")
async def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: Any = Depends(get_current_user)
):
    now_iso = datetime.now(timezone.utc).isoformat()
    incidents = [
        {
            "id": "INC-0001",
            "severity": "CRITICAL",
            "status": "Investigating",
            "location": "Sector 4, North Fence",
            "cameras": ["CAM-01", "CAM-02"],
            "risk_score": 87,
            "assigned_to": "operator01",
            "created_at": now_iso
        },
        {
            "id": "INC-0002",
            "severity": "HIGH",
            "status": "Resolved",
            "location": "Sector 2, West Gate",
            "cameras": ["CAM-05"],
            "risk_score": 65,
            "assigned_to": "admin",
            "created_at": now_iso
        }
    ]
    return incidents[skip : skip + limit]

@router.get("/stats/summary")
async def get_incident_stats(current_user: Any = Depends(get_current_user)):
    return {
        "total": 45,
        "active": 5,
        "resolved": 40,
        "avg_resolution_time": "2h 15m"
    }

@router.get("/{incident_id}")
async def get_incident(incident_id: str, current_user: Any = Depends(get_current_user)):
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "id": incident_id,
        "severity": "CRITICAL",
        "status": "Investigating",
        "location": "Sector 4, North Fence",
        "cameras": ["CAM-01", "CAM-02"],
        "risk_score": 87,
        "assigned_to": "operator01",
        "created_at": now_iso,
        "timeline": [
            {"timestamp": now_iso, "action": "Detected", "details": "Auto-detected by system"},
            {"timestamp": now_iso, "action": "Verified", "details": "Verified by user"},
            {"timestamp": now_iso, "action": "Assigned", "details": "Assigned to operator01"}
        ],
        "related_alerts": ["ALT-0001", "ALT-0003"],
        "evidence_links": ["EVD-001"],
        "notes": [
            {"user": "admin", "text": "Subject moving towards perimeter.", "timestamp": now_iso}
        ]
    }

@router.post("")
async def create_incident(data: Dict[str, Any], current_user: Any = Depends(get_current_user)):
    return {"id": "INC-0003", "status": "Created"}

@router.put("/{incident_id}")
async def update_incident(incident_id: str, data: Dict[str, Any], current_user: Any = Depends(get_current_user)):
    return {"id": incident_id, "status": "Updated"}

@router.post("/{incident_id}/assign")
async def assign_incident(incident_id: str, payload: Dict[str, str], current_user: Any = Depends(get_current_user)):
    return {"id": incident_id, "assigned_to": payload.get("user_id")}

@router.post("/{incident_id}/note")
async def add_note(incident_id: str, payload: Dict[str, str], current_user: Any = Depends(get_current_user)):
    return {"id": incident_id, "note": payload.get("text")}

@router.post("/{incident_id}/status")
async def update_status(incident_id: str, payload: Dict[str, str], current_user: Any = Depends(get_current_user)):
    return {"id": incident_id, "status": payload.get("status")}

@router.post("/{incident_id}/evidence")
async def link_evidence(incident_id: str, payload: Dict[str, str], current_user: Any = Depends(get_current_user)):
    return {"id": incident_id, "evidence_id": payload.get("evidence_id")}
