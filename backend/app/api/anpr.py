from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List, Dict, Any
from app.ai.anpr_engine import anpr_engine
import time

router = APIRouter(tags=["anpr"])

@router.get("/api/anpr/reads")
async def list_anpr_reads(
    plate: Optional[str] = None, 
    camera: Optional[str] = None,
    type: Optional[str] = None,
    flagged_only: bool = False,
    limit: int = Query(50, ge=1, le=500)
):
    """Returns persistent ANPR vehicle plate read history with Doppler radar speeds and hotlist tags"""
    query = plate or camera or (type if type and type != "ALL" else None)
    logs = anpr_engine.get_logs(query=query, limit=limit)
    if flagged_only:
        logs = [l for l in logs if l.get("is_flagged")]
    if type and type != "ALL":
        logs = [l for l in logs if l.get("vehicle_type", "").upper() == type.upper()]
    return {"status": "success", "count": len(logs), "data": logs}

@router.get("/api/anpr/search/{plate}")
async def search_plate(plate: str):
    """Searches vehicle plate history by exact or partial plate number"""
    logs = anpr_engine.get_logs(query=plate, limit=50)
    return {"status": "success", "query": plate, "matches": len(logs), "data": logs}

@router.get("/api/anpr/stats")
async def anpr_stats():
    """Returns total ANPR vehicle reads, unique plates, vehicle distribution, and hotlist count"""
    stats = anpr_engine.get_stats()
    return {"status": "success", "stats": stats}

@router.get("/api/anpr/hotlist")
async def get_hotlist():
    """Returns list of active vehicles on the BOLO / Hotlist watchlist"""
    items = anpr_engine.get_hotlist()
    return {"status": "success", "count": len(items), "data": items}

@router.post("/api/anpr/hotlist")
async def add_to_hotlist(payload: Dict[str, Any] = Body(...)):
    """Flags a vehicle plate onto the BOLO hotlist"""
    plate = payload.get("plate_number") or payload.get("plate")
    if not plate:
        raise HTTPException(status_code=400, detail="Missing plate_number")
    reason = payload.get("reason", "Suspected Unauthorized Border Activity")
    flag_level = payload.get("flag_level", "CRITICAL")
    model = payload.get("vehicle_model", "")
    reported_by = payload.get("reported_by", "HQ Tactical Command")
    result = anpr_engine.add_to_hotlist(plate, reason, flag_level, model, reported_by)
    return {"status": "success", "message": f"Plate {plate} added to hotlist", "data": result}

@router.delete("/api/anpr/hotlist/{plate}")
async def remove_from_hotlist(plate: str):
    """Removes a vehicle plate from the active hotlist"""
    removed = anpr_engine.remove_from_hotlist(plate)
    return {"status": "success", "removed": removed, "plate": plate}

@router.get("/api/anpr/vahan/{plate}")
async def verify_vahan_registry(plate: str):
    """Queries Indian Ministry of Road Transport (MoRTH) VAHAN database for vehicle ownership & legal status"""
    record = anpr_engine.lookup_vahan_registry(plate)
    return record

@router.post("/api/anpr/simulate-scan")
async def simulate_scan(payload: Dict[str, Any] = Body(default={})):
    """Triggers an on-demand OCR plate recognition scan at a border checkpoint"""
    import random
    states = ["DL", "HR", "UP", "RJ", "PB", "UK"]
    st = payload.get("state") or random.choice(states)
    dist = f"{random.randint(1, 40):02d}"
    chars = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    num = f"{random.randint(1000, 9999)}"
    plate_num = f"{st}-{dist}-{chars}-{num}"
    v_type = payload.get("vehicle_type") or random.choice(["CAR", "TRUCK", "MOTORCYCLE", "BUS", "VAN"])
    camera = payload.get("camera") or random.choice(["CAM-05 (Highway Lane 1)", "CAM-06 (Freight Terminal)", "CHECK-01 (Border Post)"])
    zone = payload.get("zone") or "Sector 4 Red Perimeter"
    
    # Store in database
    import sqlite3
    conf = round(random.uniform(0.92, 0.99), 2)
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    t_id = random.randint(2000, 9999)
    with sqlite3.connect(anpr_engine.db_path) as conn:
        c = conn.cursor()
        c.execute("""
            INSERT INTO anpr_logs (track_id, plate_number, vehicle_type, confidence, zone, camera, timestamp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (t_id, plate_num, v_type, conf, zone, camera, timestamp, time.time()))
        conn.commit()

    logs = anpr_engine.get_logs(query=plate_num, limit=1)
    new_entry = logs[0] if logs else {}
    return {"status": "success", "message": "New plate scanned and logged", "data": new_entry}

