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
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
