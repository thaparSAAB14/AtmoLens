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
    console.error("[LatestTypeAPI] Critical failure:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
