/**
 * API client for the Weather Map Processor backend.
 * 🏗️ Vercel Monorepo: Same-domain relative /api pathing.
 */

// API is in same domain under /api
const API_BASE = "";

// Log API connectivity state
if (process.env.NODE_ENV === 'development') {
  console.log('🔌 AtmoLens API Sync:', API_BASE, '(Vercel Serverless Ready)');
}

export interface MapInfo {
  filename: string;
  original_filename?: string;
  timestamp: string;
  map_type: string;
  image_url: string;
  original_url?: string;
}

export interface ArchiveEntry extends MapInfo {
  path: string;
}

export interface SchedulerStatus {
  running: boolean;
  last_fetch_time: string | null;
  last_fetch_result: Record<string, unknown> | null;
  maps_processed_total: number;
  next_scheduled_run: string | null;
  fetch_interval_minutes: number;
}

export interface SystemStatus {
  system: string;
  version: string;
  status?: string;
  scheduler?: SchedulerStatus;
  archive_count: number;
  map_types?: string[];
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export function getImageUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function getStatus(): Promise<SystemStatus> {
  return fetchJSON<SystemStatus>("/api/status");
}

export async function getLatestMaps(): Promise<{ maps: Record<string, MapInfo> }> {
  return fetchJSON("/api/maps/latest");
}

export async function getLatestMap(mapType: string): Promise<MapInfo> {
  return fetchJSON(`/api/maps/latest/${mapType}`);
}

export async function getArchive(): Promise<{ archive: ArchiveEntry[]; count: number }> {
  return fetchJSON("/api/maps/archive");
}

export async function getArchiveByType(
  mapType: string
): Promise<{ archive: ArchiveEntry[]; count: number }> {
  return fetchJSON(`/api/maps/archive/${mapType}`);
}

export const MAP_TYPE_LABELS: Record<string, string> = {
  surface_00z: "Surface Analysis — 00Z",
  surface_06z: "Surface Analysis — 06Z",
  surface_12z: "Surface Analysis — 12Z",
  surface_18z: "Surface Analysis — 18Z",
  upper_250hpa: "Upper Air — 250 hPa",
  upper_500hpa: "Upper Air — 500 hPa",
  upper_700hpa: "Upper Air — 700 hPa",
  upper_850hpa: "Upper Air — 850 hPa",
};

export const MAP_TYPE_GROUPS: Record<string, string[]> = {
  Surface: ["surface_00z", "surface_06z", "surface_12z", "surface_18z"],
  "Upper Air": ["upper_250hpa", "upper_500hpa", "upper_700hpa", "upper_850hpa"],
};

/**
 * 🗺️ GIS Data & WMS Overlays
 * Introducing support for high-resolution vector pulling.
 */
export interface GeoMetLayer {
  id: string;
  name: string;
  wms_path: string;
  description: string;
}

export const GEOMET_LAYERS: GeoMetLayer[] = [
  {
    id: "mslp",
    name: "Mean Sea Level Pressure",
    wms_path: "/geomet?service=WMS&version=1.3.0&request=GetMap&layers=GDPS.ETA_PRMSL",
    description: "GDPS Surface Analysis Pressure (hPa)"
  },
  {
    id: "tt",
    name: "Temperature",
    wms_path: "/geomet?service=WMS&version=1.3.0&request=GetMap&layers=GDPS.ETA_TT",
    description: "Air Temperature (2m)"
  }
];

/**
 * 📜 Legal Clause: Mandated by ECCC License
 */
export const LEGAL_ATTRIBUTION = "Contains information licensed under the Open Government Licence – Canada";
