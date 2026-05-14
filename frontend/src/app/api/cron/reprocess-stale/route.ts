import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { del, put } from "@vercel/blob";
import { processImage } from "@/lib/processor";
import {
  getIngestLockDiagnostics,
  getStaleMaps,
  initDb,
  releaseIngestLock,
  tryAcquireIngestLock,
  tryBreakStaleIngestLock,
  updateMapMetadata,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PROCESS_TIMEOUT_MS = 40_000;
const DEFAULT_STALE_REPROCESS_BATCH = 5;
const MAX_STALE_REPROCESS_BATCH = 40;
const BLOB_ACCESS: "public" | "private" =
  process.env.BLOB_ACCESS === "public" ? "public" : "private";

function getProcessingVersion(mapType: string) {
  return mapType === "upper_850hpa" ? "enhancer-v13" : "enhancer-v12";
}

function parseBatchSize(value: string | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_STALE_REPROCESS_BATCH, Math.max(0, parsed));
}

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }) as Promise<T>;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forceBreakLock = request.nextUrl.searchParams.get("break_lock") === "1";
  const staleLockThresholdMinutes = parsePositiveInt(
    request.nextUrl.searchParams.get("lock_stale_minutes"),
    30
  );
  let lockAcquired = await tryAcquireIngestLock();
  let lockBreakResult: Awaited<ReturnType<typeof tryBreakStaleIngestLock>> | null = null;
  let lockDiagnostics = null;

  if (!lockAcquired && forceBreakLock) {
    lockBreakResult = await tryBreakStaleIngestLock(staleLockThresholdMinutes);
    lockAcquired = await tryAcquireIngestLock();
  }
  if (!lockAcquired) {
    lockDiagnostics = await getIngestLockDiagnostics(staleLockThresholdMinutes);
  }
  if (!lockAcquired) {
    return NextResponse.json(
      {
        status: "busy",
        message: "Another ingest run is currently in progress.",
        lock: lockDiagnostics,
        lock_break: lockBreakResult,
      },
      { status: 429 }
    );
  }

  const startedAt = Date.now();
  const staleBatchSize = parseBatchSize(
    request.nextUrl.searchParams.get("stale_batch"),
    DEFAULT_STALE_REPROCESS_BATCH
  );

  try {
    await initDb();
    if (staleBatchSize <= 0) {
      return NextResponse.json({
        status: "skipped",
        message: "No stale maps requested (stale_batch=0).",
        stale_batch: staleBatchSize,
      });
    }

    const staleMaps = await getStaleMaps(staleBatchSize);
    let reprocessedCount = 0;
    const failures: Array<{ id: number; error: string }> = [];

    for (const stale of staleMaps) {
      try {
        const sourceRes = await fetch(stale.original_blob_url, { cache: "no-store" });
        if (!sourceRes.ok) throw new Error(`Failed to fetch original blob (HTTP ${sourceRes.status})`);

        const sourceBytes = Buffer.from(await sourceRes.arrayBuffer());
        const processedBytes = await withTimeout(
          processImage(sourceBytes, stale.map_type),
          PROCESS_TIMEOUT_MS,
          "Historical re-processing timed out."
        );

        const staleVersion = getProcessingVersion(stale.map_type);
        const newProcessedHash = crypto
          .createHash("sha256")
          .update(staleVersion)
          .update(stale.map_type)
          .update(stale.source_hash)
          .digest("hex");

        const { url: newBlobUrl } = await put(stale.filename, processedBytes, {
          access: BLOB_ACCESS,
          contentType: "image/png",
        });

        if (stale.blob_url && stale.blob_url !== newBlobUrl) {
          try {
            await del(stale.blob_url);
          } catch (delErr) {
            console.error(`[StaleReprocess] Failed to delete old blob ${stale.blob_url} for map ${stale.id}:`, delErr);
          }
        }

        await updateMapMetadata(stale.id, newBlobUrl, newProcessedHash, staleVersion, processedBytes.byteLength);
        reprocessedCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown stale re-processing error.";
        failures.push({ id: Number(stale.id), error: message });
        console.error(`[StaleReprocess] Failed to re-process stale map ${stale.id}:`, error);
      }
    }

    return NextResponse.json(
      {
        status: failures.length === 0 ? "completed" : reprocessedCount > 0 ? "partial" : "failed",
        stale_batch: staleBatchSize,
        stale_candidates: staleMaps.length,
        reprocessed: reprocessedCount,
        failed: failures.length,
        failures,
        duration_ms: Date.now() - startedAt,
      },
      { status: failures.length > 0 && reprocessedCount === 0 ? 500 : 200 }
    );
  } catch (error) {
    console.error("[StaleReprocess] Critical failure:", error);
    return NextResponse.json({ status: "error", message: "Internal server error during stale re-processing." }, { status: 500 });
  } finally {
    await releaseIngestLock();
  }
}
