import { NextRequest, NextResponse } from "next/server";
import { getArchive } from "@/lib/storage";
import { mapRowToArchiveEntry, type MapRow } from "@/lib/mapSerializers";

export const dynamic = 'force-dynamic';

function parseArchiveDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
  if (!Number.isFinite(raw)) return 30;
  return Math.min(365, Math.max(1, raw));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mapType: string }> }
) {
    try {
        const p = await params;
        const days = parseArchiveDays(request);
        const archive = (await getArchive(p.mapType, days)).map((row) =>
          mapRowToArchiveEntry(row as MapRow)
        );
        return NextResponse.json({ archive, count: archive.length, days_window: days });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
