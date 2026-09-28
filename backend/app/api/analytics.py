from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.api.auth import get_current_user
import random

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/surveillance")
async def get_surveillance_analytics(current_user=Depends(get_current_user)):
    hours = [f"{i:02d}:00" for i in range(24)]
    return {
        "timeline": [
            {
                "time": hour,
                "people": random.randint(10, 150),
                "vehicles": random.randint(5, 100)
            } for hour in hours
        ],
        "events_per_camera": [
            {"camera": f"CAM-{i:03d}", "events": random.randint(20, 300)}
            for i in range(1, 10)
        ]
    }

@router.get("/security")
async def get_security_analytics(current_user=Depends(get_current_user)):
    return {
        "event_types": [
            {"type": "Intrusions", "count": random.randint(5, 50)},
            {"type": "Loitering", "count": random.randint(10, 80)},
            {"type": "Zone Crossings", "count": random.randint(20, 150)},
            {"type": "Night Events", "count": random.randint(15, 60)}
        ],
        "severity": {
            "high": random.randint(5, 20),
            "medium": random.randint(20, 80),
            "low": random.randint(50, 200)
        }
    }

@router.get("/anpr")
async def get_anpr_analytics(current_user=Depends(get_current_user)):
    hours = [f"{i:02d}:00" for i in range(24)]
    return {
        "reads_timeline": [
            {"time": hour, "reads": random.randint(20, 200)}
            for hour in hours
        ],
        "confidence_distribution": [
            {"range": "95-100%", "count": 850},
            {"range": "90-95%", "count": 250},
            {"range": "80-90%", "count": 50},
            {"range": "<80%", "count": 10}
        ],
        "vehicles_by_type": [
            {"type": "Car", "count": 1500},
            {"type": "Truck", "count": 450},
            {"type": "Motorcycle", "count": 230},
            {"type": "Bus", "count": 80}
        ]
    }

@router.get("/cameras")
async def get_camera_analytics(current_user=Depends(get_current_user)):
    return {
        "overview": {
            "total": 45,
            "online": 42,
            "offline": 1,
            "degraded": 2
        },
        "performance": [
            {
                "camera_id": f"CAM-{i:03d}",
                "uptime_percent": round(random.uniform(95.0, 100.0), 2),
                "avg_fps": random.randint(20, 30),
                "health": random.choice(["excellent", "good", "warning"])
            }
            for i in range(1, 20)
        ]
    }

@router.get("/ai")
async def get_ai_analytics(current_user=Depends(get_current_user)):
    return {
        "metrics": {
            "precision": 0.94,
            "recall": 0.96,
            "detection_fps_avg": 28.5,
            "latency_ms_avg": 35.2
        },
        "model_usage": [
            {"model": "YOLOv8-Custom", "invocations": 1450000},
            {"model": "FaceNet", "invocations": 250000},
            {"model": "LPRNet", "invocations": 180000}
        ]
    }

@router.get("/overview")
async def get_analytics_overview(current_user=Depends(get_current_user)):
    return {
        "total_detections": 185000,
        "total_alerts": 423,
        "active_incidents": 5,
        "edge_nodes": 8,
        "system_health": "good",
        "recent_trend": "increasing"
    }

@router.get("/heatmap")
async def get_heatmap_analytics():
    """Returns geospatial activity density clusters, sector hot spots, and 24h timeline"""
    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {
            "total_human_detections": 12584,
            "total_vehicle_detections": 3972,
            "night_movements": 2318,
            "intrusion_hotspots": 14,
            "peak_hour": "21:00",
            "active_sectors": 5
        },
        "sectors": [
            {
                "id": "SEC-04-A",
                "name": "Sector 4 (Red Zone Alpha)",
                "lat": 27.0582,
                "lng": 88.4521,
                "radius": 450,
                "humanActivity": 92,
                "vehicleActivity": 25,
                "alertScore": 88,
                "intrusions": 14,
                "nightMovement": 76,
                "risk": "CRITICAL",
                "primaryCamera": "CAM-01",
                "cameraName": "BOP Sector 4 North PTZ",
                "cameraFeed": "/feed-bop01.jpg",
                "status": "High Alert - Active Intrusion Risk"
            },
            {
                "id": "SEC-04-B",
                "name": "Sector 4 (Buffer Zone West)",
                "lat": 27.0641,
                "lng": 88.4385,
                "radius": 380,
                "humanActivity": 54,
                "vehicleActivity": 12,
                "alertScore": 62,
                "intrusions": 6,
                "nightMovement": 48,
                "risk": "HIGH",
                "primaryCamera": "BOP-03",
                "cameraName": "Perimeter West Optical",
                "cameraFeed": "/thumb-cam-bop01.jpg",
                "status": "Active Patrol Monitoring"
            },
            {
                "id": "HWY-01",
                "name": "Highway 1 Checkpoint Alpha",
                "lat": 27.0425,
                "lng": 88.4720,
                "radius": 500,
                "humanActivity": 38,
                "vehicleActivity": 96,
                "alertScore": 45,
                "intrusions": 2,
                "nightMovement": 35,
                "risk": "MEDIUM",
                "primaryCamera": "CHECK-01",
                "cameraName": "Checkpoint Highway ANPR Lane",
                "cameraFeed": "/feed-road01.jpg",
                "status": "Vehicle Convoy Screening"
            },
            {
                "id": "SEC-02-N",
                "name": "Sector 2 Approach North",
                "lat": 27.0754,
                "lng": 88.4608,
                "radius": 320,
                "humanActivity": 22,
                "vehicleActivity": 84,
                "alertScore": 30,
                "intrusions": 0,
                "nightMovement": 20,
                "risk": "LOW",
                "primaryCamera": "ROAD-02",
                "cameraName": "Approach Road North",
                "cameraFeed": "/health-cam-road02.jpg",
                "status": "Nominal Logistics Transit"
            },
            {
                "id": "HQ-MAIN",
                "name": "HQ Base Camp Perimeter",
                "lat": 27.0380,
                "lng": 88.4355,
                "radius": 420,
                "humanActivity": 70,
                "vehicleActivity": 58,
                "alertScore": 18,
                "intrusions": 0,
                "nightMovement": 15,
                "risk": "LOW",
                "primaryCamera": "GATE-01",
                "cameraName": "HQ Main Access Gate",
                "cameraFeed": "/thumb-cam-bop02.jpg",
                "status": "Authorized Personnel Gate"
            }
        ],
        "timeline_24h": [
            {"hour": "00:00", "human": 45, "vehicle": 12, "intrusions": 1, "night": 52},
            {"hour": "02:00", "human": 30, "vehicle": 8, "intrusions": 2, "night": 38},
            {"hour": "04:00", "human": 55, "vehicle": 15, "intrusions": 3, "night": 65},
            {"hour": "06:00", "human": 110, "vehicle": 45, "intrusions": 1, "night": 20},
            {"hour": "08:00", "human": 180, "vehicle": 95, "intrusions": 0, "night": 5},
            {"hour": "10:00", "human": 240, "vehicle": 140, "intrusions": 0, "night": 0},
            {"hour": "12:00", "human": 260, "vehicle": 155, "intrusions": 0, "night": 0},
            {"hour": "14:00", "human": 220, "vehicle": 130, "intrusions": 1, "night": 0},
            {"hour": "16:00", "human": 250, "vehicle": 145, "intrusions": 0, "night": 0},
            {"hour": "18:00", "human": 310, "vehicle": 120, "intrusions": 2, "night": 45},
            {"hour": "20:00", "human": 380, "vehicle": 85, "intrusions": 4, "night": 90},
            {"hour": "21:00", "human": 420, "vehicle": 70, "intrusions": 5, "night": 110},
            {"hour": "22:00", "human": 290, "vehicle": 40, "intrusions": 3, "night": 85},
            {"hour": "23:00", "human": 160, "vehicle": 25, "intrusions": 2, "night": 60}
        ]
    }

