from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
import time
import random

router = APIRouter(prefix="/api/ai-models", tags=["ai-models"])

AI_MODELS_DB = [
    {
        "id": "model-yolo-detector",
        "name": "YOLOv8x-Border / RT-DETR",
        "role": "Primary Object Detection & Taxonomy",
        "version": "v2.4.1-edge",
        "status": "ACTIVE",
        "device": "CUDA 12.4 / TensorRT 10.2 (FP16)",
        "vram_mb": 2140,
        "input_shape": "1 x 3 x 640 x 640 (FP16)",
        "latency_ms": 18.4,
        "p50_latency": 17.2,
        "p95_latency": 19.8,
        "p99_latency": 22.4,
        "fps_throughput": 48.2,
        "supported_classes": 24,
        "classes_list": ["person", "soldier", "civilian", "vehicle", "military_truck", "suv", "motorcycle", "atv", "animal", "canine", "cattle", "backpack", "weapon_case", "drone", "tent", "fence_cut", "ladder", "cache"],
        "description": "Detects people, vehicles, animals, and general surveillance objects with bounding box confidence.",
        "action_label": "Test Inference",
        "action_route": "/command-center",
        "action_color": "emerald"
    },
    {
        "id": "model-bytetrack",
        "name": "ByteTrack-Border Multi-Target Re-ID",
        "role": "Multi-Object Tracking & Motion Vectors",
        "version": "v3.1.0",
        "status": "ACTIVE",
        "device": "CPU / Vectorized AVX-512 + OSNet GPU",
        "vram_mb": 780,
        "input_shape": "1 x 3 x 128 x 256 (OSNet Re-ID)",
        "latency_ms": 3.8,
        "p50_latency": 3.2,
        "p95_latency": 4.1,
        "p99_latency": 4.9,
        "fps_throughput": 120.0,
        "supported_classes": 18,
        "classes_list": ["person_track", "vehicle_track", "convoy_track", "cross_camera_id", "trajectory_vector", "kalman_velocity"],
        "description": "Maintains consistent tracking IDs (P-104, V-021), trajectory smoothing, and velocity estimation.",
        "action_label": "View Tracking",
        "action_route": "/tracking/cross-camera",
        "action_color": "cyan"
    },
    {
        "id": "model-paddle-anpr",
        "name": "PaddleOCR-v4 + STN Rectification",
        "role": "8-Stage ANPR License Plate Engine",
        "version": "v4.2",
        "status": "ACTIVE",
        "device": "CUDA / TensorRT (FP16)",
        "vram_mb": 1120,
        "input_shape": "1 x 3 x 48 x 320 (Dynamic STN)",
        "latency_ms": 12.6,
        "p50_latency": 11.8,
        "p95_latency": 13.9,
        "p99_latency": 15.2,
        "fps_throughput": 32.0,
        "supported_classes": 1,
        "classes_list": ["license_plate", "embossed_char", "state_code", "ind_identifier", "commercial_badge"],
        "description": "High-angle perspective correction, contrast enhancement, and temporal consensus voting.",
        "action_label": "Test Plate OCR",
        "action_route": "/anpr",
        "action_color": "emerald"
    },
    {
        "id": "model-retinaface",
        "name": "RetinaFace Quality & Occlusion Engine",
        "role": "Face Detection (Audited Authorization)",
        "version": "v1.2",
        "status": "ACTIVE (Audited)",
        "device": "CUDA / Encrypted Biometric Sandbox",
        "vram_mb": 890,
        "input_shape": "1 x 3 x 640 x 640 (Pyramid Feature)",
        "latency_ms": 7.1,
        "p50_latency": 6.8,
        "p95_latency": 7.9,
        "p99_latency": 8.8,
        "fps_throughput": 85.0,
        "supported_classes": 6,
        "classes_list": ["face_frontal", "face_profile", "occluded_mask", "occluded_scarf", "low_quality", "pitch_yaw_roll"],
        "description": "Detects facial presence and assesses image quality/occlusion without automatic identification.",
        "action_label": "Run Test",
        "action_route": "/faces",
        "action_color": "purple"
    },
    {
        "id": "model-spatiotemporal",
        "name": "Explainable Spatio-Temporal Risk Engine",
        "role": "Behavior, Loitering & Virtual Tripwires",
        "version": "v2.0",
        "status": "ACTIVE",
        "device": "Real-time Symbolic Graph / Multiprocess",
        "vram_mb": 420,
        "input_shape": "Dynamic Graph Topology",
        "latency_ms": 22.3,
        "p50_latency": 20.5,
        "p95_latency": 24.1,
        "p99_latency": 26.5,
        "fps_throughput": 65.4,
        "supported_classes": 12,
        "classes_list": ["virtual_fence_breach", "tripwire_cross", "loitering_alert", "direction_violation", "speed_anomaly", "crawling_prone", "group_aggregation"],
        "description": "Evaluates virtual fence breaches, 120s loitering thresholds, animal filters, and crowd density.",
        "action_label": "View Explainability",
        "action_route": "/virtual-fences",
        "action_color": "amber"
    },
    {
        "id": "model-multimodal",
        "name": "Multimodal Threat Classification",
        "role": "Vision + Audio + Sensor Fusion",
        "version": "v1.8",
        "status": "ACTIVE",
        "device": "CUDA / Transformer Fusion Backbone",
        "vram_mb": 1850,
        "input_shape": "Multimodal Cross-Attention [Vis, Aud, Therm, IoT]",
        "latency_ms": 28.6,
        "p50_latency": 26.9,
        "p95_latency": 31.0,
        "p99_latency": 34.2,
        "fps_throughput": 40.0,
        "supported_classes": 8,
        "classes_list": ["visual_threat", "acoustic_gunshot", "acoustic_engine", "thermal_body", "thermal_vehicle", "seismic_geophone", "rf_beacon", "multimodal_fusion"],
        "description": "Combines visual, audio, and IoT sensor data for high-confidence threat classification.",
        "action_label": "Live Test",
        "action_route": "/surveillance",
        "action_color": "cyan"
    }
]

@router.get("")
@router.get("/")
@router.get("/list")
async def get_ai_models():
    """List of all registered AI pipelines and active inference status."""
    return AI_MODELS_DB

@router.get("/capability-matrix")
async def get_capability_matrix():
    """Complete capability grid reflecting live enabled states."""
    return [
        {"model": "Object Detector", "capability": "Human Detection", "status": "Active", "hardware": "Edge GPU", "accuracy": "96.4%"},
        {"model": "Object Detector", "capability": "Vehicle Detection & Classification", "status": "Active", "hardware": "Edge GPU", "accuracy": "98.2%"},
        {"model": "Object Detector", "capability": "Animal Detection & Filtering", "status": "Active", "hardware": "Edge GPU", "accuracy": "92.1%"},
        {"model": "Object Detector", "capability": "General Objects (Bags, Packages)", "status": "Active", "hardware": "Edge GPU", "accuracy": "91.5%"},
        {"model": "Object Tracker", "capability": "Multi-Object Real-Time Re-ID", "status": "Active", "hardware": "Edge CPU", "accuracy": "94.8%"},
        {"model": "OCR Pipeline", "capability": "ANPR 8-Stage License Plate", "status": "Active", "hardware": "Edge GPU", "accuracy": "97.6%"},
        {"model": "Face Engine", "capability": "Face Quality & Occlusion", "status": "Active", "hardware": "Edge GPU", "accuracy": "89.3%"},
        {"model": "Face Engine", "capability": "Biometric Identification", "status": "Locked (Audit Required)", "hardware": "Encrypted Vault", "accuracy": "Opt-In Only"},
        {"model": "Behavior Engine", "capability": "Virtual Fence Perimeter Tripwire", "status": "Active", "hardware": "Edge CPU", "accuracy": "99.1%"},
        {"model": "Behavior Engine", "capability": "Loitering Detection (>120s)", "status": "Active", "hardware": "Edge CPU", "accuracy": "98.5%"},
        {"model": "Behavior Engine", "capability": "Direction Violation Rules", "status": "Active", "hardware": "Edge CPU", "accuracy": "97.2%"},
        {"model": "Behavior Engine", "capability": "Crowd Density & Growth Alert", "status": "Active", "hardware": "Edge CPU", "accuracy": "95.0%"},
        {"model": "Vision Quality", "capability": "Night Mode / Low-Light Classifier", "status": "Active", "hardware": "Edge GPU", "accuracy": "96.0%"},
        {"model": "Vision Quality", "capability": "Camera Tampering / Obstruction Watchdog", "status": "Active", "hardware": "Edge CPU", "accuracy": "99.4%"},
        {"model": "Pose Engine", "capability": "Action Classifier (Run, Fall, Climb)", "status": "Active", "hardware": "Edge GPU", "accuracy": "91.0%"}
    ]

@router.post("/test/{model_id}")
async def test_model(model_id: str, payload: Dict[str, Any] = Body(default={})):
    """Runs a simulated live inference pass through the designated neural network pipeline."""
    target = next((m for m in AI_MODELS_DB if m["id"] == model_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="AI Model pipeline not found")
    
    # Simulate execution telemetry
    jitter = random.uniform(-1.5, 2.0)
    measured_latency = round(target["latency_ms"] + jitter, 1)
    conf = round(random.uniform(0.92, 0.99), 3)

    return {
        "status": "success",
        "model_id": model_id,
        "name": target["name"],
        "device": target["device"],
        "measured_latency_ms": measured_latency,
        "confidence": conf,
        "classes_detected": random.sample(target["classes_list"], min(3, len(target["classes_list"]))),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hardware_load": {
            "vram_allocated_mb": target["vram_mb"],
            "gpu_utilization_pct": round(random.uniform(42.0, 68.0), 1),
            "temperature_celsius": round(random.uniform(54.0, 61.0), 1)
        }
    }

