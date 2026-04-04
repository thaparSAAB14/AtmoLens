import type { ArchiveEntry, MapInfo } from "@/lib/api";

export type MapRow = {
  map_type: string;
  filename: string;
  blob_url: string;
  original_blob_url?: string | null;
  timestamp: string | Date;
  ingested_at?: string | Date | null;
  source_timestamp?: string | Date | null;
  source_size_bytes?: number | null;
  processed_size_bytes?: number | null;
  processing_version?: string | null;
  source_url?: string | null;
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

function toOptionalIsoString(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function mapRowToMapInfo(row: MapRow): MapInfo {
  const processedBase = basename(row.filename);
  const originalBase = row.original_blob_url ? basename(row.original_blob_url) : undefined;
  return {
    filename: `${row.map_type}_${processedBase}`,
    original_filename: originalBase ? `${row.map_type}_${originalBase}` : undefined,
    timestamp: toIsoString(row.timestamp),
    ingested_at: toOptionalIsoString(row.ingested_at),
    source_timestamp: toOptionalIsoString(row.source_timestamp),
    map_type: row.map_type,
    image_url: toClientUrl(row.blob_url || row.filename),
    original_url: row.original_blob_url ? toClientUrl(row.original_blob_url) : undefined,
    source_size_bytes:
      typeof row.source_size_bytes === "number" ? row.source_size_bytes : null,
    processed_size_bytes:
      typeof row.processed_size_bytes === "number" ? row.processed_size_bytes : null,
    processing_version:
      typeof row.processing_version === "string" ? row.processing_version : null,
    source_url: typeof row.source_url === "string" ? row.source_url : null,
  };
}

export function mapRowToArchiveEntry(row: MapRow): ArchiveEntry {
  return {
    ...mapRowToMapInfo(row),
    path: row.filename,
  };
}
