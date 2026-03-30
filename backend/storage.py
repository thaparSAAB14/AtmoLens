"""
☁️ Cloud Storage Manager (Vercel Native)
─────────────────────────────────────
Handles saving/loading processed maps to Vercel Blob and persistent 
metadata storage in Vercel Postgres.
"""

import hashlib
import logging
import os
import io
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List

import psycopg2
from psycopg2.extras import RealDictCursor
from vercel_blob import put

import backend.config as config

logger = logging.getLogger(__name__)

# ── Database Connection ────────────────────────────────────────────────────────

def get_db_connection():
    """Create a new Postgres connection and ensure the schema exists."""
    try:
        conn = psycopg2.connect(config.POSTGRES_URL, sslmode="require")
        # Ensure schema on every connection attempts (low overhead with IF NOT EXISTS)
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS maps (
                    id SERIAL PRIMARY KEY,
                    map_type TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    blob_url TEXT NOT NULL,
                    original_blob_url TEXT,
                    timestamp TIMESTAMPTZ NOT NULL,
                    hash TEXT UNIQUE NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_maps_type_ts ON maps(map_type, timestamp DESC);
            """)
        conn.commit()
        return conn
    except Exception as e:
        logger.error(f"Postgres Connection Error: {e}")
        return None

# ── Hash & Dedup ─────────────────────────────────────────────────────────────

def compute_hash(data: bytes) -> str:
    """Compute SHA-256 hash of raw image bytes."""
    return hashlib.sha256(data).hexdigest()

def is_duplicate(map_type: str, data: bytes) -> bool:
    """Check if this image hash already exists in Postgres."""
    current_hash = compute_hash(data)
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM maps WHERE map_type = %s AND hash = %s", (map_type, current_hash))
            return cur.fetchone() is not None
    finally:
        conn.close()

# ── Image Saving (Vercel Blob) ───────────────────────────────────────────────

def build_filename(map_type: str, timestamp: Optional[datetime] = None) -> str:
    """Generate a cloud-safe filename."""
    ts = timestamp or datetime.now(timezone.utc)
    return f"atmolens/{map_type}/map_{ts.strftime('%Y%m%d_%H')}Z.png"

async def save_image(
    map_type: str,
    processed_bytes: bytes,
    original_bytes: bytes,
    timestamp: Optional[datetime] = None,
):
    """Save processed and original images to Vercel Blob and metadata to Postgres."""
    ts = timestamp or datetime.now(timezone.utc)
    base_name = build_filename(map_type, ts)
    
    try:
        # 1. Upload Processed to Vercel Blob
        processed_blob = put(base_name, processed_bytes, {"access": "public"})
        processed_url = processed_blob.get("url")
        
        # 2. Upload Original to Vercel Blob
        original_blob = put(f"original_{base_name}", original_bytes, {"access": "public"})
        original_url = original_blob.get("url")
        
        # 3. Store Metadata in Postgres
        _store_metadata(map_type, base_name, processed_url, original_url, ts, compute_hash(original_bytes))
        
        logger.info(f"✅ Successfully stored {map_type} to Vercel Cloud")
        return processed_url
        
    except Exception as e:
        logger.error(f"❌ Failed to save image to cloud: {e}")
        return None

def _store_metadata(map_type: str, filename: str, blob_url: str, original_url: str, ts: datetime, img_hash: str):
    """Insert map record into Vercel Postgres."""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO maps (map_type, filename, blob_url, original_blob_url, timestamp, hash)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (hash) DO UPDATE SET blob_url = EXCLUDED.blob_url;
                """,
                (map_type, filename, blob_url, original_url, ts, img_hash)
            )
        conn.commit()
    finally:
        conn.close()

# ── Retrieval Logic ──────────────────────────────────────────────────────────

def get_latest_manifest() -> Dict:
    """Fetch the latest processed map for each type from Postgres."""
    conn = get_db_connection()
    if not conn:
        return {}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT DISTINCT ON (map_type) * 
                FROM maps 
                ORDER BY map_type, timestamp DESC;
                """
            )
            rows = cur.fetchall()
            return {row["map_type"]: dict(row) for row in rows}
    finally:
        conn.close()

def get_archive(map_type: Optional[str] = None) -> List[Dict]:
    """Fetch archive entries from Postgres."""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = "SELECT * FROM maps WHERE timestamp >= NOW() - INTERVAL '7 days'"
            params = []
            if map_type:
                query += " AND map_type = %s"
                params.append(map_type)
            query += " ORDER BY timestamp DESC"
            
            cur.execute(query, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()

# ── Cleanup ───────────────────────────────────────────────────────────────

def cleanup_old_maps():
    """Cleanup old metadata from Postgres (Note: Blob deletion requires dedicated API call)."""
    conn = get_db_connection()
    if not conn:
        return 0
    
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM maps WHERE timestamp < NOW() - INTERVAL '7 days'")
            deleted_count = cur.rowcount
        conn.commit()
        return deleted_count
    finally:
        conn.close()
