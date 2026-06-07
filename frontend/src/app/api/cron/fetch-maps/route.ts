import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { put, del } from "@vercel/blob";
import {
  beginIngestRun,
  cleanupOldMaps,
  finalizeIngestRun,
  getIngestLockDiagnostics,
  getStaleMaps,
  initDb,
  isLatestMapSignature,
  logIngestItem,
  releaseIngestLock,
  storeMapMetadata,
  tryBreakStaleIngestLock,
  tryAcquireIngestLock,
  updateMapMetadata,
} from "@/lib/storage";
import { processImage } from "@/lib/processor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SOURCES: Record<string, string> = {
  surface_00z: "https://weather.gc.ca/data/analysis/jac00_100.gif",
  surface_06z: "https://weather.gc.ca/data/analysis/jac06_100.gif",
  surface_12z: "https://weather.gc.ca/data/analysis/jac12_100.gif",
  surface_18z: "https://weather.gc.ca/data/analysis/jac18_100.gif",
  surface_hem_00z: "https://weather.gc.ca/data/analysis/947_100.gif",
  surface_hem_06z: "https://weather.gc.ca/data/analysis/951_100.gif",
  surface_hem_12z: "https://weather.gc.ca/data/analysis/935_100.gif",
  surface_hem_18z: "https://weather.gc.ca/data/analysis/941_100.gif",
  upper_250hpa: "https://weather.gc.ca/data/analysis/sah_100.gif",
  upper_500hpa: "https://weather.gc.ca/data/analysis/sai_100.gif",
  upper_700hpa: "https://weather.gc.ca/data/analysis/saj_100.gif",
  upper_850hpa: "https://weather.gc.ca/data/analysis/saa_100.gif",
};

function getProcessingVersion(mapType: string) {
  return mapType === "upper_850hpa" ? "enhancer-v15" : "enhancer-v14";
}
const MAX_FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 25_000;
const PROCESS_TIMEOUT_MS = 40_000;
const MIN_SOURCE_BYTES = 4_000;
const DEFAULT_STALE_REPROCESS_BATCH = 5;
const MAX_STALE_REPROCESS_BATCH = 40;

const BLOB_ACCESS: "public" | "private" =
  process.env.BLOB_ACCESS === "public" ? "public" : "private";

type SourceFetchResult = {
  response: Response;
  attempts: number;
  sourceHttpStatus: number;
};

class SourceFetchError extends Error {
  attempts: number;
  sourceHttpStatus: number;

  constructor(message: string, attempts: number, sourceHttpStatus: number) {
    super(message);
    this.name = "SourceFetchError";
    this.attempts = attempts;
    this.sourceHttpStatus = sourceHttpStatus;
  }
}

type MapRunResult =
  | {
      mapType: string;
      status: "ok";
      attempts: number;
      sourceHash: string;
      processedHash: string;
      sourceBytes: number;
      processedBytes: number;
      sourceTimestamp: string | null;
      ms: number;
    }
  | {
      mapType: string;
      status: "skipped";
      attempts: number;
      sourceHash: string;
      sourceBytes: number;
      sourceTimestamp: string | null;
      reason: string;
      ms: number;
    }
  | {
      mapType: string;
      status: "failed";
      attempts: number;
      error: string;
      sourceHttpStatus?: number;
      ms: number;
    };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "AtmoLens/3.x (+https://vercel.com)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
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

async function fetchSourceWithRetries(mapType: string, url: string): Promise<SourceFetchResult> {
  let attempt = 0;
  let lastError: Error | null = null;
  let lastStatus = 0;

  while (attempt < MAX_FETCH_ATTEMPTS) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      lastStatus = response.status;
      console.info(
        `[IngestRun][${mapType}] source fetch attempt ${attempt}/${MAX_FETCH_ATTEMPTS} -> HTTP ${response.status}`
      );
      if (response.ok) {
        return { response, attempts: attempt, sourceHttpStatus: response.status };
      }

      const retryable = response.status === 404 || response.status === 408 || response.status === 429 || response.status >= 500;
      if (!retryable) {
        throw new SourceFetchError(
          `Fetch failed: ${response.status} ${response.statusText}`,
          attempt,
          response.status
        );
      }
      console.warn(
        `[IngestRun][${mapType}] retrying fetch after HTTP ${response.status} (attempt ${attempt}/${MAX_FETCH_ATTEMPTS})`
      );
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(500 * attempt);
      }
    } catch (error) {
      if (error instanceof SourceFetchError) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error("Unknown fetch error");
      console.warn(
        `[IngestRun][${mapType}] source fetch error on attempt ${attempt}/${MAX_FETCH_ATTEMPTS}: ${lastError.message}`
      );
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(500 * attempt);
      }
    }
  }

  if (lastError) {
    throw new SourceFetchError(
      `Fetch failed after ${MAX_FETCH_ATTEMPTS} attempts: ${lastError.message}`,
      MAX_FETCH_ATTEMPTS,
      lastStatus
    );
  }
  throw new SourceFetchError(
    `Fetch failed after ${MAX_FETCH_ATTEMPTS} attempts (last status ${lastStatus})`,
    MAX_FETCH_ATTEMPTS,
    lastStatus
  );
}

function parseSourceTimestamp(response: Response): Date | null {
  const lastModified = response.headers.get("last-modified");
  if (!lastModified) return null;
  const parsed = new Date(lastModified);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function processSingleMap(
  runId: number,
  mapType: string,
  sourceUrl: string
): Promise<MapRunResult> {
  const startedAt = Date.now();
  let attempts = 0;
  let sourceHttpStatus: number | undefined;

  try {
    const fetchResult = await fetchSourceWithRetries(mapType, sourceUrl);
    attempts = fetchResult.attempts;
    sourceHttpStatus = fetchResult.sourceHttpStatus;
    const response = fetchResult.response;

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("image")) {
      throw new Error(`Source is not an image (${contentType || "unknown content-type"})`);
    }

    const sourceTimestamp = parseSourceTimestamp(response);
    const sourceArrayBuffer = await response.arrayBuffer();
    const sourceBytes = Buffer.from(sourceArrayBuffer);
    if (sourceBytes.byteLength < MIN_SOURCE_BYTES) {
      throw new Error(`Source image too small (${sourceBytes.byteLength} bytes)`);
    }

    const sourceHash = crypto.createHash("sha256").update(sourceBytes).digest("hex");
    const version = getProcessingVersion(mapType);
    const processedHash = crypto
      .createHash("sha256")
      .update(version)
      .update(mapType)
      .update(sourceHash)
      .digest("hex");

    if (await isLatestMapSignature(mapType, sourceHash, version)) {
      const elapsed = Date.now() - startedAt;
      await logIngestItem({
        runId,
        mapType,
        sourceUrl,
        status: "skipped",
        attempts,
        sourceHttpStatus,
        sourceHash,
        processedHash,
        sourceTimestamp,
        sourceSizeBytes: sourceBytes.byteLength,
        durationMs: elapsed,
        errorMessage: "Latest source hash + processing version already indexed.",
      });
      return {
        mapType,
        status: "skipped",
        attempts,
        sourceHash,
        sourceBytes: sourceBytes.byteLength,
        sourceTimestamp: sourceTimestamp ? sourceTimestamp.toISOString() : null,
        reason: "duplicate-signature",
        ms: elapsed,
      };
    }

    const processedBytes = await withTimeout(
      processImage(sourceBytes, mapType),
      PROCESS_TIMEOUT_MS,
      "Image processing timed out."
    );

    const tsStr = new Date().toISOString().replace(/[:.]/g, "-");
    const processedName = `atmolens/${mapType}/map_${tsStr}_enhanced.png`;
    const originalName = `atmolens/${mapType}/map_${tsStr}_original.gif`;

    const [processedBlob, originalBlob] = await Promise.all([
      put(processedName, processedBytes, { access: BLOB_ACCESS, contentType: "image/png" }),
      put(originalName, sourceBytes, { access: BLOB_ACCESS, contentType: "image/gif" }),
    ]);

    const ingestTimestamp = new Date();
    await storeMapMetadata({
      mapType,
      filename: processedName,
      blobUrl: processedBlob.url,
      originalUrl: originalBlob.url,
      timestamp: ingestTimestamp,
      hash: processedHash,
      sourceHash,
      processingVersion: version,
      sourceTimestamp,
      sourceSizeBytes: sourceBytes.byteLength,
      processedSizeBytes: processedBytes.byteLength,
      sourceUrl,
    });

    const elapsed = Date.now() - startedAt;
    await logIngestItem({
      runId,
      mapType,
      sourceUrl,
      status: "ok",
      attempts,
      sourceHttpStatus,
      sourceHash,
      processedHash,
      sourceTimestamp,
      sourceSizeBytes: sourceBytes.byteLength,
      processedSizeBytes: processedBytes.byteLength,
      durationMs: elapsed,
    });

    return {
      mapType,
      status: "ok",
      attempts,
      sourceHash,
      processedHash,
      sourceBytes: sourceBytes.byteLength,
      processedBytes: processedBytes.byteLength,
      sourceTimestamp: sourceTimestamp ? sourceTimestamp.toISOString() : null,
      ms: elapsed,
    };
  } catch (error) {
    if (error instanceof SourceFetchError) {
      attempts = Math.max(attempts, error.attempts);
      sourceHttpStatus = error.sourceHttpStatus || sourceHttpStatus;
    }
    const elapsed = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "Unknown map-processing error.";
    await logIngestItem({
      runId,
      mapType,
      sourceUrl,
      status: "failed",
      attempts: Math.max(attempts, 1),
      sourceHttpStatus,
      durationMs: elapsed,
      errorMessage: message,
    });
    return {
      mapType,
      status: "failed",
      attempts: Math.max(attempts, 1),
      error: message,
      sourceHttpStatus,
      ms: elapsed,
    };
  }
}

export async function GET(request: NextRequest) {
  // ── Auth gate: check CRON_SECRET when configured, allow same-origin frontend requests
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    const referer = request.headers.get("referer");
    const secFetchSite = request.headers.get("sec-fetch-site");
    
    const hasValidToken = authHeader === `Bearer ${cronSecret}`;
    const isSameOrigin = 
      secFetchSite === "same-origin" || 
      (referer && referer.startsWith(request.nextUrl.origin));
      
    if (!hasValidToken && !isSameOrigin) {
      return NextResponse.json(
        { status: "unauthorized", message: "Invalid or missing CRON_SECRET." },
        { status: 401 }
      );
    }
  }

  const rawTrigger = request.nextUrl.searchParams.get("trigger") ?? "cron";
  const trigger = rawTrigger.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32);
  const breakLockParam = request.nextUrl.searchParams.get("break_lock");
  const allowAutoBreak =
    trigger === "cron" ||
    trigger.startsWith("github-actions") ||
    trigger === "vercel-cron";
  const forceBreakLock =
    breakLockParam === "1" || (breakLockParam !== "0" && allowAutoBreak);
  const staleLockThresholdMinutes = parsePositiveInt(
    request.nextUrl.searchParams.get("lock_stale_minutes"),
    45
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
  const sourceEntries = Object.entries(SOURCES);
  let runId = 0;

  try {
    await initDb();

    // --- Auto-cleanup: enforce archive retention ---
    // Delete maps older than the retention period to stay within Vercel Blob 1GB Hobby limit
    try {
      const retainDays = Number.parseInt(process.env.ARCHIVE_RETENTION_DAYS ?? "14", 10);
      const cleanupResult = await cleanupOldMaps(retainDays);
      if (cleanupResult.deletedCount > 0) {
        console.log(`[AutoCleanup] Deleted ${cleanupResult.deletedCount} maps older than ${retainDays} days, ${cleanupResult.deletedUrls.length} blob URLs`);
        const CLEANUP_BATCH = 50;
        for (let i = 0; i < cleanupResult.deletedUrls.length; i += CLEANUP_BATCH) {
          try {
            await del(cleanupResult.deletedUrls.slice(i, i + CLEANUP_BATCH));
          } catch (delErr) {
            console.error(`[AutoCleanup] Blob delete batch failed:`, delErr);
          }
        }
      }
    } catch (cleanupErr) {
      console.error("[AutoCleanup] Cleanup failed (non-fatal):", cleanupErr);
    }

    const includeStaleReprocess = request.nextUrl.searchParams.get("reprocess") === "1";
    const staleBatchSize = parseBatchSize(
      request.nextUrl.searchParams.get("stale_batch"),
      DEFAULT_STALE_REPROCESS_BATCH
    );
    runId = await beginIngestRun(trigger, "enhancer-v14-v15-mixed", sourceEntries.length);

    let okCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const [mapType, sourceUrl] of sourceEntries) {
      const result = await processSingleMap(runId, mapType, sourceUrl);
      if (result.status === "ok") okCount++;
      else if (result.status === "skipped") skippedCount++;
      else failedCount++;
    }

    // --- Historical Re-processing Segment ---
    // Update a batch of stale maps (on older processing versions) to the latest version.
    // Handles orphaned blobs (deleted from storage but still in DB) gracefully.
    const REPROCESS_TIME_BUDGET_MS = 8_000;
    const MAX_FUNCTION_DURATION_MS = 55_000;
    let reprocessedCount = 0;
    let reprocessSkippedOrphans = 0;
    if (includeStaleReprocess && staleBatchSize > 0) {
      try {
        const staleMaps = await getStaleMaps(staleBatchSize);
        for (const stale of staleMaps) {
          // Time-budget check: stop early so the run can finalize cleanly
          const elapsed = Date.now() - startedAt;
          if (elapsed > MAX_FUNCTION_DURATION_MS - REPROCESS_TIME_BUDGET_MS) {
            console.log(`[Reprocess] Time budget exhausted after ${elapsed}ms, stopping with ${reprocessedCount} done.`);
            break;
          }

          try {
            // Fetch the original gif from blob storage
            const sourceRes = await fetch(stale.original_blob_url, { cache: "no-store" });

            // If the blob is gone (deleted/orphaned), mark it as current version
            // so getStaleMaps() stops returning it on every run.
            if (sourceRes.status === 403 || sourceRes.status === 404) {
              const targetVersion = getProcessingVersion(stale.map_type);
              console.warn(`[Reprocess] Blob gone (${sourceRes.status}) for map ${stale.id}, marking as ${targetVersion} to skip future runs.`);
              await updateMapMetadata(
                stale.id,
                stale.blob_url,
                stale.hash ?? "orphaned",
                targetVersion,
                stale.processed_size_bytes ?? 0
              );
              reprocessSkippedOrphans++;
              continue;
            }

            if (!sourceRes.ok) throw new Error(`Failed to fetch original blob for map ${stale.id} (HTTP ${sourceRes.status})`);

            const sourceBytes = Buffer.from(await sourceRes.arrayBuffer());

            // Process with new logic
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

            // Upload new processed blob
            const { url: newBlobUrl } = await put(stale.filename, processedBytes, {
              access: BLOB_ACCESS,
              contentType: "image/png",
            });

            // Delete the old blob from storage since put() generates a new one
            if (stale.blob_url && stale.blob_url !== newBlobUrl) {
              try {
                await del(stale.blob_url);
              } catch (delErr) {
                console.error(`[Reprocess] Failed to delete old blob ${stale.blob_url} for map ${stale.id}:`, delErr);
              }
            }

            // Update database
            await updateMapMetadata(stale.id, newBlobUrl, newProcessedHash, staleVersion, processedBytes.byteLength);
            reprocessedCount++;
          } catch (err) {
            console.error(`[Reprocess] Failed to re-process stale map ${stale.id}:`, err);
          }
        }
      } catch (error) {
        console.error("[Reprocess] Historical re-processing segment failed:", error);
      }
    } else if (!includeStaleReprocess) {
      console.info("[IngestRun] Inline stale re-processing skipped (set reprocess=1 to enable).");
    } else {
      console.info("[IngestRun] Inline stale re-processing skipped due to stale_batch=0.");
    }

    const duration = Date.now() - startedAt;
    const summary = {
      total: sourceEntries.length,
      ok: okCount,
      skipped: skippedCount,
      failed: failedCount,
      reprocessed: reprocessedCount,
      duration_ms: duration,
    };

    const runStatus = failedCount === 0 ? "ok" : okCount > 0 || skippedCount > 0 ? "partial" : "failed";
    await finalizeIngestRun(runId, runStatus, summary);

    return NextResponse.json(
      {
        status: "completed",
        run_id: runId,
        run_status: runStatus,
        processing_version: "enhancer-v14-v15-mixed",
        reprocessed: reprocessedCount,
        reprocess_orphans_cleared: reprocessSkippedOrphans,
        summary,
      },
      { status: runStatus === "failed" ? 500 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[IngestRun] Critical failure in run ${runId}:`, message);
    
    if (runId) {
      await finalizeIngestRun(runId, "failed", {
        total: sourceEntries.length,
        ok: 0,
        skipped: 0,
        failed: sourceEntries.length,
        duration_ms: Date.now() - startedAt,
      });
    }
    return NextResponse.json({ status: "error", message: "Internal server error during ingest run." }, { status: 500 });
  } finally {
    await releaseIngestLock();
  }
}
