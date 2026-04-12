import { NextRequest, NextResponse } from "next/server";
import { getStaleMaps, updateMapMetadata, initDb } from "@/lib/storage";
import { processImage } from "@/lib/processor";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300; 

const TARGET_VERSION = "enhancer-v5";
const BATCH_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const staleMaps = await getStaleMaps(TARGET_VERSION, BATCH_SIZE, offset);
    
    if (staleMaps.length === 0) {
      return NextResponse.json({ status: "completed", message: "No stale maps found at this offset.", offset });
    }

    const results = [];
    const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";

    for (const map of staleMaps) {
      try {
        if (!map.original_blob_url) {
           results.push({ id: map.id, status: "failed", error: "Missing original_blob_url" });
           continue;
        }

        // Fetch the original GIF source from Blob storage and securely attach the Read/Write token to prevent 403s
        const response = await fetch(map.original_blob_url, {
             headers: {
                 "Authorization": `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
             }
        });
        if (!response.ok) throw new Error(`Failed to fetch original: ${response.status}`);
        
        const sourceBuffer = Buffer.from(await response.arrayBuffer());

        // Re-process using the new enhancer logic
        const processedBuffer = await processImage(sourceBuffer, map.map_type);
        
        // Re-calculate hashes
        const sourceHash = map.source_hash || crypto.createHash("sha256").update(sourceBuffer).digest("hex");
        const processedHash = crypto
          .createHash("sha256")
          .update(TARGET_VERSION)
          .update(map.map_type)
          .update(sourceHash)
          .digest("hex");

        const baseName = map.filename.replace(".png", "");
        const newFilename = `${baseName}_v5.png`;

        const newBlob = await put(newFilename, processedBuffer, {
          access: BLOB_ACCESS,
          contentType: "image/png"
        });

        // Update the Database record
        await updateMapMetadata(
            Number(map.id), 
            newBlob.url, 
            processedHash, 
            TARGET_VERSION, 
            processedBuffer.length
        );

        results.push({ id: map.id, status: "ok", map_type: map.map_type, new_url: newBlob.url });
      } catch (err) {
        results.push({ id: map.id, status: "failed", error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({
      status: "partial",
      processed: results.length,
      offset,
      results
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
