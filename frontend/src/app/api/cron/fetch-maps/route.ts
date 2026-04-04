import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { put } from "@vercel/blob";
import {
  beginIngestRun,
  finalizeIngestRun,
  initDb,
  isLatestMapSignature,
  logIngestItem,
  releaseIngestLock,
  storeMapMetadata,
  tryAcquireIngestLock,
} from "@/lib/storage";
import { processImage } from "@/lib/processor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SOURCES: Record<string, string> = {
  surface_00z: "https://weather.gc.ca/data/analysis/jac00_100.gif",
  surface_06z: "https://weather.gc.ca/data/analysis/jac06_100.gif",
  surface_12z: "https://weather.gc.ca/data/analysis/jac12_100.gif",
  surface_18z: "https://weather.gc.ca/data/analysis/jac18_100.gif",
  upper_250hpa: "https://weather.gc.ca/data/analysis/sah_100.gif",
  upper_500hpa: "https://weather.gc.ca/data/analysis/sai_100.gif",
  upper_700hpa: "https://weather.gc.ca/data/analysis/saj_100.gif",
  upper_850hpa: "https://weather.gc.ca/data/analysis/saa_100.gif",
};

const PROCESSING_VERSION = "enhancer-v3";
const MAX_FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 25_000;
const PROCESS_TIMEOUT_MS = 40_000;
const MIN_SOURCE_BYTES = 4_000;

const BLOB_ACCESS: "public" | "private" =
  process.env.BLOB_ACCESS === "public" ? "public" : "private";

type SourceFetchResult = {
  response: Response;
  attempts: number;
  sourceHttpStatus: number;
};

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

async function fetchSourceWithRetries(url: string): Promise<SourceFetchResult> {
  let attempt = 0;
  let lastError: Error | null = null;
  let lastStatus = 0;

  while (attempt < MAX_FETCH_ATTEMPTS) {
    attempt += 1;
    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      lastStatus = response.status;
      if (response.ok) {
        return { response, attempts: attempt, sourceHttpStatus: response.status };
      }

      const retryable = response.status === 404 || response.status === 408 || response.status === 429 || response.status >= 500;
      if (!retryable) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(500 * attempt);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown fetch error");
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(500 * attempt);
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error(`Fetch failed after ${MAX_FETCH_ATTEMPTS} attempts (last status ${lastStatus})`);
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
    const fetchResult = await fetchSourceWithRetries(sourceUrl);
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
    const processedHash = crypto
      .createHash("sha256")
      .update(PROCESSING_VERSION)
      .update(mapType)
      .update(sourceHash)
      .digest("hex");

    if (await isLatestMapSignature(mapType, sourceHash, PROCESSING_VERSION)) {
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
      processingVersion: PROCESSING_VERSION,
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
  const lockAcquired = await tryAcquireIngestLock();
  if (!lockAcquired) {
    return NextResponse.json(
      {
        status: "busy",
        message: "Another ingest run is currently in progress.",
      },
      { status: 429 }
    );
  }

  const startedAt = Date.now();
  const sourceEntries = Object.entries(SOURCES);
  let runId = 0;

  try {
    await initDb();
    const trigger = request.nextUrl.searchParams.get("trigger") ?? "cron";
    runId = await beginIngestRun(trigger, PROCESSING_VERSION, sourceEntries.length);

    const results: MapRunResult[] = [];
    for (const [mapType, sourceUrl] of sourceEntries) {
      const result = await processSingleMap(runId, mapType, sourceUrl);
      results.push(result);
    }

    const okCount = results.filter((item) => item.status === "ok").length;
    const skippedCount = results.filter((item) => item.status === "skipped").length;
    const failedCount = results.filter((item) => item.status === "failed").length;
    const duration = Date.now() - startedAt;
    const summary = {
      total: sourceEntries.length,
      ok: okCount,
      skipped: skippedCount,
      failed: failedCount,
      duration_ms: duration,
    };

    const runStatus = failedCount === 0 ? "ok" : okCount > 0 || skippedCount > 0 ? "partial" : "failed";
    await finalizeIngestRun(runId, runStatus, summary);

    return NextResponse.json(
      {
        status: "completed",
        run_id: runId,
        run_status: runStatus,
        processing_version: PROCESSING_VERSION,
        summary,
        results,
      },
      { status: runStatus === "failed" ? 500 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingest run error.";
    if (runId) {
      await finalizeIngestRun(runId, "failed", {
        total: sourceEntries.length,
        ok: 0,
        skipped: 0,
        failed: sourceEntries.length,
        duration_ms: Date.now() - startedAt,
      });
    }
    return NextResponse.json({ status: "failed", run_id: runId || null, error: message }, { status: 500 });
  } finally {
    await releaseIngestLock();
  }
}
