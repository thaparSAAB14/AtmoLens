import { NextResponse } from "next/server";
import { cleanupOldMaps } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const deleted = await cleanupOldMaps();
    return NextResponse.json({ status: "cleanup completed", deleted });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

