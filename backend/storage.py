"""
Storage Manager
────────────────
Handles saving/loading processed maps, hash-based deduplication,
and automatic cleanup of files older than ARCHIVE_DAYS.
"""

import hashlib
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import config

logger = logging.getLogger(__name__)


def _ensure_dirs():
    """Create output directory structure if it doesn't exist."""
    config.MAP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    config.ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for map_type in config.STATIC_MAP_SOURCES:
        (config.MAP_OUTPUT_DIR / map_type).mkdir(parents=True, exist_ok=True)


def compute_hash(data: bytes) -> str:
    """Compute SHA-256 hash of raw image bytes."""
    return hashlib.sha256(data).hexdigest()


def load_hashes() -> dict:
    """Load the hash store from disk."""
    if config.HASH_STORE_PATH.exists():
        try:
            return json.loads(config.HASH_STORE_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            logger.warning("Corrupt hash store, starting fresh")
    return {}


def save_hashes(hashes: dict):
    """Persist hash store to disk."""
    config.MAP_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    config.HASH_STORE_PATH.write_text(json.dumps(hashes, indent=2))


def is_duplicate(map_type: str, data: bytes) -> bool:
    """Check if this image has already been processed (same hash)."""
    current_hash = compute_hash(data)
    stored_hashes = load_hashes()
    return stored_hashes.get(map_type) == current_hash


def update_hash(map_type: str, data: bytes):
    """Store the hash for the latest processed image of this type."""
    hashes = load_hashes()
    hashes[map_type] = compute_hash(data)
    save_hashes(hashes)


def build_filename(map_type: str, timestamp: Optional[datetime] = None) -> str:
    """Generate a timestamped filename: map_YYYYMMDD_HHZ.png"""
    ts = timestamp or datetime.now(timezone.utc)
    return f"map_{ts.strftime('%Y%m%d_%H')}Z.png"


def save_image(
    map_type: str,
    processed_bytes: bytes,
    original_bytes: bytes,
    timestamp: Optional[datetime] = None,
):
    """Save both processed and original images, update the latest manifest."""
    _ensure_dirs()
    ts = timestamp or datetime.now(timezone.utc)
    filename = build_filename(map_type, ts)

    type_dir = config.MAP_OUTPUT_DIR / map_type
    type_dir.mkdir(parents=True, exist_ok=True)

    # Save processed
    processed_path = type_dir / filename
    processed_path.write_bytes(processed_bytes)

    # Save original
    original_path = type_dir / f"original_{filename}"
    original_path.write_bytes(original_bytes)

    logger.info(f"Saved {map_type}/{filename}")

    # Update latest manifest
    _update_latest(map_type, filename, ts)

    return filename


def _update_latest(map_type: str, filename: str, timestamp: datetime):
    """Update the latest.json manifest."""
    manifest = load_latest_manifest()
    manifest[map_type] = {
        "filename": filename,
        "original_filename": f"original_{filename}",
        "timestamp": timestamp.isoformat(),
        "map_type": map_type,
    }
    config.LATEST_MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))


def load_latest_manifest() -> dict:
    """Load the latest.json manifest."""
    if config.LATEST_MANIFEST_PATH.exists():
        try:
            return json.loads(config.LATEST_MANIFEST_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            logger.warning("Corrupt manifest, starting fresh")
    return {}


def get_archive(map_type: Optional[str] = None) -> list[dict]:
    """
    Return archive entries (last ARCHIVE_DAYS days).
    If map_type is given, filter to that type only.
    """
    entries = []
    
    if not config.MAP_OUTPUT_DIR.exists():
        return entries
    
    search_dirs = (
        [config.MAP_OUTPUT_DIR / map_type]
        if map_type
        else [
            d
            for d in config.MAP_OUTPUT_DIR.iterdir()
            if d.is_dir() and d.name != "__pycache__"
        ]
    )

    for type_dir in search_dirs:
        if not type_dir.exists():
            continue
        for f in sorted(type_dir.glob("map_*.png"), reverse=True):
            # Parse timestamp from filename: map_YYYYMMDD_HHZ.png
            try:
                parts = f.stem.replace("map_", "").replace("Z", "")
                dt = datetime.strptime(parts, "%Y%m%d_%H").replace(tzinfo=timezone.utc)
                cutoff = datetime.now(timezone.utc) - timedelta(days=config.ARCHIVE_DAYS)
                if dt >= cutoff:
                    original = type_dir / f"original_{f.name}"
                    entries.append(
                        {
                            "map_type": type_dir.name,
                            "filename": f.name,
                            "original_filename": f"original_{f.name}"
                            if original.exists()
                            else None,
                            "timestamp": dt.isoformat(),
                            "path": str(f.relative_to(config.MAP_OUTPUT_DIR)),
                        }
                    )
            except ValueError:
                continue

    entries.sort(key=lambda e: e["timestamp"], reverse=True)
    return entries


def cleanup_old_maps():
    """Delete processed and original images older than ARCHIVE_DAYS."""
    if not config.MAP_OUTPUT_DIR.exists():
        logger.info("Cleanup: MAP_OUTPUT_DIR doesn't exist yet, skipping")
        return 0
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=config.ARCHIVE_DAYS)
    removed = 0

    for type_dir in config.MAP_OUTPUT_DIR.iterdir():
        if not type_dir.is_dir() or type_dir.name == "__pycache__":
            continue
        for f in type_dir.glob("*.png"):
            try:
                name = f.stem.replace("map_", "").replace("original_map_", "").replace("Z", "")
                dt = datetime.strptime(name, "%Y%m%d_%H").replace(tzinfo=timezone.utc)
                if dt < cutoff:
                    f.unlink()
                    removed += 1
            except (ValueError, OSError):
                continue

    logger.info(f"Cleanup: removed {removed} old files")
    return removed


# Ensure dirs exist on import
_ensure_dirs()
