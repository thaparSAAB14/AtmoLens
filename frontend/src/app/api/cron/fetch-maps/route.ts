import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { initDb, isLatestMapHash, storeMapMetadata } from '@/lib/storage';
import { processImage } from '@/lib/processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow sufficient time for all 8 maps

const SOURCES: Record<string, string> = {
    "surface_00z": "https://weather.gc.ca/data/analysis/jac00_100.gif",
    "surface_06z": "https://weather.gc.ca/data/analysis/jac06_100.gif",
    "surface_12z": "https://weather.gc.ca/data/analysis/jac12_100.gif",
    "surface_18z": "https://weather.gc.ca/data/analysis/jac18_100.gif",
    "upper_250hpa": "https://weather.gc.ca/data/analysis/sah_100.gif",
    "upper_500hpa": "https://weather.gc.ca/data/analysis/sai_100.gif",
    "upper_700hpa": "https://weather.gc.ca/data/analysis/saj_100.gif",
    "upper_850hpa": "https://weather.gc.ca/data/analysis/saa_100.gif",
};

const BLOB_ACCESS: "public" | "private" =
    process.env.BLOB_ACCESS === "public" ? "public" : "private";

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            cache: 'no-store',
            signal: controller.signal,
            headers: {
                // Be polite + improve compatibility with some CDNs.
                'User-Agent': 'AtmoLens/3.x (+https://vercel.com)',
            },
        });
    } finally {
        clearTimeout(timeout);
    }
}

export async function GET() {
    try {
        await initDb(); // Ensure tables before writing
        const results = [];
        
        for (const [mapType, url] of Object.entries(SOURCES)) {
            const startedAt = Date.now();
            try {
                const res = await fetchWithTimeout(url, 25_000);
                if (!res.ok) {
                    results.push({ mapType, error: `Fetch failed: ${res.status} ${res.statusText}` });
                    continue;
                }

                const arrayBuffer = await res.arrayBuffer();
                const rawBytes = Buffer.from(arrayBuffer);

                // Generate SHA-256 Hash (scoped by mapType to avoid cross-type collisions)
                const fileHash = crypto
                    .createHash('sha256')
                    .update(mapType)
                    .update(rawBytes)
                    .digest('hex');

                // Skip only if the newest saved map for this type is unchanged.
                if (await isLatestMapHash(mapType, fileHash)) {
                    results.push({ mapType, skipped: true });
                    continue;
                }

                // TS Processor (Jimp)
                const processedBytes = await processImage(rawBytes, mapType);

                const tsStr = new Date().toISOString().replace(/[:.]/g, '-');
                const processedName = `atmolens/${mapType}/map_${tsStr}_enhanced.png`;
                const originalName = `atmolens/${mapType}/map_${tsStr}_original.gif`;

                // Vercel Blob
                const [processedBlob, originalBlob] = await Promise.all([
                    put(processedName, processedBytes, { access: BLOB_ACCESS, contentType: 'image/png' }),
                    put(originalName, rawBytes, { access: BLOB_ACCESS, contentType: 'image/gif' }),
                ]);

                // Neon DB
                await storeMapMetadata(
                    mapType,
                    processedName,
                    processedBlob.url,
                    originalBlob.url,
                    new Date(),
                    fileHash
                );

                results.push({
                    mapType,
                    processed: processedBlob.url,
                    original: originalBlob.url,
                    ms: Date.now() - startedAt,
                });
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Unknown error";
                results.push({ mapType, error: message });
            }
        }
        
        const okCount = results.filter((r) => (r as { processed?: string; skipped?: boolean }).processed || (r as { skipped?: boolean }).skipped).length;
        const status = okCount > 0 ? 200 : 500;
        return NextResponse.json({ status: "cron completed", results }, { status });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
