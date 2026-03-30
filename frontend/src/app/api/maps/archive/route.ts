import { NextResponse } from "next/server";
import { getArchive } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const archive = await getArchive();
        return NextResponse.json({ archive, count: archive.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
