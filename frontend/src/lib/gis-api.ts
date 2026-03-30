/**
 * 🗺️ AtmoLens GIS Data Framework
 * ──────────────────────────────
 * Interface for high-resolution shapefile ingestion and MSC GeoMet 
 * WMS/WFS data pulling, following ECCC Open Data regulations.
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
 * High-resolution Shapefile (.shp) Loader
 * Logic skeleton for future vector integration from GeoMet WFS service.
 */
export async function fetchShapefileData(layerId: string, bbox: string) {
  // ECCC GeoMet WFS endpoint for vector features
  const baseUrl = "https://geo.weather.gc.ca/geomet";
  const params = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeName: `GDPS.ETA_${layerId.toUpperCase()}`,
    outputFormat: "application/json",
    bbox: bbox
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch GIS feature data.");
    
    // Result complies with Open Government Licence - Canada
    return await response.json();
  } catch (err) {
    console.error("GIS Data Pulling Error:", err);
    return null;
  }
}

/**
 * 📜 Legal Clause: Mandated by ECCC License
 * "Contains information licensed under the Open Government Licence – Canada."
 */
export const LEGAL_ATTRIBUTION = "Contains information licensed under the Open Government Licence – Canada";
