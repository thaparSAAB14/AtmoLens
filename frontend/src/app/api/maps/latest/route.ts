import { NextResponse } from "next/server";
import { getLatestManifest } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const manifest = await getLatestManifest();
        if (Object.keys(manifest).length === 0) {
            return NextResponse.json({ maps: {}, message: "No maps processed yet" });
        }
        return NextResponse.json({ maps: manifest });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
