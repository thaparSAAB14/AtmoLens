import { NextResponse } from "next/server";
import { getArchiveCount, getLastFetchTime, getLatestIngestRun, getMapTypes } from "@/lib/storage";

export const dynamic = "force-dynamic";

const HEALTH_STALE_MINUTES = 95;

function minutesSince(value: string | null): number | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 60_000);
}

export async function GET() {
  try {
    const [archiveCount, lastFetchTime, mapTypes, latestRun] = await Promise.all([
      getArchiveCount(undefined, 30),
      getLastFetchTime(),
      getMapTypes(),
      getLatestIngestRun(),
    ]);

    const lastRun = latestRun.run;
    const sinceLastFetchMin = minutesSince(lastFetchTime);
    const stale = sinceLastFetchMin !== null && sinceLastFetchMin > HEALTH_STALE_MINUTES;
    const degraded = stale || lastRun?.status === "failed";

    return NextResponse.json({
      system: "AtmoLens",
      version: "3.2.1 (Autonomous Pipeline + Cron Activation Fix)",
      status: degraded ? "degraded" : "online",
      archive_count: archiveCount,
      map_types: mapTypes,
      scheduler: {
        running: true,
        last_fetch_time: lastFetchTime,
        last_fetch_result: lastRun?.status ?? null,
        maps_processed_total: archiveCount,
        next_scheduled_run: null,
        fetch_interval_minutes: 30,
      },
      ingest_health: {
        stale,
        minutes_since_last_fetch: sinceLastFetchMin,
        latest_run: lastRun
          ? {
              id: Number(lastRun.id),
              status: String(lastRun.status),
              trigger: String(lastRun.trigger),
              processing_version: String(lastRun.processing_version),
              total_maps: Number(lastRun.total_maps),
              ok_maps: Number(lastRun.ok_maps),
              skipped_maps: Number(lastRun.skipped_maps),
              failed_maps: Number(lastRun.failed_maps),
              started_at: String(lastRun.started_at),
              finished_at: lastRun.finished_at ? String(lastRun.finished_at) : null,
              summary: lastRun.summary ?? null,
            }
          : null,
        latest_items: latestRun.items.slice(0, 16),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ status: "offline", error: message }, { status: 500 });
  }
}
