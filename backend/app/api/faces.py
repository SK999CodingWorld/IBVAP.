from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List, Dict, Any
from app.ai.face_engine import face_engine
import os
import shutil

router = APIRouter(tags=["faces"])


@router.get("/api/faces/watchlist")
async def list_face_watchlist():
    """Returns the persistent watchlist database from face_engine"""
    watchlist = face_engine.get_watchlist()
    return {"status": "success", "count": len(watchlist), "data": watchlist}


@router.get("/api/faces/detections")
async def list_face_detections():
    """Returns recognized watchlist faces and identification events"""
    watchlist = face_engine.get_watchlist()
    return {
        "status": "success",
        "count": len(watchlist),
        "data": watchlist
    }


@router.get("/api/faces/config")
async def get_face_config():
    """Returns face recognition engine configuration & threshold"""
    return {
        "status": "success",
        "data": {
            "detection_enabled": True,
            "identification_enabled": True,
            "similarity_threshold": face_engine.similarity_threshold,
            "database_size": len(face_engine.known_embeddings),
            "blacklist_count": len(face_engine.blacklist_names)
        }
    }


@router.put("/api/faces/config")
async def update_face_config(config: Dict[str, Any]):
    """Updates face recognition engine configuration and similarity threshold"""
    if "similarity_threshold" in config:
        face_engine.similarity_threshold = float(config["similarity_threshold"])
    return {
        "status": "success",
        "message": "Face recognition configuration updated",
        "data": {
            "similarity_threshold": face_engine.similarity_threshold
        }
    }


@router.post("/api/faces/watchlist")
async def add_to_watchlist(
    name: str = Form(...),
    is_blacklist: bool = Form(False),
    file: UploadFile = File(...)
):
    """Uploads a new face image and registers it into the face recognition watchlist"""
    safe_name = os.path.basename(name.strip()).replace(" ", "_")
    # Remove any dangerous characters
    safe_name = "".join(c for c in safe_name if c.isalnum() or c in ("_", "-"))
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid face profile name")
        
    tag = "BLACKLIST" if is_blacklist else "AUTHORISED"
    filename = f"{safe_name}_{tag}.jpg"
    db_dir = os.path.abspath(face_engine.database_dir)
    filepath = os.path.abspath(os.path.join(db_dir, filename))
    if not filepath.startswith(db_dir):
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file.file.close()
        face_engine.reload_database()
        return {"status": "success", "message": f"Added {name} to watchlist", "filename": filename}
    except Exception as e:
        raise HTTPException(500, f"Failed to save face profile: {str(e)}")


@router.delete("/api/faces/watchlist/{name}")
async def delete_from_watchlist(name: str):
    """Removes a face profile from the watchlist database"""
    clean_target = os.path.basename(name.strip()).lower().replace(" ", "_")
    if not clean_target:
        raise HTTPException(400, "Profile name cannot be empty")
        
    removed = False
    db_dir = os.path.abspath(face_engine.database_dir)
    for filename in os.listdir(db_dir):
        # Match only exact base profile name or standard prefix
        base_fn = os.path.splitext(filename)[0].lower()
        if base_fn == clean_target or base_fn.startswith(f"{clean_target}_"):
            filepath = os.path.abspath(os.path.join(db_dir, filename))
            if filepath.startswith(db_dir):
                try:
                    os.remove(filepath)
                    removed = True
                except OSError:
                    pass
    if removed:
        face_engine.reload_database()
        return {"status": "success", "message": f"Removed {name} from watchlist"}
    raise HTTPException(404, "Face profile not found in watchlist")
