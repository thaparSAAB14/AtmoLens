import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const HERBIE_STATUS_PATH = path.join(process.cwd(), "public", "herbie", "gdps_t2m_latest.json");

type HerbieStatus = {
  pipeline: string;
  status: "ready" | "missing" | "error";
  generated_at_utc: string | null;
  model: string;
  product: string;
  variable: string;
  level: string;
  run_utc: string | null;
  fxx: number;
  details?: string;
};

const DEFAULT_STATUS: HerbieStatus = {
  pipeline: "herbie-gdps-t2m",
  status: "missing",
  generated_at_utc: null,
  model: "gdps",
  product: "15km/grib2/lat_lon",
  variable: "TMP",
  level: "TGL_2",
  run_utc: null,
  fxx: 0,
  details: "No generated Herbie artifact yet. Run the Herbie pipeline script.",
};

export async function GET() {
  try {
    const payload = await fs.readFile(HERBIE_STATUS_PATH, "utf-8");
    const parsed = JSON.parse(payload) as Partial<HerbieStatus>;
    return NextResponse.json(
      {
        ...DEFAULT_STATUS,
        ...parsed,
        pipeline: "herbie-gdps-t2m",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch {
    return NextResponse.json(DEFAULT_STATUS, { status: 200 });
  }
}
