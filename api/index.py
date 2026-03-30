"""
🚀 AtmoLens API Entry Point (Vercel Native)
────────────────────────────────────────
FastAPI serverless entry point for serving weather maps and archives.
Routes are served under /api on the Same Domain.
"""

import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

import api.config as config
import api.storage as storage
import api.fetcher as fetcher
import api.processor as processor

# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI App ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AtmoLens API",
    description="Vercel-native automated ECCC synoptic map enhancement",
    version="2.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS - Allowing Same Domain + Local Dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS + ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/status")
async def get_status():
    """System health and cloud storage status."""
    archive = storage.get_archive()
    return {
        "system": config.SYSTEM_NAME,
        "version": config.VERSION,
        "status": "online",
        "archive_count": len(archive),
        "map_types": list(config.STATIC_MAP_SOURCES.keys()),
    }

@app.get("/api/maps/latest")
async def get_latest_maps():
    """Return latest processed map metadata from Postgres."""
    manifest = storage.get_latest_manifest()
    if not manifest:
        return {"maps": {}, "message": "No maps processed yet"}
    return {"maps": manifest}

@app.get("/api/maps/archive")
async def get_archive(map_type: Optional[str] = None):
    """Return 7-day archive metadata from Postgres."""
    entries = storage.get_archive(map_type)
    return {"archive": entries, "count": len(entries)}

@app.post("/api/maps/fetch")
async def trigger_fetch():
    """Manual trigger for the fetch & process cycle."""
    # Note: In production, this is triggered by Vercel Cron.
    # This endpoint is for manual testing.
    new_maps = await fetcher.fetch_all_maps()
    results = []
    
    for map_type, raw_bytes in new_maps.items():
        processed = processor.process_image(raw_bytes)
        original_png = processor.convert_original_to_png(raw_bytes)
        url = await storage.save_image(map_type, processed, original_png)
        results.append({"type": map_type, "url": url})
        
    return {"status": "cycle completed", "processed": results}
