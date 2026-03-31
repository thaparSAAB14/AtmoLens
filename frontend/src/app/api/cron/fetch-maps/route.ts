import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { initDb, storeMapMetadata } from '@/lib/storage';
import { processImage, convertOriginalToPng } from '@/lib/processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow sufficient time for all 8 maps

const SOURCES: Record<string, string> = {
    "surface_00z": "https://weather.gc.ca/data/analysis/jac00_100.gif",
    "surface_06z": "https://weather.gc.ca/data/analysis/jac06_100.gif",
    "surface_12z": "https://weather.gc.ca/data/analysis/jac12_100.gif",
    "surface_18z": "https://weather.gc.ca/data/analysis/jac18_100.gif",
    "upper_250hpa": "https://weather.gc.ca/data/analysis/upr25_100.gif",
    "upper_500hpa": "https://weather.gc.ca/data/analysis/upr50_100.gif",
    "upper_700hpa": "https://weather.gc.ca/data/analysis/upr70_100.gif",
    "upper_850hpa": "https://weather.gc.ca/data/analysis/upr85_100.gif",
};

export async function GET() {
    try {
        await initDb(); // Ensure tables before writing
        const results = [];
        
        for (const [mapType, url] of Object.entries(SOURCES)) {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            
            const arrayBuffer = await res.arrayBuffer();
            const rawBytes = Buffer.from(arrayBuffer);
            
            // Generate SHA-256 Hash
            const fileHash = crypto.createHash('sha256').update(rawBytes).digest('hex');
            
            // TS Processor (Jimp)
            const processedBytes = await processImage(rawBytes);
            const originalPng = await convertOriginalToPng(rawBytes);
            
            const tsStr = new Date().toISOString().replace(/[:.]/g, '-');
            const processedName = `atmolens/${mapType}/map_${tsStr}_enhanced.png`;
            const originalName = `atmolens/${mapType}/map_${tsStr}_original.png`;
            
            // Vercel Blob
            const processedBlob = await put(processedName, processedBytes, { access: 'public' });
            const originalBlob = await put(originalName, originalPng, { access: 'public' });
            
            // Neon DB
            await storeMapMetadata(
                mapType,
                processedName,
                processedBlob.url,
                originalBlob.url,
                new Date(),
                fileHash
            );
            
            results.push({ mapType, processed: processedBlob.url });
        }
        
        return NextResponse.json({ status: "cron completed", results });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
