import pytest
import numpy as np
from httpx import AsyncClient
from jose import jwt
from app.core.config import settings
from app.ai.anpr_engine import anpr_engine
from app.ai.speed_engine import speed_estimator
from app.ai.behavior_engine import behavior_engine
from app.ai.face_engine import face_engine

@pytest.mark.asyncio
async def test_incidents_stats_summary_not_shadowed(client: AsyncClient, auth_headers: dict):
    """Confirm /api/incidents/stats/summary returns stats, not shadowed by /{incident_id}."""
    response = await client.get("/api/incidents/stats/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "active" in data
    assert "resolved" in data
    assert data["total"] == 45
    # Must NOT return an incident with id="stats"
    assert "location" not in data

@pytest.mark.asyncio
async def test_alerts_stats_summary_not_shadowed(client: AsyncClient, auth_headers: dict):
    """Confirm /api/alerts/stats/summary returns stats, not shadowed by /{alert_id}."""
    response = await client.get("/api/alerts/stats/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "critical" in data
    assert "high" in data
    assert data["total"] == 120
    # Must NOT return an alert with id="stats"
    assert "camera_id" not in data

@pytest.mark.asyncio
async def test_alerts_and_incidents_require_auth(client: AsyncClient):
    """Confirm alerts and incidents require valid authentication token."""
    res_alerts = await client.get("/api/alerts")
    assert res_alerts.status_code == 401

    res_incidents = await client.get("/api/incidents")
    assert res_incidents.status_code == 401

@pytest.mark.asyncio
async def test_invalid_jwt_sub_returns_401_not_500(client: AsyncClient):
    """Confirm non-integer or malformed sub returns 401 instead of crashing with 500."""
    invalid_token = jwt.encode({"sub": "not_an_int"}, settings.SECRET_KEY, algorithm="HS256")
    headers = {"Authorization": f"Bearer {invalid_token}"}
    response = await client.get("/api/cameras", headers=headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

@pytest.mark.asyncio
async def test_null_jwt_sub_returns_401(client: AsyncClient):
    """Confirm missing sub claim returns 401 Unauthorized."""
    token_no_sub = jwt.encode({"user": "admin"}, settings.SECRET_KEY, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token_no_sub}"}
    response = await client.get("/api/cameras", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_evidence_path_traversal_blocked(client: AsyncClient, auth_headers: dict):
    """Confirm path traversal sequences in evidence snapshot endpoint are blocked."""
    response = await client.get("/api/evidence/snapshot/..%2F..%2F..%2Fetc%2Fpasswd", headers=auth_headers)
    assert response.status_code in [400, 404]

def test_anpr_engine_handles_string_track_id():
    """Confirm ANPREngine handles string track IDs without TypeError or ValueError."""
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    box = (100, 100, 300, 300)
    result = anpr_engine.recognize_plate(dummy_frame, box, "TRK-001", "car")
    assert "plate_number" in result
    assert result["vehicle_type"] == "CAR"

def test_speed_estimator_handles_string_track_id():
    """Confirm VehicleSpeedEstimator handles string track IDs without crash."""
    res1 = speed_estimator.estimate_speed("TRK-ALPHA", (100, 100), 1.0)
    assert "speed_kmh" in res1
    assert "is_overspeeding" in res1

def test_behavior_engine_mixed_type_ids():
    """Confirm behavior engine generates fight alert keys without mixed int/str TypeError."""
    res, alerts = behavior_engine.update_and_analyze(
        current_time=100.0,
        detected_persons=[
            {"track_id": 1, "bbox": (100, 100, 150, 200), "conf": 0.95},
            {"track_id": "TRK-2", "bbox": (110, 100, 160, 200), "conf": 0.95}
        ]
    )
    assert isinstance(res, dict)
    assert isinstance(alerts, list)

def test_face_engine_empty_frame_safety():
    """Confirm FaceRecognitionEngine safely handles None or empty frames without AttributeError."""
    res_none = face_engine.recognize_person_face(None, (0, 0, 100, 100))
    assert res_none["status"] == "UNKNOWN"

    empty_frame = np.zeros((0, 0, 3), dtype=np.uint8)
    res_empty = face_engine.recognize_person_face(empty_frame, (0, 0, 100, 100))
    assert res_empty["status"] == "UNKNOWN"
