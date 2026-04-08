const API_BASE = "";

if (process.env.NODE_ENV === "development") {
  console.log("AtmoLens API Sync:", API_BASE, "(Vercel Serverless Ready)");
}

export interface MapInfo {
  filename: string;
  original_filename?: string;
  timestamp: string;
  ingested_at?: string | null;
  source_timestamp?: string | null;
  map_type: string;
  image_url: string;
  original_url?: string;
  source_size_bytes?: number | null;
  processed_size_bytes?: number | null;
  processing_version?: string | null;
  source_url?: string | null;
}

export interface ArchiveEntry extends MapInfo {
  path: string;
}

export type ArchiveDayBucket = {
  day: string;
  count: number;
  entries: ArchiveEntry[];
};

export type ArchiveMonthBucket = {
  month: string;
  count: number;
  days: ArchiveDayBucket[];
};

export type ArchiveYearBucket = {
  year: string;
  count: number;
  months: ArchiveMonthBucket[];
};

export type ArchiveTypeBucket = {
  map_type: string;
  label: string;
  count: number;
  years: ArchiveYearBucket[];
};

export type ArchiveTreeGroup = {
  group: "Surface" | "Upper Air" | "Model Guidance" | "Other";
  count: number;
  types: ArchiveTypeBucket[];
};

export type ArchiveTimelinePoint = {
  day: string;
  count: number;
  map_types: string[];
};

export interface ArchiveResponse {
  archive: ArchiveEntry[];
  count: number;
  days_window: number;
  timeline: ArchiveTimelinePoint[];
  hierarchy: ArchiveTreeGroup[];
}

export interface SchedulerStatus {
  running: boolean;
  last_fetch_time: string | null;
  last_fetch_result: Record<string, unknown> | string | null;
  maps_processed_total: number;
  next_scheduled_run: string | null;
  fetch_interval_minutes: number;
}

export interface IngestHealth {
  stale: boolean;
  minutes_since_last_fetch: number | null;
  latest_run: Record<string, unknown> | null;
  latest_items: Array<Record<string, unknown>>;
}

export interface SystemStatus {
  system: string;
  version: string;
  status?: string;
  scheduler?: SchedulerStatus;
  ingest_health?: IngestHealth;
  archive_count: number;
  map_types?: string[];
}

export interface HerbiePipelineStatus {
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
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
  return response.json();
}

export function getImageUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function getStatus(): Promise<SystemStatus> {
  return fetchJSON<SystemStatus>("/api/status");
}

export async function getHerbieStatus(): Promise<HerbiePipelineStatus> {
  return fetchJSON<HerbiePipelineStatus>("/api/herbie/status");
}

export async function getLatestMaps(): Promise<{ maps: Record<string, MapInfo> }> {
  return fetchJSON<{ maps: Record<string, MapInfo> }>("/api/maps/latest");
}

export async function getLatestMap(mapType: string): Promise<MapInfo> {
  return fetchJSON<MapInfo>(`/api/maps/latest/${mapType}`);
}

export async function getArchive(days = 30): Promise<ArchiveResponse> {
  const qs = new URLSearchParams({ days: String(days) });
  return fetchJSON<ArchiveResponse>(`/api/maps/archive?${qs.toString()}`);
}

export async function getArchiveByType(
  mapType: string,
  days = 30
): Promise<{ archive: ArchiveEntry[]; count: number; days_window: number }> {
  const qs = new URLSearchParams({ days: String(days) });
  return fetchJSON(`/api/maps/archive/${mapType}?${qs.toString()}`);
}

export const MAP_TYPE_LABELS: Record<string, string> = {
  surface_00z: "Surface Analysis - 00Z",
  surface_06z: "Surface Analysis - 06Z",
  surface_12z: "Surface Analysis - 12Z",
  surface_18z: "Surface Analysis - 18Z",
  upper_250hpa: "Upper Air - 250 hPa",
  upper_500hpa: "Upper Air - 500 hPa",
  upper_700hpa: "Upper Air - 700 hPa",
  upper_850hpa: "Upper Air - 850 hPa",
};

export const MAP_TYPE_GROUPS: Record<string, string[]> = {
  Surface: ["surface_00z", "surface_06z", "surface_12z", "surface_18z"],
  "Upper Air": ["upper_250hpa", "upper_500hpa", "upper_700hpa", "upper_850hpa"],
};
