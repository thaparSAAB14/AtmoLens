import { NextRequest, NextResponse } from "next/server";
import { cleanupOldMaps, pruneMapsByCount } from "@/lib/storage";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    // Mode: ?mode=prune (default) keeps N maps per type, ?mode=age deletes by age
    const mode = request.nextUrl.searchParams.get("mode") ?? "prune";

    // For prune mode: how many maps to keep per type (default 3)
    const keepPerType = Math.max(
      1,
      Math.min(
        50,
        Number.parseInt(
          request.nextUrl.searchParams.get("keep") ?? "3",
          10
        ) || 3
      )
    );

    // For age mode: how many days to keep (default from env or 90)
    const retainDays = Number.parseInt(
      request.nextUrl.searchParams.get("days") ??
        process.env.ARCHIVE_RETENTION_DAYS ??
        "90",
      10
    );

    let deletedCount = 0;
    let deletedUrls: string[] = [];

    if (mode === "prune") {
      const result = await pruneMapsByCount(keepPerType);
      deletedCount = result.deletedCount;
      deletedUrls = result.deletedUrls;
    } else {
      const safeDays = Number.isFinite(retainDays)
        ? Math.min(365, Math.max(7, retainDays))
        : 90;
      const result = await cleanupOldMaps(safeDays);
      deletedCount = result.deletedCount;
      deletedUrls = result.deletedUrls;
    }

    // Delete blobs from Vercel Blob storage in batches
    let blobsDeleted = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < deletedUrls.length; i += BATCH_SIZE) {
      const batch = deletedUrls.slice(i, i + BATCH_SIZE);
      try {
        await del(batch);
        blobsDeleted += batch.length;
      } catch (delErr) {
        console.error(
          `[CleanupAPI] Failed to delete blob batch ${i}-${i + batch.length}:`,
          delErr
        );
      }
    }

    return NextResponse.json({
      status: "cleanup completed",
      mode,
      deleted_db_records: deletedCount,
      blobs_deleted: blobsDeleted,
      blobs_total: deletedUrls.length,
      ...(mode === "prune"
        ? { keep_per_type: keepPerType }
        : { retain_days: retainDays }),
    });
  } catch (e: unknown) {
    console.error("[CleanupAPI] Critical failure:", e);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
