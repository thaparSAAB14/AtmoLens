"""
FastAPI Main Application
─────────────────────────
REST API for serving processed weather maps, archive, and system status.
Integrates the scheduler for fully automated operation.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import config
import fetcher
import scheduler
import storage

# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── App Lifecycle ──────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    logger.info("🚀 Starting Weather Map Processor API")
    storage._ensure_dirs()
    scheduler.start_scheduler()

    # Run an initial fetch in the background on startup
    logger.info("Scheduling initial fetch cycle...")
    asyncio.create_task(scheduler.fetch_and_process())

    yield

    # Shutdown
    logger.info("Shutting down...")
    scheduler.stop_scheduler()
    await fetcher.close_client()


# ── FastAPI App ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Weather Map Processor API",
    description="Automated ECCC synoptic map enhancement system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - Allow multiple origins for production + local dev
allowed_origins = list(set(
    config.ALLOWED_ORIGINS + 
    ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]
))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS enabled for origins: {allowed_origins}")


# ── API Routes ─────────────────────────────────────────────────────────────────


@app.get("/api/status")
async def get_status():
    """System health and scheduler status."""
    sched = scheduler.get_scheduler_status()
    archive = storage.get_archive()
    return {
        "system": "Weather Map Processor",
        "version": "1.0.0",
        "scheduler": sched,
        "archive_count": len(archive),
        "map_types": list(config.STATIC_MAP_SOURCES.keys()),
    }


@app.get("/api/maps/latest")
async def get_latest_maps():
    """Return metadata for the latest processed map of each type."""
    manifest = storage.load_latest_manifest()
    if not manifest:
        return {"maps": {}, "message": "No maps processed yet"}

    # Add full image URLs
    for map_type, info in manifest.items():
        info["image_url"] = f"/api/maps/image/{map_type}/{info['filename']}"
        if info.get("original_filename"):
            info["original_url"] = (
                f"/api/maps/image/{map_type}/{info['original_filename']}"
            )

    return {"maps": manifest}


@app.get("/api/maps/latest/{map_type}")
async def get_latest_map(map_type: str):
    """Return metadata for the latest map of a specific type."""
    manifest = storage.load_latest_manifest()
    if map_type not in manifest:
        raise HTTPException(404, f"No maps found for type: {map_type}")

    info = manifest[map_type]
    info["image_url"] = f"/api/maps/image/{map_type}/{info['filename']}"
    if info.get("original_filename"):
        info["original_url"] = (
            f"/api/maps/image/{map_type}/{info['original_filename']}"
        )
    return info


@app.get("/api/maps/archive")
async def get_archive():
    """Return all maps in the 7-day archive."""
    entries = storage.get_archive()
    for entry in entries:
        entry["image_url"] = f"/api/maps/image/{entry['map_type']}/{entry['filename']}"
        if entry.get("original_filename"):
            entry["original_url"] = (
                f"/api/maps/image/{entry['map_type']}/{entry['original_filename']}"
            )
    return {"archive": entries, "count": len(entries)}


@app.get("/api/maps/archive/{map_type}")
async def get_archive_by_type(map_type: str):
    """Return archive for a specific map type."""
    entries = storage.get_archive(map_type)
    for entry in entries:
        entry["image_url"] = f"/api/maps/image/{entry['map_type']}/{entry['filename']}"
        if entry.get("original_filename"):
            entry["original_url"] = (
                f"/api/maps/image/{entry['map_type']}/{entry['original_filename']}"
            )
    return {"archive": entries, "count": len(entries)}


@app.get("/api/maps/image/{map_type}/{filename}")
async def get_map_image(map_type: str, filename: str):
    """Serve an actual map image file."""
    file_path = config.MAP_OUTPUT_DIR / map_type / filename
    if not file_path.exists():
        raise HTTPException(404, f"Image not found: {filename}")
    if not file_path.is_relative_to(config.MAP_OUTPUT_DIR):
        raise HTTPException(403, "Access denied")
    return FileResponse(
        file_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@app.post("/api/maps/fetch")
async def trigger_fetch():
    """Manually trigger a fetch & process cycle (for testing)."""
    await scheduler.fetch_and_process()
    return {"status": "fetch cycle triggered"}


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
        log_level="info",
    )
