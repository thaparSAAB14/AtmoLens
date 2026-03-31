import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const HERBIE_IMAGE_PATH = path.join(process.cwd(), "public", "herbie", "gdps_t2m_latest.png");
const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2x0AAAAASUVORK5CYII=",
  "base64"
);

export async function GET() {
  try {
    const image = await fs.readFile(HERBIE_IMAGE_PATH);
    return new NextResponse(new Uint8Array(image), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "X-Herbie-Status": "ready",
      },
    });
  } catch {
    return new NextResponse(new Uint8Array(TRANSPARENT_PIXEL), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
        "X-Herbie-Status": "missing",
      },
    });
  }
}
