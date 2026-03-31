import type { ArchiveEntry, MapInfo } from "@/lib/api";

export type MapRow = {
  map_type: string;
  filename: string;
  blob_url: string;
  original_blob_url?: string | null;
  timestamp: string | Date;
};

const USE_BLOB_PROXY = (process.env.BLOB_ACCESS ?? "private") !== "public";

function basename(pathOrUrl: string): string {
  try {
    const url = new URL(pathOrUrl);
    return url.pathname.split("/").pop() || pathOrUrl;
  } catch {
    return pathOrUrl.split("/").pop() || pathOrUrl;
  }
}

function toBlobPath(pathOrUrl: string): string {
  try {
    const url = new URL(pathOrUrl);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return pathOrUrl.replace(/^\/+/, "");
  }
}

function toClientUrl(pathOrUrl: string): string {
  if (!USE_BLOB_PROXY) return pathOrUrl;
  const path = toBlobPath(pathOrUrl);
  return `/api/blob?path=${encodeURIComponent(path)}`;
}

function toIsoString(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString();
}

export function mapRowToMapInfo(row: MapRow): MapInfo {
  const processedBase = basename(row.filename);
  const originalBase = row.original_blob_url ? basename(row.original_blob_url) : undefined;
  return {
    filename: `${row.map_type}_${processedBase}`,
    original_filename: originalBase ? `${row.map_type}_${originalBase}` : undefined,
    timestamp: toIsoString(row.timestamp),
    map_type: row.map_type,
    image_url: toClientUrl(row.blob_url || row.filename),
    original_url: row.original_blob_url ? toClientUrl(row.original_blob_url) : undefined,
  };
}

export function mapRowToArchiveEntry(row: MapRow): ArchiveEntry {
  return {
    ...mapRowToMapInfo(row),
    path: row.filename,
  };
}
