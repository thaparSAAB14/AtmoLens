export interface GeoMetLayer {
  id: string;
  name: string;
  layer: string;
  description: string;
  version?: "1.1.1" | "1.3.0";
  srs?: string;
  style?: string;
  format?: string;
  opacity?: number;
}

/**
 * GeoMet overlays kept intentionally small + high-confidence.
 * These layers are served by ECCC MSC GeoMet WMS.
 */
export const GEOMET_LAYERS: GeoMetLayer[] = [
  {
    id: "mslp",
    name: "Sea-level pressure",
    layer: "GDPS.ETA_PRMSL",
    description: "Mean sea level pressure (Pa).",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.7,
  },
  {
    id: "temp_2m",
    name: "2m temperature",
    layer: "GDPS.ETA_TT",
    description: "Near-surface air temperature (K).",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.55,
  },
  {
    id: "precip_24h",
    name: "24h precipitation",
    layer: "RDPA.24F_PR",
    description: "Accumulated precipitation forecast.",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.6,
  },
];

export const GEOMET_ATTRIBUTION =
  "Contains information licensed under the Open Government Licence – Canada.";

export const GEOMET_WMS_LAYER_NAMES = new Set(GEOMET_LAYERS.map((layer) => layer.layer));

export const IS_WMS_UI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WMS !== "false";
