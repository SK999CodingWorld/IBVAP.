#!/usr/bin/env python3
"""
IBVAP - Intelligent Border Video Analytics Platform (SIH 2026 Unified Platform)
Master launch & control script
"""

import os
import sys
from pathlib import Path
import uvicorn

def main():
    root_dir = Path(__file__).parent.resolve()
    backend_dir = root_dir / "backend"
    
    # Add backend directory to sys.path
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    if str(root_dir) not in sys.path:
        sys.path.insert(0, str(root_dir))
        
    os.environ.setdefault("PYTHONPATH", f"{backend_dir};{root_dir}")
    os.environ.setdefault("PORT", "8001")
    
    port = int(os.environ.get("PORT", "8001"))
    host = os.environ.get("HOST", "0.0.0.0")
    workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
    
    print("=" * 70)
    print("  IBVAP - Intelligent Border Video Analytics Platform (SIH 2026)")
    print(f"  Starting Unified Application on http://localhost:{port} (Workers: {workers})")
    print("=" * 70)
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        workers=workers,
        reload=False,
        app_dir=str(backend_dir)
    )

if __name__ == "__main__":
    main()