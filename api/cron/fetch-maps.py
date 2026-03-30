import asyncio
from fastapi import Request, HTTPException
import api.fetcher as fetcher
import api.processor as processor
import api.storage as storage
import api.config as config
from api.index import app  # Integrate with main app

@app.get("/api/cron/fetch-maps")
async def cron_fetch_maps(request: Request):
    """
    Vercel Cron Trigger for atmospheric map restoration.
    """
    # ── Security Check ─────────────────────────────────────────────────────────
    # Vercel Crons include a specific header (CRON_SECRET) to prevent 
    # unauthorized manual triggers in production.
    # We can also check for X-Vercel-Cron header.
    
    # ── Fetch & Process Cycle ────────────────────────────────────────────────
    results = []
    logger = config.logging.getLogger(__name__)
    logger.info("📡 Starting Vercel Cron — Map Fetch Cycle")
    
    new_maps = await fetcher.fetch_all_maps()
    for map_type, raw_bytes in new_maps.items():
        processed = processor.process_image(raw_bytes)
        original_png = processor.convert_original_to_png(raw_bytes)
        url = await storage.save_image(map_type, processed, original_png)
        results.append({"type": map_type, "url": url})
        
    return {"status": "cron completed", "processed_count": len(results)}

@app.get("/api/cron/cleanup")
async def cron_cleanup():
    """Daily database cleanup."""
    count = storage.cleanup_old_maps()
    return {"status": "cleanup completed", "removed": count}
