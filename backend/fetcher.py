"""
📡 Data Fetcher (Vercel Native)
──────────────────────────────
Fetches grayscale synoptic maps from ECCC static URLs.
Supports hash-based deduplication via Postgres to avoid re-processing.
"""

import logging
from typing import Optional, Dict, Tuple

import httpx

import backend.config as config
import backend.storage as storage

logger = logging.getLogger(__name__)

# Reusable async HTTP client
_client: Optional[httpx.AsyncClient] = None

async def get_client() -> httpx.AsyncClient:
    """Get or create the shared HTTP client."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            follow_redirects=True,
            headers={
                "User-Agent": "AtmoLens/2.0 (educational project; Vercel Mono)"
            },
        )
    return _client

async def close_client():
    """Close the HTTP client."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None

async def fetch_static_map(map_type: str) -> Optional[bytes]:
    """Fetch a map image from ECCC static URL."""
    url = config.STATIC_MAP_SOURCES.get(map_type)
    if not url:
        return None

    client = await get_client()
    try:
        response = await client.get(url)
        response.raise_for_status()
        return response.content
    except Exception as e:
        logger.warning(f"Fetch failed for {map_type}: {e}")
        return None

async def fetch_all_maps() -> Dict[str, bytes]:
    """Fetch all map types, skipping duplicates via Postgres hash check."""
    results = {}
    for map_type in config.STATIC_MAP_SOURCES:
        raw_bytes = await fetch_static_map(map_type)
        if not raw_bytes:
            continue

        if storage.is_duplicate(map_type, raw_bytes):
            logger.info(f"Skipping {map_type} — duplicate")
            continue

        results[map_type] = raw_bytes

    return results
