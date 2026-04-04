import { NextResponse } from "next/server";
import { cleanupOldMaps } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const retainDays = Number.parseInt(process.env.ARCHIVE_RETENTION_DAYS ?? "90", 10);
    const deleted = await cleanupOldMaps(
      Number.isFinite(retainDays) ? Math.min(365, Math.max(7, retainDays)) : 90
    );
    return NextResponse.json({ status: "cleanup completed", deleted, retain_days: retainDays });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
