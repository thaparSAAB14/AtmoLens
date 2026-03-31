import { NextResponse } from "next/server";
import { getArchive } from "@/lib/storage";
import { mapRowToArchiveEntry, type MapRow } from "@/lib/mapSerializers";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const archive = (await getArchive()).map((row) =>
          mapRowToArchiveEntry(row as MapRow)
        );
        return NextResponse.json({ archive, count: archive.length });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
