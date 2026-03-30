import { NextResponse } from "next/server";
import { getArchive } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const archive = await getArchive();
        return NextResponse.json({
            system: "AtmoLens",
            version: "3.0.0 (Vercel Next.js Native)",
            status: "online",
            archive_count: archive.length,
        });
    } catch (e: any) {
        return NextResponse.json(
            { 
                status: "offline", 
                error: e.message 
            }, 
            { status: 500 }
        );
    }
}
