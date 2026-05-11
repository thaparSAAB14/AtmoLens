import { NextRequest, NextResponse } from "next/server";
import { cleanupOldMaps } from "@/lib/storage";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Basic auth check for maintenance operations
    const authHeader = request.headers.get("Authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retainDays = Number.parseInt(process.env.ARCHIVE_RETENTION_DAYS ?? "90", 10);
    const { deletedCount, deletedUrls } = await cleanupOldMaps(
      Number.isFinite(retainDays) ? Math.min(365, Math.max(7, retainDays)) : 90
    );

    if (deletedUrls.length > 0) {
      await del(deletedUrls);
    }

    return NextResponse.json({ 
      status: "cleanup completed", 
      deleted: deletedCount, 
      blobs_deleted: deletedUrls.length,
      retain_days: retainDays 
    });
  } catch (e: unknown) {
    console.error("[CleanupAPI] Critical failure:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
