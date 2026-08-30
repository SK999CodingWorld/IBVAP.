from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from ultralytics import YOLO
import cv2
import threading
import time
import uvicorn
import os

app = FastAPI(title="IBVAP Live Dashboard")

# Mount static files for React build
static_dir = os.path.join(os.path.dirname(__file__), "static")
static_assets = os.path.join(static_dir, "assets")
if os.path.exists(static_assets):
    app.mount("/assets", StaticFiles(directory=static_assets), name="assets")
# Placeholder - will mount "/" after API routes

# Load model
model = YOLO("yolov8n.pt")

video_path = "test.mp4"

FENCE_X1, FENCE_Y1 = 400, 200
FENCE_X2, FENCE_Y2 = 900, 600

latest_frame = None
alerts = []
lock = threading.Lock()

def process_video():
    global latest_frame, alerts
    cap = cv2.VideoCapture(video_path)
    
    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        results = model(frame, verbose=False)

        # Draw zone
        cv2.rectangle(frame, (FENCE_X1, FENCE_Y1), (FENCE_X2, FENCE_Y2), (0, 255, 255), 2)
        cv2.putText(frame, "RESTRICTED ZONE", (FENCE_X1, FENCE_Y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            conf = float(box.conf[0])

            if label not in ["person", "car", "truck", "bus", "motorcycle"]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            inside = (FENCE_X1 < cx < FENCE_X2) and (FENCE_Y1 < cy < FENCE_Y2)

            color = (0, 0, 255) if inside else (0, 255, 0)
            text = f"ALERT: {label}" if inside else label

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if inside:
                with lock:
                    alerts.insert(0, {
                        "time": time.strftime("%H:%M:%S"),
                        "type": f"{label} intrusion",
                        "confidence": f"{conf:.0%}"
                    })
                    alerts[:] = alerts[:20]

        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        with lock:
            latest_frame = buffer.tobytes()

        time.sleep(0.03)

threading.Thread(target=process_video, daemon=True).start()

def generate_stream():
    while True:
        with lock:
            frame = latest_frame
        if frame is not None:
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        time.sleep(0.03)

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_stream(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/alerts")
def get_alerts():
    with lock:
        return alerts

# Mock API for React dashboard
@app.get("/api/health")
def api_health():
    return {"service":"ibvap","version":"1.0.0","status":"healthy","uptime_seconds": 3600, "components":[{"name":"redis","status":"healthy","message":"Connected"},{"name":"detection","status":"healthy","message":"24 FPS"},{"name":"tracking","status":"healthy","message":"8 cameras"}],"timestamp":"2024-01-15T12:00:00Z"}

@app.get("/api/cameras")
def api_cameras():
    return [{"id":"cam1","name":"BOP-North-Gate","location":"Border North","protocol":"rtsp","stream_url":"rtsp://demo","status":"online","fps":24.5,"enabled":True,"ptz_enabled":True,"latitude":34.12,"longitude":74.56,"ptz_presets":[],"zones":[],"metadata":{},"created_at":"2024-01-15T10:00:00Z","updated_at":"2024-01-15T10:00:00Z","resolution":"1280x720","bitrate":4000},{"id":"cam2","name":"BOP-South-Gate","location":"Border South","protocol":"rtsp","stream_url":"rtsp://demo2","status":"offline","fps":0,"enabled":True,"ptz_enabled":False,"ptz_presets":[],"zones":[],"metadata":{},"created_at":"2024-01-15T10:00:00Z","updated_at":"2024-01-15T10:00:00Z","resolution":"1280x720","bitrate":0}]

@app.get("/api/alerts")
def api_alerts():
    with lock:
        return [{"id": f"alert_{i}", "camera_id":"cam1","type":"intrusion","severity":"critical" if i<2 else "warning","message": a["type"],"class_name": a["type"].split()[0], "confidence": 0.85, "timestamp": "2024-01-15T12:00:00Z", "acknowledged": False, "metadata":{}} for i,a in enumerate(alerts[:10])]

@app.get("/api/recordings/storage")
def api_storage():
    return {"total_size_bytes": 256000000, "total_size_mb": 245, "clip_count": 47, "cameras":["cam1","cam2"]}

# Serve React app at root
@app.get("/")
async def root():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("""
    <html>
    <head><title>IBVAP Live Dashboard</title></head>
    <body style="background:#111;color:#eee;font-family:sans-serif;padding:20px;">
        <h1>IBVAP Live Dashboard</h1>
        <p>React build not found. Run <code>cd dashboard && npm run build</code> first.</p>
        <p><a href="/simple">Simple Dashboard</a> | <a href="/video_feed">Video Feed</a> | <a href="/alerts">Alerts API</a></p>
    </body>
    </html>
    """)

# Simple dashboard at /simple
@app.get("/simple", response_class=HTMLResponse)
def simple_dashboard():
    return """
    <html>
    <head>
        <title>IBVAP Live Dashboard</title>
        <style>
            body { background:#111; color:#eee; font-family:sans-serif; margin:0; padding:20px; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
            .stats { display:flex; gap:20px; margin-bottom:20px; }
            .stat { background:#1a1a1a; padding:20px; border-radius:8px; flex:1; text-align:center; border-left:4px solid #22c55e; }
            .stat h3 { margin:0 0 10px; font-size:14px; color:#94a3b8; }
            .stat .val { font-size:32px; font-weight:bold; color:#22c55e; }
            .container { display:flex; gap:20px; }
            .video { flex:2; }
            .alerts { flex:1; background:#1a1a1a; padding:20px; border-radius:8px; height:60vh; overflow-y:auto; }
            img { width:100%; border-radius:8px; border:2px solid #333; }
            .alert-item { background:#2a2a2a; margin:10px 0; padding:12px; border-left:4px solid #ef4444; border-radius:4px; }
            .alert-item.warning { border-left-color:#eab308; }
            .alert-item.info { border-left-color:#3b82f6; }
            h1 { margin:0; }
            h2 { color:#22c55e; margin-top:0; }
            .zone-info { background:#1a1a1a; padding:15px; border-radius:8px; margin-bottom:20px; border-left:4px solid #eab308; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>IBVAP — Live Dashboard</h1>
            <span style="color:#22c55e; font-weight:bold;">● LIVE</span>
        </div>
        
        <div class="zone-info">
            <strong>Virtual Fence Zone:</strong> Rectangle (400,200) to (900,600) | 
            Classes: person, car, truck, bus, motorcycle
        </div>

        <div class="stats">
            <div class="stat"><h3>Total Cameras</h3><div class="val" id="camCount">1</div></div>
            <div class="stat"><h3>Active Alerts</h3><div class="val" id="alertCount">0</div></div>
            <div class="stat"><h3>Zone Intrusions</h3><div class="val" id="intrusionCount">0</div></div>
            <div class="stat"><h3>Status</h3><div class="val" style="color:#22c55e;">ONLINE</div></div>
        </div>

        <div class="container">
            <div class="video">
                <h2>Live Feed</h2>
                <img src="/video_feed" id="videoFeed">
            </div>
            <div class="alerts">
                <h2>Recent Alerts</h2>
                <div id="alertList">Waiting for alerts...</div>
            </div>
        </div>

        <script>
            let totalIntrusions = 0;
            
            async function refreshAlerts() {
                try {
                    const res = await fetch('/alerts');
                    const data = await res.json();
                    const list = document.getElementById('alertList');
                    if (data.length === 0) {
                        list.innerHTML = '<p style="color:#666; text-align:center; margin-top:50px;">No alerts yet</p>';
                    } else {
                        list.innerHTML = data.map(a => 
                            `<div class="alert-item ${a.type.includes('person') ? 'warning' : ''}">
                                <b>${a.type}</b><br>
                                <small>${a.time} • ${a.confidence}</small>
                            </div>`
                        ).join('');
                    }
                    document.getElementById('alertCount').textContent = data.length;
                    document.getElementById('intrusionCount').textContent = totalIntrusions;
                } catch (e) {
                    console.error(e);
                }
            }
            
            setInterval(refreshAlerts, 1000);
            refreshAlerts();
        </script>
    </body>
    </html>
    """

# Catch-all for React Router (must be last - before __main__)
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("video_feed") or full_path.startswith("alerts") or full_path.startswith("simple") or full_path.startswith("assets"):
        return HTMLResponse("Not found", status_code=404)
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("Not found", status_code=404)

if __name__ == "__main__":
    import os as _os
    _port = int(_os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=_port)