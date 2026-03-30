import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Project Info ───────────────────────────────────────────────────────────────

SYSTEM_NAME = "AtmoLens"
VERSION = "2.0.0 (Vercel Monorepo)"

# ── Environment & Infrastructure ─────────────────────────────────────────────

# Vercel Environment Variables
POSTGRES_URL = os.getenv("POSTGRES_URL")
BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")

# CORS
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in FRONTEND_ORIGIN.split(",")]

# ── ECCC Data Sources ─────────────────────────────────────────────────────────

# Synoptic maps (8 types)
STATIC_MAP_SOURCES = {
    "surface_00z": "https://weather.gc.ca/data/analysis/jac00_100.gif",
    "surface_06z": "https://weather.gc.ca/data/analysis/jac06_100.gif",
    "surface_12z": "https://weather.gc.ca/data/analysis/jac12_100.gif",
    "surface_18z": "https://weather.gc.ca/data/analysis/jac18_100.gif",
    "upper_250hpa": "https://weather.gc.ca/data/analysis/upr25_100.gif",
    "upper_500hpa": "https://weather.gc.ca/data/analysis/upr50_100.gif",
    "upper_700hpa": "https://weather.gc.ca/data/analysis/upr70_100.gif",
    "upper_850hpa": "https://weather.gc.ca/data/analysis/upr85_100.gif",
}

# ── Processing Config ────────────────────────────────────────────────────────

# OpenCV thresholds
FOREGROUND_THRESHOLD = 100

# BGR Colors (OpenCV default)
WATER_COLOR = (226, 144, 74)   # #4A90E2
LAND_COLOR = (203, 236, 220)    # #DCECCB

# ── Archive Config ────────────────────────────────────────────────────────────

FETCH_INTERVAL_MINUTES = int(os.getenv("FETCH_INTERVAL_MINUTES", "30"))
ARCHIVE_DAYS = 7
