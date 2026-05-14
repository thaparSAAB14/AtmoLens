import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getDb, getIngestLockDiagnostics, initDb } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_SOURCE_URL = "https://weather.gc.ca/data/analysis/saa_100.gif";
const DEFAULT_BLOB_QUOTA_BYTES = 1_000_000_000;
const DEFAULT_BLOB_SCAN_LIMIT = 3000;
const FETCH_TIMEOUT_MS = 15_000;

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  if (!value || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "AtmoLens/diagnostic (+https://vercel.com)" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quotaBytes = parsePositiveInt(process.env.BLOB_QUOTA_BYTES, DEFAULT_BLOB_QUOTA_BYTES);
  const scanLimit = parsePositiveInt(
    request.nextUrl.searchParams.get("blob_scan_limit") ?? process.env.DIAGNOSTIC_BLOB_SCAN_LIMIT,
    DEFAULT_BLOB_SCAN_LIMIT
  );
  const staleLockMinutes = parsePositiveInt(request.nextUrl.searchParams.get("lock_stale_minutes"), 30);
  const sourceUrl = DEFAULT_SOURCE_URL;

  const startedAt = Date.now();

  try {
    await initDb();
    const sql = getDb();
    const dbStart = Date.now();
    const dbPingRows = await sql`SELECT NOW() AS db_now;`;
    const dbNow = dbPingRows[0]?.db_now ? String(dbPingRows[0].db_now) : null;
    const dbLatencyMs = Date.now() - dbStart;

    const lock = await getIngestLockDiagnostics(staleLockMinutes);

    let cursor: string | undefined;
    let hasMore = true;
    let scannedBlobs = 0;
    let usedBytes = 0;
    while (hasMore && scannedBlobs < scanLimit) {
      const pageSize = Math.min(1000, scanLimit - scannedBlobs);
      const listResult = await list({ cursor, limit: pageSize });
      for (const blob of listResult.blobs) {
        scannedBlobs++;
        usedBytes += typeof blob.size === "number" ? blob.size : 0;
      }
      hasMore = listResult.hasMore;
      cursor = listResult.cursor;
    }

    const remainingBytes = Math.max(0, quotaBytes - usedBytes);
    const estimatedUsagePercent = Number(((usedBytes / quotaBytes) * 100).toFixed(2));

    const sourceStart = Date.now();
    const sourceRes = await fetchWithTimeout(sourceUrl, FETCH_TIMEOUT_MS);
    const sourceLatencyMs = Date.now() - sourceStart;
    const sourceHeaders = {
      content_type: sourceRes.headers.get("content-type"),
      content_length: sourceRes.headers.get("content-length"),
      last_modified: sourceRes.headers.get("last-modified"),
      cache_control: sourceRes.headers.get("cache-control"),
    };

    return NextResponse.json({
      status: "ok",
      diagnostics_at: new Date().toISOString(),
      elapsed_ms: Date.now() - startedAt,
      database: {
        connected: true,
        latency_ms: dbLatencyMs,
        db_now: dbNow,
      },
      lock,
      storage: {
        quota_bytes: quotaBytes,
        estimated_used_bytes: usedBytes,
        estimated_remaining_bytes: remainingBytes,
        estimated_usage_percent: estimatedUsagePercent,
        scanned_blobs: scannedBlobs,
        scan_limit: scanLimit,
        fully_scanned: !hasMore,
      },
      eccc_probe: {
        source_url: sourceUrl,
        status_code: sourceRes.status,
        ok: sourceRes.ok,
        latency_ms: sourceLatencyMs,
        headers: sourceHeaders,
      },
    });
  } catch (error) {
    console.error("[IngestDiagnosticAPI] Critical failure:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown diagnostic failure",
      },
      { status: 500 }
    );
  }
}
