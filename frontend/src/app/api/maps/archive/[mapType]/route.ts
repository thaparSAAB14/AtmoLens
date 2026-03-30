import { NextResponse } from "next/server";
import { getArchive } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ mapType: string }> }) {
    try {
        const p = await params;
        const archive = await getArchive(p.mapType);
        return NextResponse.json({ archive, count: archive.length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
