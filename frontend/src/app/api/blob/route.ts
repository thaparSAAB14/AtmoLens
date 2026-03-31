import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

const BLOB_ACCESS: "public" | "private" =
  process.env.BLOB_ACCESS === "public" ? "public" : "private";

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    const result = await get(normalizePath(path), { access: BLOB_ACCESS });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.statusCode !== 200) {
      return NextResponse.json({ error: "Not modified" }, { status: 304 });
    }

    const headers = new Headers();
    headers.set("content-type", result.blob.contentType || "application/octet-stream");
    headers.set("cache-control", result.blob.cacheControl || "public, max-age=86400");
    headers.set("etag", result.blob.etag);

    return new NextResponse(result.stream, { headers });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
