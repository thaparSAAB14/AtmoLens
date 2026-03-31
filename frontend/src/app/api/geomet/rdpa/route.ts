import { NextRequest, NextResponse } from "next/server";
import { Jimp } from "jimp";
import { RDPA_COLLECTION_IDS } from "@/lib/geomet";

export const dynamic = "force-dynamic";

const GEOMET_OGC_API = "https://api.weather.gc.ca/collections";
const RDPA_NODATA = 9999;
const MAX_DIMENSION = 1800;
const FETCH_TIMEOUT_MS = 25_000;
const MIN_VISIBLE_PRECIP_MM = 0.2;
const DEFAULT_COLLECTION_BBOX: [number, number, number, number] = [-180, 24.4, 180, 90];
const DEFAULT_TARGET_BBOX: [number, number, number, number] = [-175, 10, -15, 85];
const IS_RDPA_GENERATION_ENABLED = process.env.ENABLE_RDPA_GENERATION !== "false";

type CoveragePayload = {
  domain?: {
    axes?: {
      x?: { num?: number };
      y?: { num?: number };
    };
  };
  ranges?: {
    APCP?: {
      values?: number[];
      shape?: number[];
    };
  };
};

type CollectionPayload = {
  extent?: {
    spatial?: {
      bbox?: number[][];
    };
  };
};

type RGBA = { r: number; g: number; b: number; a: number };
type JimpLike = {
  getBuffer: (
    mime: string,
    cb?: (err: unknown, buffer: Buffer) => void
  ) => Promise<Buffer> | Buffer | void;
};

const PRECIP_COLORS: ReadonlyArray<{ min: number; color: RGBA }> = [
  { min: MIN_VISIBLE_PRECIP_MM, color: { r: 212, g: 230, b: 255, a: 45 } },
  { min: 0.5, color: { r: 170, g: 208, b: 255, a: 90 } },
  { min: 1, color: { r: 107, g: 174, b: 214, a: 120 } },
  { min: 2, color: { r: 49, g: 130, b: 189, a: 145 } },
  { min: 5, color: { r: 33, g: 113, b: 181, a: 170 } },
  { min: 10, color: { r: 8, g: 81, b: 156, a: 190 } },
  { min: 20, color: { r: 44, g: 127, b: 44, a: 210 } },
  { min: 30, color: { r: 153, g: 216, b: 44, a: 220 } },
  { min: 50, color: { r: 254, g: 196, b: 79, a: 230 } },
  { min: 75, color: { r: 222, g: 45, b: 38, a: 240 } },
];

function clampDimension(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_DIMENSION);
}

function parseBbox(value: string | null, fallback: [number, number, number, number]): [number, number, number, number] {
  if (!value) return fallback;
  const parts = value.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return fallback;
  const [minLon, minLat, maxLon, maxLat] = parts;
  if (minLon >= maxLon || minLat >= maxLat) return fallback;
  return [minLon, minLat, maxLon, maxLat];
}

function parseCollectionBbox(payload: CollectionPayload | null | undefined): [number, number, number, number] | null {
  const bbox = payload?.extent?.spatial?.bbox?.[0];
  if (!bbox || bbox.length < 4) return null;
  const minLon = Number(bbox[0]);
  const minLat = Number(bbox[1]);
  const maxLon = Number(bbox[2]);
  const maxLat = Number(bbox[3]);
  if (![minLon, minLat, maxLon, maxLat].every((value) => Number.isFinite(value))) return null;
  if (minLon >= maxLon || minLat >= maxLat) return null;
  return [minLon, minLat, maxLon, maxLat];
}

function colorForPrecip(value: number): RGBA {
  if (!Number.isFinite(value) || value < MIN_VISIBLE_PRECIP_MM || value >= RDPA_NODATA) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  let selected = PRECIP_COLORS[0].color;
  for (const step of PRECIP_COLORS) {
    if (value >= step.min) {
      selected = step.color;
    } else {
      break;
    }
  }
  return selected;
}

async function imageToBuffer(image: JimpLike, mime: string): Promise<Buffer> {
  const output = image.getBuffer(mime);
  if (Buffer.isBuffer(output)) return output;
  if (output && typeof (output as Promise<Buffer>).then === "function") {
    return await (output as Promise<Buffer>);
  }
  return await new Promise<Buffer>((resolve, reject) => {
    image.getBuffer(mime, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function buildRenderedRgba(
  values: number[],
  srcWidth: number,
  srcHeight: number,
  outWidth: number,
  outHeight: number,
  sourceBbox: [number, number, number, number],
  targetBbox: [number, number, number, number]
): Buffer {
  const rgba = Buffer.allocUnsafe(outWidth * outHeight * 4);
  const [srcMinLon, srcMinLat, srcMaxLon, srcMaxLat] = sourceBbox;
  const [targetMinLon, targetMinLat, targetMaxLon, targetMaxLat] = targetBbox;
  const srcLonSpan = srcMaxLon - srcMinLon;
  const srcLatSpan = srcMaxLat - srcMinLat;
  const targetLonSpan = targetMaxLon - targetMinLon;
  const targetLatSpan = targetMaxLat - targetMinLat;
  if (srcLonSpan <= 0 || srcLatSpan <= 0 || targetLonSpan <= 0 || targetLatSpan <= 0) {
    return Buffer.alloc(outWidth * outHeight * 4, 0);
  }

  for (let y = 0; y < outHeight; y += 1) {
    const lat = targetMaxLat - ((y + 0.5) / outHeight) * targetLatSpan;
    if (lat < srcMinLat || lat > srcMaxLat) {
      for (let x = 0; x < outWidth; x += 1) {
        const outOffset = (y * outWidth + x) * 4;
        rgba[outOffset] = 0;
        rgba[outOffset + 1] = 0;
        rgba[outOffset + 2] = 0;
        rgba[outOffset + 3] = 0;
      }
      continue;
    }
    const srcY = Math.max(
      0,
      Math.min(srcHeight - 1, Math.floor(((srcMaxLat - lat) / srcLatSpan) * (srcHeight - 1)))
    );
    const srcRowOffset = srcY * srcWidth;

    for (let x = 0; x < outWidth; x += 1) {
      const outOffset = (y * outWidth + x) * 4;
      const lon = targetMinLon + ((x + 0.5) / outWidth) * targetLonSpan;
      if (lon < srcMinLon || lon > srcMaxLon) {
        rgba[outOffset] = 0;
        rgba[outOffset + 1] = 0;
        rgba[outOffset + 2] = 0;
        rgba[outOffset + 3] = 0;
        continue;
      }

      const srcX = Math.max(
        0,
        Math.min(srcWidth - 1, Math.floor(((lon - srcMinLon) / srcLonSpan) * (srcWidth - 1)))
      );
      const value = values[srcRowOffset + srcX];
      const color = colorForPrecip(value);
      rgba[outOffset] = color.r;
      rgba[outOffset + 1] = color.g;
      rgba[outOffset + 2] = color.b;
      rgba[outOffset + 3] = color.a;
    }
  }

  return rgba;
}

async function fetchJsonWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "AtmoLens/3.x (+https://vercel.com)" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest) {
  if (!IS_RDPA_GENERATION_ENABLED) {
    return NextResponse.json(
      { error: "RDPA generation is disabled by environment configuration." },
      { status: 503 }
    );
  }

  const params = req.nextUrl.searchParams;
  const collection = params.get("collection") ?? "weather:rdpa:10km:6f";
  if (!RDPA_COLLECTION_IDS.has(collection)) {
    return NextResponse.json({ error: "Unsupported RDPA collection request." }, { status: 400 });
  }

  const outWidth = clampDimension(params.get("width"), 1400);
  const outHeight = clampDimension(params.get("height"), 900);
  const targetBbox = parseBbox(params.get("bbox"), DEFAULT_TARGET_BBOX);

  const encodedCollection = encodeURIComponent(collection);
  const coverageUrl = `${GEOMET_OGC_API}/${encodedCollection}/coverage?f=json`;
  const metadataUrl = `${GEOMET_OGC_API}/${encodedCollection}?f=json`;
  let coverageResponse: Response;
  let metadataResponse: Response;
  try {
    [coverageResponse, metadataResponse] = await Promise.all([
      fetchJsonWithTimeout(coverageUrl),
      fetchJsonWithTimeout(metadataUrl),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upstream error.";
    return NextResponse.json({ error: `RDPA coverage request failed: ${message}` }, { status: 504 });
  }

  if (!coverageResponse.ok) {
    return NextResponse.json(
      { error: `RDPA coverage request failed: ${coverageResponse.status} ${coverageResponse.statusText}` },
      { status: coverageResponse.status }
    );
  }

  const payload = (await coverageResponse.json()) as CoveragePayload;
  const metadata = metadataResponse.ok ? ((await metadataResponse.json()) as CollectionPayload) : null;
  const sourceBbox = parseCollectionBbox(metadata) ?? DEFAULT_COLLECTION_BBOX;
  const values = payload.ranges?.APCP?.values;
  const shape = payload.ranges?.APCP?.shape;
  if (!values || !shape || shape.length !== 2) {
    return NextResponse.json({ error: "RDPA payload missing APCP grid values." }, { status: 502 });
  }

  const inferredWidth = Number(payload.domain?.axes?.x?.num);
  const inferredHeight = Number(payload.domain?.axes?.y?.num);
  const srcHeight = Number(shape[0]) || inferredHeight;
  const srcWidth = Number(shape[1]) || inferredWidth;
  if (!Number.isFinite(srcWidth) || !Number.isFinite(srcHeight) || srcWidth <= 0 || srcHeight <= 0) {
    return NextResponse.json({ error: "Invalid RDPA grid shape." }, { status: 502 });
  }
  if (values.length < srcWidth * srcHeight) {
    return NextResponse.json({ error: "Incomplete RDPA data array." }, { status: 502 });
  }

  const rgba = buildRenderedRgba(values, srcWidth, srcHeight, outWidth, outHeight, sourceBbox, targetBbox);
  const image = Jimp.fromBitmap({ data: rgba, width: outWidth, height: outHeight });
  const png = await imageToBuffer(image, "image/png");

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
      "X-AtmoLens-Generated": "rdpa-coverage-renderer-v1",
    },
  });
}
