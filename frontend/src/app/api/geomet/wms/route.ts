import { NextRequest, NextResponse } from "next/server";
import { GEOMET_WMS_LAYER_NAMES } from "@/lib/geomet";

export const dynamic = "force-dynamic";

const GEOMET_WMS_ENDPOINT = "https://geo.weather.gc.ca/geomet";
const ALLOWED_FORMATS = new Set(["image/png"]);
const IS_WMS_PROXY_ENABLED = process.env.ENABLE_GEOMET_WMS !== "false";
const ALLOWED_SRS = new Set(["EPSG:4326", "EPSG:3857"]);
const MAX_IMAGE_DIMENSION = 2048;

function clampDimension(value: string | null, fallback: number): string {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return String(fallback);
  return String(Math.min(parsed, MAX_IMAGE_DIMENSION));
}

export async function GET(req: NextRequest) {
  if (!IS_WMS_PROXY_ENABLED) {
    return NextResponse.json(
      { error: "GeoMet WMS proxy is disabled by environment configuration." },
      { status: 503 }
    );
  }

  const params = req.nextUrl.searchParams;

  const service = params.get("service")?.toUpperCase() ?? "WMS";
  const request = params.get("request")?.toUpperCase() ?? "GETMAP";
  const version = params.get("version") ?? "1.1.1";
  const layers = params.get("layers");
  const bbox = params.get("bbox");
  const crs = params.get("crs") ?? params.get("srs") ?? "EPSG:4326";
  const width = clampDimension(params.get("width"), 1400);
  const height = clampDimension(params.get("height"), 900);
  const format = params.get("format") ?? "image/png";
  const styles = params.get("styles") ?? params.get("style") ?? "";
  const transparent = params.get("transparent") ?? "true";
  const time = params.get("time") ?? undefined;
  const referenceTime = params.get("dim_reference_time") ?? undefined;

  if (!layers || !bbox) {
    return NextResponse.json(
      { error: "Missing required parameters: layers and bbox are required." },
      { status: 400 }
    );
  }

  if (!ALLOWED_FORMATS.has(format)) {
    return NextResponse.json({ error: "Unsupported output format." }, { status: 400 });
  }
  if (!ALLOWED_SRS.has(crs)) {
    return NextResponse.json({ error: "Unsupported CRS/SRS." }, { status: 400 });
  }

  const requestedLayers = layers.split(",").map((layer) => layer.trim()).filter(Boolean);
  if (requestedLayers.length === 0 || requestedLayers.some((layer) => !GEOMET_WMS_LAYER_NAMES.has(layer))) {
    return NextResponse.json(
      { error: "Unsupported layer request." },
      { status: 400 }
    );
  }

  const upstream = new URL(GEOMET_WMS_ENDPOINT);
  upstream.searchParams.set("service", service);
  upstream.searchParams.set("request", request);
  upstream.searchParams.set("version", version);
  upstream.searchParams.set("layers", layers);
  upstream.searchParams.set("styles", styles);
  upstream.searchParams.set("transparent", transparent);
  upstream.searchParams.set("format", format);
  if (version === "1.3.0") {
    upstream.searchParams.set("crs", crs);
  } else {
    upstream.searchParams.set("srs", crs);
  }
  upstream.searchParams.set("bbox", bbox);
  upstream.searchParams.set("width", width);
  upstream.searchParams.set("height", height);
  if (time) upstream.searchParams.set("time", time);
  if (referenceTime) upstream.searchParams.set("dim_reference_time", referenceTime);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(upstream, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "AtmoLens/3.x (+https://vercel.com)",
        Accept: "image/png,*/*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upstream error.";
    return NextResponse.json({ error: `GeoMet request failed: ${message}` }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `GeoMet request failed: ${response.status} ${response.statusText}` },
      { status: response.status }
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
