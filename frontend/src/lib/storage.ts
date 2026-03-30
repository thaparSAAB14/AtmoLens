import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('POSTGRES_URL environment variable is missing.');
  }
  // The neon serverless driver uses Edge-compatible HTTP native fetches.
  return neon(url);
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS maps (
        id SERIAL PRIMARY KEY,
        map_type TEXT NOT NULL,
        filename TEXT NOT NULL,
        blob_url TEXT NOT NULL,
        original_blob_url TEXT,
        timestamp TIMESTAMPTZ NOT NULL,
        hash TEXT UNIQUE NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_maps_type_ts ON maps(map_type, timestamp DESC);`;
  
  // Meteorologist's Notebook
  await sql`
    CREATE TABLE IF NOT EXISTS observer_notes (
        id SERIAL PRIMARY KEY,
        note TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

export async function getLatestManifest() {
  const sql = getDb();
  // Postgres DISTINCT ON to get the newest row per map_type
  const rows = await sql`
    SELECT DISTINCT ON (map_type) * 
    FROM maps 
    ORDER BY map_type, timestamp DESC;
  `;
  
  const manifest: Record<string, any> = {};
  for (const row of rows) {
    manifest[row.map_type] = row;
  }
  return manifest;
}

export async function getArchive(mapType?: string) {
  const sql = getDb();
  if (mapType) {
    return await sql`
      SELECT * FROM maps 
      WHERE timestamp >= NOW() - INTERVAL '7 days' 
      AND map_type = ${mapType} 
      ORDER BY timestamp DESC
    `;
  }
  return await sql`
    SELECT * FROM maps 
    WHERE timestamp >= NOW() - INTERVAL '7 days' 
    ORDER BY timestamp DESC
  `;
}

export async function storeMapMetadata(mapType: string, filename: string, blobUrl: string, originalUrl: string, timestamp: Date, hash: string) {
  const sql = getDb();
  await sql`
    INSERT INTO maps (map_type, filename, blob_url, original_blob_url, timestamp, hash)
    VALUES (${mapType}, ${filename}, ${blobUrl}, ${originalUrl}, ${timestamp.toISOString()}, ${hash})
    ON CONFLICT (hash) DO UPDATE SET blob_url = EXCLUDED.blob_url;
  `;
}

export async function cleanupOldMaps() {
  const sql = getDb();
  const res = await sql`
    DELETE FROM maps WHERE timestamp < NOW() - INTERVAL '7 days' RETURNING id;
  `;
  return res.length;
}

// ── Meteorologist's Notebook ────────────────────────────────────────────────

export async function saveNote(note: string) {
  const sql = getDb();
  await sql`INSERT INTO observer_notes (note) VALUES (${note})`;
}

export async function getNotes() {
  const sql = getDb();
  return await sql`SELECT * FROM observer_notes ORDER BY created_at DESC LIMIT 50`;
}
