import { NextResponse } from "next/server";
import { getLatestMapForType } from "@/lib/storage";
import { mapRowToMapInfo, type MapRow } from "@/lib/mapSerializers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mapType: string }> }
) {
  try {
    const p = await params;
    const row = await getLatestMapForType(p.mapType);
    if (!row) {
      return NextResponse.json(
        { error: "Map not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(mapRowToMapInfo(row as MapRow));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
