"""
Configuration module for the Weather Map System.
All settings are loaded from environment variables with sensible defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
MAP_OUTPUT_DIR = Path(os.getenv("MAP_OUTPUT_DIR", str(BASE_DIR / "maps")))
ASSETS_DIR = BASE_DIR / "assets"
LAND_MASK_PATH = ASSETS_DIR / "land_mask.png"

# ── Scheduler ──────────────────────────────────────────────────────────────────
FETCH_INTERVAL_MINUTES = int(os.getenv("FETCH_INTERVAL_MINUTES", "30"))
CLEANUP_HOUR = int(os.getenv("CLEANUP_HOUR", "0"))  # Run cleanup at midnight

# ── Archive ────────────────────────────────────────────────────────────────────
ARCHIVE_DAYS = int(os.getenv("ARCHIVE_DAYS", "7"))

# ── Server ─────────────────────────────────────────────────────────────────────
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# ── Image Processing ──────────────────────────────────────────────────────────
FOREGROUND_THRESHOLD = int(os.getenv("FOREGROUND_THRESHOLD", "100"))
WATER_COLOR = tuple(
    int(x) for x in os.getenv("WATER_COLOR_BGR", "226,144,74").split(",")
)   # #4A90E2 in BGR
LAND_COLOR = tuple(
    int(x) for x in os.getenv("LAND_COLOR_BGR", "203,236,220").split(",")
)   # #DCECCB in BGR

# ── Data Sources ───────────────────────────────────────────────────────────────
# Static GIF/PNG URLs from weather.gc.ca (legacy, being deprecated end-2026)
STATIC_MAP_SOURCES = {
    "surface_00z": "https://weather.gc.ca/data/analysis/jac00_100.gif",
    "surface_06z": "https://weather.gc.ca/data/analysis/jac06_100.gif",
    "surface_12z": "https://weather.gc.ca/data/analysis/jac12_100.gif",
    "surface_18z": "https://weather.gc.ca/data/analysis/jac18_100.gif",
    "upper_250hpa": "https://weather.gc.ca/data/analysis/sah_100.gif",
    "upper_500hpa": "https://weather.gc.ca/data/analysis/sai_100.gif",
    "upper_700hpa": "https://weather.gc.ca/data/analysis/saj_100.gif",
    "upper_850hpa": "https://weather.gc.ca/data/analysis/saa_100.gif",
}

# MSC GeoMet WMS (future-proof API source)
GEOMET_WMS_BASE = "https://geo.weather.gc.ca/geomet"
GEOMET_LAYERS = {
    "mslp": "GDPS.ETA_PRMSL",
    "temperature": "GDPS.ETA_TT",
    "wind": "GDPS.ETA_UU",
}
GEOMET_BBOX = "-141.0,41.0,-52.0,84.0"   # Canada extent (minX,minY,maxX,maxY)
GEOMET_CRS = "EPSG:4326"
GEOMET_WIDTH = 1200
GEOMET_HEIGHT = 800

# ── Hash Store ─────────────────────────────────────────────────────────────────
HASH_STORE_PATH = MAP_OUTPUT_DIR / "hashes.json"
LATEST_MANIFEST_PATH = MAP_OUTPUT_DIR / "latest.json"
