import { NextResponse } from "next/server";
import { getLatestManifest } from "@/lib/storage";
import { mapRowToMapInfo, type MapRow } from "@/lib/mapSerializers";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const manifest = await getLatestManifest();
        if (Object.keys(manifest).length === 0) {
            return NextResponse.json({ maps: {}, message: "No maps processed yet" });
        }
        const maps = Object.fromEntries(
          Object.entries(manifest).map(([mapType, row]) => [
            mapType,
            mapRowToMapInfo(row as MapRow),
          ])
        );
        return NextResponse.json({ maps });
    } catch (e: unknown) {
        console.error("[LatestAPI] Critical failure:", e);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
