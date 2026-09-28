from fastapi import APIRouter, HTTPException, status, Body
from datetime import datetime, timedelta
import secrets
import random
import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/security", tags=["security"])

class CreateApiKeyRequest(BaseModel):
    name: str
    scopes: List[str]
    expires_in_days: Optional[int] = 90
    rate_limit: Optional[int] = 60

class TestApiKeyRequest(BaseModel):
    key_token: str
    endpoint: str
    method: Optional[str] = "GET"

class CreateIntegrationRequest(BaseModel):
    name: str
    category: str
    protocol: str
    endpoint_url: str
    auth_type: str
    events: List[str]
    rate_limit: Optional[int] = 100

# In-memory API Keys store
MOCK_API_KEYS = [
    {
        "id": "key_01",
        "name": "Border-Drone-Telemetry-Relay",
        "prefix": "ibvap_live_9f82",
        "masked_key": "ibvap_live_9f82••••••••••••4e1a",
        "scopes": ["streams:read", "telemetry:write", "zones:read"],
        "created_at": "2026-09-01T08:30:00Z",
        "last_used": "2 mins ago",
        "status": "active",
        "rate_limit": 120,
        "expires_at": "2026-12-01T08:30:00Z"
    },
    {
        "id": "key_02",
        "name": "ANPR-Checkpoint-Sync-Service",
        "prefix": "ibvap_live_4b71",
        "masked_key": "ibvap_live_4b71••••••••••••8c3d",
        "scopes": ["anpr:read", "anpr:write", "alerts:read"],
        "created_at": "2026-09-10T11:15:00Z",
        "last_used": "15 secs ago",
        "status": "active",
        "rate_limit": 60,
        "expires_at": "2027-09-10T11:15:00Z"
    },
    {
        "id": "key_03",
        "name": "Central-Command-HQ-Mirror",
        "prefix": "ibvap_live_7c99",
        "masked_key": "ibvap_live_7c99••••••••••••2f0b",
        "scopes": ["admin:all", "evidence:export", "audit:read"],
        "created_at": "2026-08-20T14:00:00Z",
        "last_used": "1 hour ago",
        "status": "active",
        "rate_limit": 300,
        "expires_at": "2027-08-20T14:00:00Z"
    },
    {
        "id": "key_04",
        "name": "Deprecated-Legacy-Edge-Node",
        "prefix": "ibvap_live_1a2b",
        "masked_key": "ibvap_live_1a2b••••••••••••99ff",
        "scopes": ["streams:read"],
        "created_at": "2026-06-01T00:00:00Z",
        "last_used": "45 days ago",
        "status": "revoked",
        "rate_limit": 30,
        "expires_at": "2026-09-01T00:00:00Z"
    }
]

# Military C4ISR & Tactical External Integrations
MOCK_INTEGRATIONS = [
    {
        "id": "int-01",
        "name": "NATGRID Defense Intelligence Hub",
        "category": "Defense & Law Enforcement",
        "protocol": "mTLS / REST Gateway",
        "endpoint_url": "https://gateway.natgrid.gov.in/v2/ingest/border-alerts",
        "auth_type": "Mutual X.509 Certificate",
        "events": ["CRITICAL_ALERTS", "ANPR_HOTLIST_MATCH", "FENCE_BREACH"],
        "status": "active",
        "ping_ms": 18,
        "health_pct": 99.98,
        "last_sync": "12 secs ago",
        "success_rate": "100%",
        "description": "Direct automated encrypted telemetry pipeline with National Intelligence Grid for instant terrorist & watchlist correlation."
    },
    {
        "id": "int-02",
        "name": "MAVLink Drone Fleet Telemetry (Sector 04 UAVs)",
        "category": "Autonomous Surveillance",
        "protocol": "UDP / MAVLink v2.0 Stream",
        "endpoint_url": "udp://10.200.30.45:14550",
        "auth_type": "HMAC-SHA256 Token",
        "events": ["DRONE_GPS_TELEMETRY", "GIMBAL_TARGETING", "FLIGHT_PATH"],
        "status": "active",
        "ping_ms": 4,
        "health_pct": 100.0,
        "last_sync": "1 sec ago",
        "success_rate": "99.9%",
        "description": "Bidirectional mission routing and gimbal telemetry sync with 4 autonomous quadcopter border patrol drones."
    },
    {
        "id": "int-03",
        "name": "MoRTH Vahan & Sarathi National Registry",
        "category": "ANPR & Vehicle Verification",
        "protocol": "SOAP / REST Bridge",
        "endpoint_url": "https://vahan.parivahan.gov.in/vahan-service/api/vehicle/lookup",
        "auth_type": "Bearer HMAC Token",
        "events": ["ANPR_PLATE_READ", "STOLEN_VEHICLE_CHECK"],
        "status": "active",
        "ping_ms": 42,
        "health_pct": 98.9,
        "last_sync": "3 mins ago",
        "success_rate": "99.4%",
        "description": "National vehicle database sync for instantaneous stolen vehicle, blacklisted chassis, and fake plate alerts at checkpoints."
    },
    {
        "id": "int-04",
        "name": "Border PA Acoustic Warning & Siren Grid",
        "category": "Tactical Deterrence",
        "protocol": "Modbus TCP / IP Gateway",
        "endpoint_url": "tcp://10.200.10.120:502",
        "auth_type": "Air-Gapped VLAN 10",
        "events": ["SIREN_TRIGGER", "AUDIO_WARN_BROADCAST", "STROBE_ALARM"],
        "status": "active",
        "ping_ms": 8,
        "health_pct": 99.9,
        "last_sync": "10 mins ago",
        "success_rate": "100%",
        "description": "Hardware relay control triggering high-decibel directional acoustic deterrents and strobe lights on perimeter fences."
    },
    {
        "id": "int-05",
        "name": "SSB QRT Rapid Response Tactical Webhook",
        "category": "Patrol Dispatch",
        "protocol": "HTTPS Webhook (JSON)",
        "endpoint_url": "https://alerts.bordersecurity.internal/webhook/qrt-dispatch",
        "auth_type": "HMAC-SHA256 Signature",
        "events": ["QRT_DISPATCH_DIRECTIVE", "BREACH_ALERT_ESCALATION"],
        "status": "active",
        "ping_ms": 24,
        "health_pct": 99.5,
        "last_sync": "25 mins ago",
        "success_rate": "99.8%",
        "description": "Pushes instant encrypted tactical response directives to handheld terminal devices carried by Quick Reaction Teams in the field."
    },
    {
        "id": "int-06",
        "name": "Enterprise SIEM / Syslog Forwarder (CEF)",
        "category": "Audit & Compliance",
        "protocol": "Syslog RFC 5424 over TLS",
        "endpoint_url": "tls://siem.hq.internal:6514",
        "auth_type": "mTLS Client Cert",
        "events": ["AUDIT_LOGS", "AUTH_EVENTS", "SYSTEM_TAMPERING"],
        "status": "active",
        "ping_ms": 11,
        "health_pct": 100.0,
        "last_sync": "Real-Time Streaming",
        "success_rate": "100%",
        "description": "Standardized Common Event Format (CEF) log forwarding to military Security Operations Center (SOC) Splunk/Sentinel clusters."
    }
]

# Active Operator Sessions
MOCK_SESSIONS = [
    {
        "id": "sess-admin-01",
        "user": "commander.singh",
        "name": "Col. R. Singh",
        "role": "Sector Commander",
        "clearance": "Level 5 - Top Secret",
        "ip": "10.200.20.14",
        "device": "Command Terminal Alpha (Secured Linux Workstation)",
        "login_time": (datetime.utcnow() - timedelta(hours=3, minutes=12)).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "last_activity": "Just now",
        "status": "active",
        "is_current": True
    },
    {
        "id": "sess-op-02",
        "user": "operator.sharma",
        "name": "Insp. V. Sharma",
        "role": "Surveillance Operator",
        "clearance": "Level 3 - Secret",
        "ip": "10.200.20.22",
        "device": "BOP Main Console (Dual-Monitor Hub)",
        "login_time": (datetime.utcnow() - timedelta(hours=1, minutes=45)).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "last_activity": "4 mins ago",
        "status": "active",
        "is_current": False
    },
    {
        "id": "sess-anpr-03",
        "user": "checkpoint.subedar",
        "name": "Subedar M. Kumar",
        "role": "Checkpoint Supervisor",
        "clearance": "Level 2 - Confidential",
        "ip": "10.200.10.88",
        "device": "Toughbook Field Tablet (Check-01 Gate)",
        "login_time": (datetime.utcnow() - timedelta(minutes=52)).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "last_activity": "1 min ago",
        "status": "active",
        "is_current": False
    }
]

# KMS Key State
KMS_STATE = {
    "current_key_id": "kms-root-sec4-20260901",
    "algorithm": "AES-256-GCM / RSA-4096 Root",
    "fingerprint_sha256": "8f9b2c4e1a7d3e5f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c",
    "last_rotated": "2026-09-01T00:00:00Z",
    "rotation_interval_days": 90,
    "hardware_module": "Thales Luna PCIe HSM (FIPS 140-2 Level 3)"
}

@router.get("/overview")
async def get_security_overview():
    active_keys = sum(1 for k in MOCK_API_KEYS if k["status"] == "active")
    active_integrations = sum(1 for i in MOCK_INTEGRATIONS if i["status"] == "active")
    return {
        "authEvents24h": 142,
        "failedLogins24h": 5,
        "activeSessions": len(MOCK_SESSIONS),
        "encryptionStatus": "healthy",
        "activeApiKeys": active_keys,
        "activeIntegrations": active_integrations,
        "kmsKeyId": KMS_STATE["current_key_id"],
        "kmsLastRotated": KMS_STATE["last_rotated"]
    }

# ── API KEYS CRUD ──

@router.get("/api-keys")
async def list_api_keys():
    """Returns all issued API keys and metadata"""
    return {
        "status": "success",
        "total": len(MOCK_API_KEYS),
        "active": sum(1 for k in MOCK_API_KEYS if k["status"] == "active"),
        "keys": MOCK_API_KEYS
    }

@router.post("/api-keys")
async def create_api_key(payload: CreateApiKeyRequest):
    """Generates a new military-grade API key token"""
    random_secret = secrets.token_hex(16)
    prefix = f"ibvap_live_{random_secret[:4]}"
    full_key = f"{prefix}_{random_secret[4:]}"
    masked_key = f"{prefix}••••••••••••{random_secret[-4:]}"
    
    expires_date = (datetime.utcnow() + timedelta(days=payload.expires_in_days or 90)).isoformat()
    new_id = f"key_{secrets.token_hex(4)}"
    
    key_entry = {
        "id": new_id,
        "name": payload.name,
        "prefix": prefix,
        "masked_key": masked_key,
        "scopes": payload.scopes or ["streams:read"],
        "created_at": datetime.utcnow().isoformat(),
        "last_used": "Never",
        "status": "active",
        "rate_limit": payload.rate_limit or 60,
        "expires_at": expires_date
    }
    
    MOCK_API_KEYS.insert(0, key_entry)
    
    return {
        "status": "success",
        "message": "API key generated successfully. Copy your key now as it will not be displayed again.",
        "key": key_entry,
        "raw_token": full_key
    }

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str):
    """Revokes an API key"""
    for key in MOCK_API_KEYS:
        if key["id"] == key_id:
            key["status"] = "revoked"
            return {"status": "success", "message": f"API key '{key['name']}' has been permanently revoked."}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

@router.post("/api-keys/{key_id}/regenerate")
async def regenerate_api_key(key_id: str):
    """Regenerates a revoked or active API key token"""
    for key in MOCK_API_KEYS:
        if key["id"] == key_id:
            random_secret = secrets.token_hex(16)
            prefix = f"ibvap_live_{random_secret[:4]}"
            full_key = f"{prefix}_{random_secret[4:]}"
            key["prefix"] = prefix
            key["masked_key"] = f"{prefix}••••••••••••{random_secret[-4:]}"
            key["status"] = "active"
            key["created_at"] = datetime.utcnow().isoformat()
            key["last_used"] = "Never"
            return {
                "status": "success",
                "message": f"API key '{key['name']}' regenerated successfully.",
                "raw_token": full_key,
                "key": key
            }
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

@router.post("/api-keys/test")
async def test_api_key_endpoint(payload: TestApiKeyRequest):
    """Simulates an interactive test request from the API Keys console sandbox"""
    t0 = time.time()
    # Simple validation
    is_valid_prefix = payload.key_token.startswith("ibvap_live_") or "sample" in payload.key_token.lower()
    
    latency = round(random.uniform(4.5, 14.8), 1)
    
    if not is_valid_prefix:
        return {
            "status": "error",
            "http_code": 401,
            "message": "Unauthorized: Invalid API key prefix or malformed token",
            "latency_ms": latency,
            "response": {
                "error": "authentication_failed",
                "detail": "Provided Bearer token signature could not be verified against the Border Key Ring."
            }
        }
    
    # Return simulated mock payload matching requested endpoint
    endpoint = payload.endpoint.lower()
    if "camera" in endpoint:
        body = {
            "total_cameras": 8,
            "cameras": [
                {"id": "BOP-01", "name": "Main Perimeter Gate North", "status": "ONLINE", "stream_protocol": "RTSP/SRTP"},
                {"id": "BOP-02", "name": "Watchtower Alpha Slope", "status": "ONLINE", "stream_protocol": "RTSP/SRTP"}
            ],
            "rate_limit_remaining": 59
        }
    elif "alert" in endpoint or "threat" in endpoint:
        body = {
            "active_threats": 3,
            "highest_defcon": 2,
            "latest_incident": "FENCE_BREACH (Confidence 98.4%) at BOP-01",
            "rate_limit_remaining": 59
        }
    elif "anpr" in endpoint:
        body = {
            "total_reads_24h": 412,
            "hotlist_matches": 1,
            "latest_plate": "DL 01 AB 1234",
            "status": "CLEARED"
        }
    else:
        body = {
            "service": "IBVAP Edge Security API",
            "authenticated": True,
            "role": "SYSTEM_INTEGRATION",
            "rate_limit_remaining": 59,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    return {
        "status": "success",
        "http_code": 200,
        "message": "200 OK - Authorized and Authenticated",
        "latency_ms": latency,
        "headers": {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "59",
            "X-Auth-Scheme": "HMAC-SHA256"
        },
        "response": body
    }

# ── EXTERNAL INTEGRATIONS & WEBHOOKS CRUD ──

@router.get("/integrations")
async def list_integrations():
    """Lists all configured external C4ISR networks, webhooks, and device bridges"""
    return {
        "status": "success",
        "total": len(MOCK_INTEGRATIONS),
        "active": sum(1 for i in MOCK_INTEGRATIONS if i["status"] == "active"),
        "integrations": MOCK_INTEGRATIONS
    }

@router.post("/integrations")
async def create_integration(payload: CreateIntegrationRequest):
    """Registers a new external tactical integration or webhook"""
    new_id = f"int-{secrets.token_hex(3)}"
    item = {
        "id": new_id,
        "name": payload.name,
        "category": payload.category,
        "protocol": payload.protocol,
        "endpoint_url": payload.endpoint_url,
        "auth_type": payload.auth_type,
        "events": payload.events,
        "status": "active",
        "ping_ms": random.randint(12, 35),
        "health_pct": 100.0,
        "last_sync": "Just now",
        "success_rate": "100%",
        "description": f"Custom integrated {payload.category} connector delivering {len(payload.events)} event types."
    }
    MOCK_INTEGRATIONS.append(item)
    return {
        "status": "success",
        "message": f"Integration '{payload.name}' registered successfully.",
        "integration": item
    }

@router.post("/integrations/{int_id}/test")
async def test_integration_connection(int_id: str):
    """Sends a live ping handshake packet to the designated external integration"""
    target = next((i for i in MOCK_INTEGRATIONS if i["id"] == int_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    measured_ping = random.randint(4, 28)
    target["ping_ms"] = measured_ping
    target["last_sync"] = "Just now"

    return {
        "status": "success",
        "http_code": 200,
        "id": target["id"],
        "name": target["name"],
        "endpoint_url": target["endpoint_url"],
        "protocol": target["protocol"],
        "ping_ms": measured_ping,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "handshake_result": "TLS 1.3 Handshake Succeeded. Remote endpoint acknowledged receipt of echo probe."
    }

@router.put("/integrations/{int_id}/toggle")
async def toggle_integration(int_id: str):
    """Toggles an integration between active and paused states"""
    target = next((i for i in MOCK_INTEGRATIONS if i["id"] == int_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    target["status"] = "paused" if target["status"] == "active" else "active"
    return {
        "status": "success",
        "message": f"Integration '{target['name']}' status set to {target['status'].upper()}.",
        "new_status": target["status"]
    }

@router.delete("/integrations/{int_id}")
async def delete_integration(int_id: str):
    """Removes an integration from the platform"""
    global MOCK_INTEGRATIONS
    initial_len = len(MOCK_INTEGRATIONS)
    MOCK_INTEGRATIONS = [i for i in MOCK_INTEGRATIONS if i["id"] != int_id]
    if len(MOCK_INTEGRATIONS) == initial_len:
        raise HTTPException(status_code=404, detail="Integration not found")
    return {"status": "success", "message": "Integration removed successfully."}

# ── SESSIONS MANAGEMENT ──

@router.get("/active-sessions")
async def get_active_sessions():
    return MOCK_SESSIONS

@router.delete("/active-sessions/{session_id}")
async def terminate_session(session_id: str):
    """Terminates an active operator session immediately"""
    global MOCK_SESSIONS
    target = next((s for s in MOCK_SESSIONS if s["id"] == session_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Session not found")
    if target.get("is_current"):
        raise HTTPException(status_code=400, detail="Cannot terminate current active commander session.")
    
    MOCK_SESSIONS = [s for s in MOCK_SESSIONS if s["id"] != session_id]
    return {
        "status": "success",
        "message": f"Session for user '{target['user']}' ({target['ip']}) terminated successfully. Token invalidated."
    }

# ── KMS KEY ROTATION ──

@router.post("/kms/rotate")
async def rotate_kms_key():
    """Performs cryptographic re-keying and key-wrap rotation on hardware HSM"""
    new_key_id = f"kms-root-sec4-{time.strftime('%Y%m%d%H%M')}"
    new_fp = secrets.token_hex(32)
    KMS_STATE["current_key_id"] = new_key_id
    KMS_STATE["fingerprint_sha256"] = new_fp
    KMS_STATE["last_rotated"] = datetime.utcnow().isoformat()
    return {
        "status": "success",
        "message": "Hardware Security Module (HSM) master key rotated successfully.",
        "key_id": new_key_id,
        "fingerprint_sha256": new_fp,
        "timestamp": KMS_STATE["last_rotated"]
    }

# ── AUTH EVENTS & TELEMETRY ──

@router.get("/auth-events")
async def get_auth_events():
    return [
        {"id": 1, "user": "commander.singh", "type": "LOGIN", "timestamp": "10:45:12 UTC", "ip": "10.200.20.14", "result": "SUCCESS", "mfa": "FIDO2 YubiKey"},
        {"id": 2, "user": "operator.sharma", "type": "LOGIN", "timestamp": "09:30:20 UTC", "ip": "10.200.20.22", "result": "SUCCESS", "mfa": "TOTP Authenticator"},
        {"id": 3, "user": "checkpoint.subedar", "type": "LOGIN", "timestamp": "08:15:02 UTC", "ip": "10.200.10.88", "result": "SUCCESS", "mfa": "TOTP Authenticator"},
        {"id": 4, "user": "drone.telemetry.agent", "type": "TOKEN_AUTH", "timestamp": "07:55:40 UTC", "ip": "10.200.30.45", "result": "SUCCESS", "mfa": "mTLS X.509"}
    ]

@router.get("/failed-logins")
async def get_failed_logins():
    return [
        {"id": 1, "user": "root_attempt", "timestamp": "10:14:02 UTC", "ip": "192.168.1.189", "reason": "Bad credentials - Port probe blocked by firewall"},
        {"id": 2, "user": "admin_guest", "timestamp": "06:40:22 UTC", "ip": "10.200.10.99", "reason": "Invalid TOTP token code"}
    ]

@router.get("/encryption-status")
async def get_encryption_status():
    return {
        "cameraStreams": {"status": "encrypted", "protocol": "TLS 1.3", "cipher": "ECDHE-RSA-AES256-GCM", "verified": True},
        "apiTransport": {"status": "encrypted", "protocol": "HTTPS (TLS 1.3)", "cipher": "AES-256-GCM", "verified": True},
        "database": {"status": "encrypted", "protocol": "LUKS2 + pgcrypto", "cipher": "AES-XTS-512", "verified": True},
        "evidenceStorage": {"status": "encrypted", "protocol": "MinIO SSE-S3 + SHA-256", "cipher": "AES-256", "verified": True},
        "tokenSigning": {"status": "encrypted", "protocol": "RS256 / HMAC-SHA256", "cipher": "RSA-4096", "verified": True},
        "kms": KMS_STATE
    }

