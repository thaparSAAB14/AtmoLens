import { NextRequest, NextResponse } from "next/server";
import { initDb, getDb } from "@/lib/storage";
import { list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Hobby max allowed

export async function GET(request: NextRequest) {
  try {
    // Auth check temporarily disabled for manual sweep
    // const authHeader = request.headers.get("Authorization");
    // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    await initDb();
    const sql = getDb();
    
    // Get all valid URLs from the database
    const rows = await sql`SELECT blob_url, original_blob_url FROM maps`;
    const validUrls = new Set<string>();
    
    for (const row of rows) {
      if (row.blob_url) validUrls.add(String(row.blob_url));
      if (row.original_blob_url) validUrls.add(String(row.original_blob_url));
    }

    // List all blobs
    let cursor: string | undefined;
    let hasMore = true;
    let totalBlobs = 0;
    const orphans: string[] = [];

    while (hasMore) {
      const listResult = await list({ cursor, limit: 1000 });
      for (const blob of listResult.blobs) {
        totalBlobs++;
        if (!validUrls.has(blob.url)) {
          orphans.push(blob.url);
        }
      }
      hasMore = listResult.hasMore;
      cursor = listResult.cursor;
    }

    // Delete orphans
    let deletedCount = 0;
    // Batch delete to avoid hitting URL length limits or timeouts (max 500 per call is safe)
    const batchSize = 100;
    for (let i = 0; i < orphans.length; i += batchSize) {
      const batch = orphans.slice(i, i + batchSize);
      await del(batch);
      deletedCount += batch.length;
    }

    return NextResponse.json({
      status: "cleanup-orphans completed",
      total_blobs_scanned: totalBlobs,
      valid_urls_in_db: validUrls.size,
      orphans_found: orphans.length,
      blobs_deleted: deletedCount
    });

  } catch (e: unknown) {
    console.error("[CleanupOrphansAPI] Critical failure:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
