import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("POSTGRES_URL environment variable is missing.");
  }
  return neon(url);
}

const INGEST_LOCK_KEY = 910204;

export type IngestRunStatus = "running" | "ok" | "partial" | "failed";

export type IngestSummary = {
  total: number;
  ok: number;
  skipped: number;
  failed: number;
  duration_ms: number;
};

export type IngestItemInput = {
  runId: number;
  mapType: string;
  sourceUrl: string;
  status: "ok" | "skipped" | "failed";
  attempts: number;
  sourceHttpStatus?: number | null;
  sourceHash?: string | null;
  processedHash?: string | null;
  sourceTimestamp?: Date | null;
  sourceSizeBytes?: number | null;
  processedSizeBytes?: number | null;
  durationMs?: number | null;
  errorMessage?: string | null;
};

export type MapMetadataInput = {
  mapType: string;
  filename: string;
  blobUrl: string;
  originalUrl?: string | null;
  timestamp: Date;
  hash: string;
  sourceHash: string;
  processingVersion: string;
  sourceTimestamp?: Date | null;
  sourceSizeBytes?: number | null;
  processedSizeBytes?: number | null;
  sourceUrl?: string | null;
};

let dbInitialized = false;

export async function initDb() {
  if (dbInitialized) return;
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS maps (
      id SERIAL PRIMARY KEY,
      map_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      original_blob_url TEXT,
      timestamp TIMESTAMPTZ NOT NULL,
      hash TEXT NOT NULL
    );
  `;

  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS source_hash TEXT;`;
  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS processing_version TEXT;`;
  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS source_timestamp TIMESTAMPTZ;`;
  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`;
  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS source_size_bytes INTEGER;`;
  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS processed_size_bytes INTEGER;`;
  await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS source_url TEXT;`;

  await sql`CREATE INDEX IF NOT EXISTS idx_maps_type_ts ON maps(map_type, timestamp DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_maps_type_hash_ts ON maps(map_type, hash, timestamp DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_maps_type_signature_ts ON maps(map_type, source_hash, processing_version, timestamp DESC);`;
  await sql`ALTER TABLE maps DROP CONSTRAINT IF EXISTS maps_hash_key;`;

  await sql`
    CREATE TABLE IF NOT EXISTS ingest_runs (
      id SERIAL PRIMARY KEY,
      trigger TEXT NOT NULL,
      status TEXT NOT NULL,
      processing_version TEXT NOT NULL,
      total_maps INTEGER NOT NULL,
      ok_maps INTEGER NOT NULL DEFAULT 0,
      skipped_maps INTEGER NOT NULL DEFAULT 0,
      failed_maps INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      summary JSONB
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ingest_items (
      id SERIAL PRIMARY KEY,
      run_id INTEGER NOT NULL REFERENCES ingest_runs(id) ON DELETE CASCADE,
      map_type TEXT NOT NULL,
      source_url TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      source_http_status INTEGER,
      source_hash TEXT,
      processed_hash TEXT,
      source_timestamp TIMESTAMPTZ,
      source_size_bytes INTEGER,
      processed_size_bytes INTEGER,
      duration_ms INTEGER,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_ingest_runs_started ON ingest_runs(started_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ingest_items_run_id ON ingest_items(run_id);`;

  await sql`
    CREATE TABLE IF NOT EXISTS observer_notes (
      id SERIAL PRIMARY KEY,
      note TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  dbInitialized = true;
}

export async function beginIngestRun(
  trigger: string,
  processingVersion: string,
  totalMaps: number
): Promise<number> {
  await initDb();
  const sql = getDb();
  const rows = await sql`
    INSERT INTO ingest_runs (trigger, status, processing_version, total_maps)
    VALUES (${trigger}, 'running', ${processingVersion}, ${totalMaps})
    RETURNING id;
  `;
  return Number(rows[0]?.id);
}

export async function tryAcquireIngestLock(): Promise<boolean> {
  await initDb();
  const sql = getDb();
  const rows = await sql`SELECT pg_try_advisory_lock(${INGEST_LOCK_KEY}) AS locked;`;
  return Boolean(rows[0]?.locked);
}

export async function releaseIngestLock(): Promise<void> {
  await initDb();
  const sql = getDb();
  await sql`SELECT pg_advisory_unlock(${INGEST_LOCK_KEY});`;
}

export async function logIngestItem(input: IngestItemInput): Promise<void> {
  await initDb();
  const sql = getDb();
  await sql`
    INSERT INTO ingest_items (
      run_id,
      map_type,
      source_url,
      status,
      attempts,
      source_http_status,
      source_hash,
      processed_hash,
      source_timestamp,
      source_size_bytes,
      processed_size_bytes,
      duration_ms,
      error_message
    )
    VALUES (
      ${input.runId},
      ${input.mapType},
      ${input.sourceUrl},
      ${input.status},
      ${input.attempts},
      ${input.sourceHttpStatus ?? null},
      ${input.sourceHash ?? null},
      ${input.processedHash ?? null},
      ${input.sourceTimestamp ? input.sourceTimestamp.toISOString() : null},
      ${input.sourceSizeBytes ?? null},
      ${input.processedSizeBytes ?? null},
      ${input.durationMs ?? null},
      ${input.errorMessage ?? null}
    );
  `;
}

export async function finalizeIngestRun(
  runId: number,
  status: IngestRunStatus,
  summary: IngestSummary
): Promise<void> {
  await initDb();
  const sql = getDb();
  await sql`
    UPDATE ingest_runs
    SET status = ${status},
        ok_maps = ${summary.ok},
        skipped_maps = ${summary.skipped},
        failed_maps = ${summary.failed},
        finished_at = NOW(),
        summary = ${JSON.stringify(summary)}::jsonb
    WHERE id = ${runId};
  `;
}

export async function getLatestIngestRun() {
  await initDb();
  const sql = getDb();
  const runs = await sql`
    SELECT *
    FROM ingest_runs
    ORDER BY started_at DESC
    LIMIT 1;
  `;
  const run = runs[0] ?? null;
  if (!run) {
    return { run: null, items: [] as unknown[] };
  }

  const items = await sql`
    SELECT *
    FROM ingest_items
    WHERE run_id = ${run.id}
    ORDER BY map_type ASC, created_at ASC;
  `;
  return { run, items };
}

export async function getLatestManifest() {
  await initDb();
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT ON (map_type) *
    FROM maps
    ORDER BY map_type, timestamp DESC;
  `;
  const manifest: Record<string, unknown> = {};
  for (const row of rows) {
    manifest[row.map_type] = row;
  }
  return manifest;
}

export async function getLatestMapForType(mapType: string) {
  await initDb();
  const sql = getDb();
  const rows = await sql`
    SELECT *
    FROM maps
    WHERE map_type = ${mapType}
    ORDER BY timestamp DESC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

function clampArchiveDays(days: number | undefined): number {
  if (!Number.isFinite(days)) return 30;
  return Math.min(365, Math.max(1, Math.floor(days!)));
}

export async function getArchive(mapType?: string, days?: number) {
  await initDb();
  const sql = getDb();
  const windowDays = clampArchiveDays(days);
  const intervalText = `${windowDays} days`;

  if (mapType) {
    return await sql`
      SELECT *
      FROM maps
      WHERE timestamp >= NOW() - ${intervalText}::interval
        AND map_type = ${mapType}
      ORDER BY timestamp DESC;
    `;
  }

  return await sql`
    SELECT *
    FROM maps
    WHERE timestamp >= NOW() - ${intervalText}::interval
    ORDER BY timestamp DESC;
  `;
}

export async function getArchiveCount(mapType?: string, days?: number): Promise<number> {
  await initDb();
  const sql = getDb();
  const windowDays = clampArchiveDays(days);
  const intervalText = `${windowDays} days`;

  const rows = mapType
    ? await sql`
        SELECT COUNT(*)::int AS count
        FROM maps
        WHERE timestamp >= NOW() - ${intervalText}::interval
          AND map_type = ${mapType};
      `
    : await sql`
        SELECT COUNT(*)::int AS count
        FROM maps
        WHERE timestamp >= NOW() - ${intervalText}::interval;
      `;
  const count = rows[0]?.count;
  return typeof count === "number" ? count : Number.parseInt(String(count || 0), 10);
}

export async function getLastFetchTime(): Promise<string | null> {
  await initDb();
  const sql = getDb();
  const rows = await sql`
    SELECT MAX(timestamp) AS last_fetch_time
    FROM maps;
  `;
  const value = rows[0]?.last_fetch_time;
  if (!value) return null;
  return new Date(String(value)).toISOString();
}

export async function getMapTypes(): Promise<string[]> {
  await initDb();
  const sql = getDb();
  const rows = await sql`SELECT DISTINCT map_type FROM maps ORDER BY map_type;`;
  return rows.map((row) => String((row as { map_type: unknown }).map_type));
}

export async function isLatestMapHash(mapType: string, hash: string): Promise<boolean> {
  await initDb();
  const sql = getDb();
  const rows = await sql`
    SELECT hash
    FROM maps
    WHERE map_type = ${mapType}
    ORDER BY timestamp DESC
    LIMIT 1;
  `;
  const latestHash = rows[0]?.hash;
  return typeof latestHash === "string" && latestHash === hash;
}

export async function isLatestMapSignature(
  mapType: string,
  sourceHash: string,
  processingVersion: string
): Promise<boolean> {
  await initDb();
  const sql = getDb();
  const rows = await sql`
    SELECT source_hash, processing_version
    FROM maps
    WHERE map_type = ${mapType}
    ORDER BY timestamp DESC
    LIMIT 1;
  `;
  const latest = rows[0];
  if (!latest) return false;
  return (
    typeof latest.source_hash === "string" &&
    typeof latest.processing_version === "string" &&
    latest.source_hash === sourceHash &&
    latest.processing_version === processingVersion
  );
}

export async function getStaleMaps(targetVersion: string, limit = 10) {
  await initDb();
  const sql = getDb();
  return await sql`
    SELECT *
    FROM maps
    WHERE (processing_version IS NULL OR processing_version <> ${targetVersion})
      AND original_blob_url IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT ${limit};
  `;
}

export async function updateMapMetadata(
  id: number,
  blobUrl: string,
  hash: string,
  version: string,
  processedSizeBytes: number
) {
  await initDb();
  const sql = getDb();
  await sql`
    UPDATE maps
    SET blob_url = ${blobUrl},
        hash = ${hash},
        processing_version = ${version},
        processed_size_bytes = ${processedSizeBytes}
    WHERE id = ${id};
  `;
}

export async function storeMapMetadata(input: MapMetadataInput) {
  await initDb();
  const sql = getDb();
  await sql`
    INSERT INTO maps (
      map_type,
      filename,
      blob_url,
      original_blob_url,
      timestamp,
      hash,
      source_hash,
      processing_version,
      source_timestamp,
      source_size_bytes,
      processed_size_bytes,
      source_url
    )
    VALUES (
      ${input.mapType},
      ${input.filename},
      ${input.blobUrl},
      ${input.originalUrl ?? null},
      ${input.timestamp.toISOString()},
      ${input.hash},
      ${input.sourceHash},
      ${input.processingVersion},
      ${input.sourceTimestamp ? input.sourceTimestamp.toISOString() : null},
      ${input.sourceSizeBytes ?? null},
      ${input.processedSizeBytes ?? null},
      ${input.sourceUrl ?? null}
    );
  `;
}

export async function cleanupOldMaps(daysToKeep = 90) {
  await initDb();
  const sql = getDb();
  const keep = Math.min(365, Math.max(1, Math.floor(daysToKeep)));
  const intervalText = `${keep} days`;
  const rows = await sql`
    DELETE FROM maps
    WHERE timestamp < NOW() - ${intervalText}::interval
    RETURNING id;
  `;
  return rows.length;
}

export async function saveNote(note: string) {
  await initDb();
  const sql = getDb();
  await sql`INSERT INTO observer_notes (note) VALUES (${note})`;
}

export type ObserverNote = {
  id: number;
  note: string;
  created_at: string;
};

export async function getNotes(): Promise<ObserverNote[]> {
  await initDb();
  const sql = getDb();
  const rows = await sql`SELECT * FROM observer_notes ORDER BY created_at DESC LIMIT 50`;
  return rows as ObserverNote[];
}
