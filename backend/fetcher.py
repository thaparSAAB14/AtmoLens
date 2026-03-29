"""
Data Fetcher
─────────────
Fetches grayscale synoptic maps from ECCC static URLs and MSC GeoMet WMS.
Supports hash-based deduplication to avoid re-processing identical images.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx

import config
import storage

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
                "User-Agent": "WeatherMapProcessor/1.0 (educational project)"
            },
        )
    return _client


async def close_client():
    """Close the HTTP client on shutdown."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


# ── Static Map Fetching ────────────────────────────────────────────────────────


async def fetch_static_map(map_type: str) -> Optional[bytes]:
    """
    Fetch a map image from the legacy weather.gc.ca static URL.
    Returns raw image bytes or None if the fetch fails.
    """
    url = config.STATIC_MAP_SOURCES.get(map_type)
    if not url:
        logger.warning(f"Unknown map type: {map_type}")
        return None

    client = await get_client()
    try:
        response = await client.get(url)
        response.raise_for_status()
        logger.info(f"Fetched {map_type} from static URL ({len(response.content)} bytes)")
        return response.content
    except httpx.HTTPStatusError as e:
        logger.warning(f"HTTP {e.response.status_code} for {map_type}: {url}")
        return None
    except httpx.RequestError as e:
        logger.error(f"Request failed for {map_type}: {e}")
        return None


# ── GeoMet WMS Fetching ───────────────────────────────────────────────────────


def build_wms_url(layer: str, width: int = None, height: int = None) -> str:
    """Construct a WMS GetMap URL for the given layer."""
    params = {
        "SERVICE": "WMS",
        "VERSION": "1.3.0",
        "REQUEST": "GetMap",
        "LAYERS": layer,
        "BBOX": config.GEOMET_BBOX,
        "CRS": config.GEOMET_CRS,
        "WIDTH": width or config.GEOMET_WIDTH,
        "HEIGHT": height or config.GEOMET_HEIGHT,
        "FORMAT": "image/png",
        "TRANSPARENT": "TRUE",
    }
    return f"{config.GEOMET_WMS_BASE}?{urlencode(params)}"


async def fetch_geomet_map(layer_key: str) -> Optional[bytes]:
    """
    Fetch a map image from MSC GeoMet WMS.
    layer_key should be one of the keys in config.GEOMET_LAYERS.
    """
    layer_name = config.GEOMET_LAYERS.get(layer_key)
    if not layer_name:
        logger.warning(f"Unknown GeoMet layer key: {layer_key}")
        return None

    url = build_wms_url(layer_name)
    client = await get_client()
    try:
        response = await client.get(url)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type:
            logger.warning(
                f"GeoMet returned non-image for {layer_key}: {content_type}"
            )
            return None
        logger.info(f"Fetched {layer_key} from GeoMet ({len(response.content)} bytes)")
        return response.content
    except httpx.HTTPStatusError as e:
        logger.warning(f"GeoMet HTTP {e.response.status_code} for {layer_key}")
        return None
    except httpx.RequestError as e:
        logger.error(f"GeoMet request failed for {layer_key}: {e}")
        return None


# ── Orchestrator ───────────────────────────────────────────────────────────────


async def fetch_map(map_type: str) -> Optional[tuple[bytes, str]]:
    """
    Try to fetch a map, first from static URL, then from GeoMet as fallback.
    Returns (raw_bytes, source) or None if both fail.
    """
    # Try static source first
    data = await fetch_static_map(map_type)
    if data:
        return data, "static"

    # Fallback to GeoMet WMS if we have a matching layer
    # Map static types to GeoMet layer keys where possible
    geomet_mapping = {
        "surface_00z": "mslp",
        "surface_06z": "mslp",
        "surface_12z": "mslp",
        "surface_18z": "mslp",
    }
    geomet_key = geomet_mapping.get(map_type)
    if geomet_key:
        data = await fetch_geomet_map(geomet_key)
        if data:
            return data, "geomet"

    logger.error(f"All sources failed for {map_type}")
    return None


async def fetch_all_maps() -> dict[str, tuple[bytes, str]]:
    """
    Fetch all configured map types, skipping duplicates.
    Returns dict of {map_type: (raw_bytes, source)}.
    """
    results = {}
    for map_type in config.STATIC_MAP_SOURCES:
        # Check for duplicate
        result = await fetch_map(map_type)
        if result is None:
            continue
        raw_bytes, source = result

        if storage.is_duplicate(map_type, raw_bytes):
            logger.info(f"Skipping {map_type} — duplicate (hash unchanged)")
            continue

        results[map_type] = (raw_bytes, source)

    return results
