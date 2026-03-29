"""
Scheduler
──────────
APScheduler integration for automated map fetching, processing, and cleanup.
Runs within the FastAPI process — no external cron needed.
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

import config
import fetcher
import processor
import storage

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


# Track state for the status endpoint
_last_fetch_time: datetime | None = None
_last_fetch_result: dict | None = None
_maps_processed_total: int = 0


def get_scheduler_status() -> dict:
    """Return current scheduler status for the API."""
    next_run = None
    jobs = scheduler.get_jobs()
    for job in jobs:
        if job.id == "fetch_and_process":
            next_run = (
                job.next_run_time.isoformat() if job.next_run_time else None
            )
            break

    return {
        "running": scheduler.running,
        "last_fetch_time": _last_fetch_time.isoformat() if _last_fetch_time else None,
        "last_fetch_result": _last_fetch_result,
        "maps_processed_total": _maps_processed_total,
        "next_scheduled_run": next_run,
        "fetch_interval_minutes": config.FETCH_INTERVAL_MINUTES,
    }


async def fetch_and_process():
    """
    Main scheduled job:
    1. Fetch all maps (skipping duplicates via hash)
    2. Process each new map through the image pipeline
    3. Save results and update manifest
    """
    global _last_fetch_time, _last_fetch_result, _maps_processed_total

    logger.info("=== Starting scheduled fetch & process cycle ===")
    _last_fetch_time = datetime.now(timezone.utc)

    try:
        new_maps = await fetcher.fetch_all_maps()

        if not new_maps:
            _last_fetch_result = {"status": "no_new_maps", "count": 0}
            logger.info("No new maps found in this cycle.")
            return

        processed = 0
        failed = 0

        for map_type, (raw_bytes, source) in new_maps.items():
            try:
                # Process the image
                processed_bytes = processor.process_image(raw_bytes)

                # Convert original to PNG for consistent storage
                original_png = processor.convert_original_to_png(raw_bytes)

                # Save both versions
                ts = datetime.now(timezone.utc)
                filename = storage.save_image(
                    map_type, processed_bytes, original_png, ts
                )

                # Update hash to prevent re-processing
                storage.update_hash(map_type, raw_bytes)

                processed += 1
                _maps_processed_total += 1
                logger.info(f"✅ {map_type} processed and saved as {filename}")

            except Exception as e:
                failed += 1
                logger.error(f"❌ Failed to process {map_type}: {e}")
                # Fallback: save original image
                try:
                    original_png = processor.convert_original_to_png(raw_bytes)
                    storage.save_image(
                        map_type, original_png, original_png,
                        datetime.now(timezone.utc)
                    )
                    storage.update_hash(map_type, raw_bytes)
                    logger.info(f"⚠️  Saved original as fallback for {map_type}")
                except Exception as e2:
                    logger.error(f"Failed to save fallback for {map_type}: {e2}")

        _last_fetch_result = {
            "status": "completed",
            "processed": processed,
            "failed": failed,
            "total_fetched": len(new_maps),
        }
        logger.info(
            f"=== Cycle complete: {processed} processed, {failed} failed ==="
        )

    except Exception as e:
        _last_fetch_result = {"status": "error", "error": str(e)}
        logger.error(f"Fetch & process cycle failed: {e}")


async def cleanup_job():
    """Scheduled cleanup of old maps."""
    logger.info("Running scheduled cleanup...")
    removed = storage.cleanup_old_maps()
    logger.info(f"Cleanup complete: {removed} files removed")


def start_scheduler():
    """Start the APScheduler with configured jobs."""
    # Fetch & process every N minutes
    scheduler.add_job(
        fetch_and_process,
        trigger=IntervalTrigger(minutes=config.FETCH_INTERVAL_MINUTES),
        id="fetch_and_process",
        name="Fetch and process maps",
        replace_existing=True,
    )

    # Cleanup old maps daily at the configured hour
    scheduler.add_job(
        cleanup_job,
        trigger=CronTrigger(hour=config.CLEANUP_HOUR),
        id="cleanup_old_maps",
        name="Cleanup old maps",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"Scheduler started: fetch every {config.FETCH_INTERVAL_MINUTES}min, "
        f"cleanup at {config.CLEANUP_HOUR:02d}:00 UTC"
    )


def stop_scheduler():
    """Shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
