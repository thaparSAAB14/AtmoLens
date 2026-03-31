import { NextResponse } from "next/server";
import { getArchiveCount, getLastFetchTime, getMapTypes } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [archiveCount, lastFetchTime, mapTypes] = await Promise.all([
          getArchiveCount(),
          getLastFetchTime(),
          getMapTypes(),
        ]);
        return NextResponse.json({
            system: "AtmoLens",
            version: "3.0.7 (RDPA Overlay + Adaptive Enhancer)",
            status: "online",
            archive_count: archiveCount,
            map_types: mapTypes,
            scheduler: {
              running: true,
              last_fetch_time: lastFetchTime,
              last_fetch_result: null,
              maps_processed_total: archiveCount,
              next_scheduled_run: null,
              fetch_interval_minutes: 30,
            },
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json(
            { 
                status: "offline", 
                error: message 
            }, 
            { status: 500 }
        );
    }
}
