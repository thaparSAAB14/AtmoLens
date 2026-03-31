import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEOMET_WMS_ENDPOINT = "https://geo.weather.gc.ca/geomet";
const ALLOWED_FORMATS = new Set(["image/png", "image/png8", "image/gif"]);

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const service = params.get("service")?.toUpperCase() ?? "WMS";
  const request = params.get("request")?.toUpperCase() ?? "GETMAP";
  const version = params.get("version") ?? "1.3.0";
  const layers = params.get("layers");
  const bbox = params.get("bbox");
  const crs = params.get("crs") ?? "EPSG:4326";
  const width = params.get("width") ?? "1400";
  const height = params.get("height") ?? "900";
  const format = params.get("format") ?? "image/png";
  const styles = params.get("styles") ?? "";
  const transparent = params.get("transparent") ?? "true";
  const time = params.get("time") ?? undefined;

  if (!layers || !bbox) {
    return NextResponse.json(
      { error: "Missing required parameters: layers and bbox are required." },
      { status: 400 }
    );
  }

  if (!ALLOWED_FORMATS.has(format)) {
    return NextResponse.json({ error: "Unsupported output format." }, { status: 400 });
  }

  const upstream = new URL(GEOMET_WMS_ENDPOINT);
  upstream.searchParams.set("service", service);
  upstream.searchParams.set("request", request);
  upstream.searchParams.set("version", version);
  upstream.searchParams.set("layers", layers);
  upstream.searchParams.set("styles", styles);
  upstream.searchParams.set("transparent", transparent);
  upstream.searchParams.set("format", format);
  upstream.searchParams.set("crs", crs);
  upstream.searchParams.set("bbox", bbox);
  upstream.searchParams.set("width", width);
  upstream.searchParams.set("height", height);
  if (time) upstream.searchParams.set("time", time);

  const response = await fetch(upstream, {
    cache: "no-store",
    headers: {
      "User-Agent": "AtmoLens/3.x (+https://vercel.com)",
      Accept: "image/png,image/gif,*/*",
    },
  });

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
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
