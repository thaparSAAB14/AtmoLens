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
    id: "rdpa_6h_final",
    name: "RDPA 6h Final",
    layer: "RDPA.6F_PR",
    description: "Regional Deterministic Precipitation Analysis, 6-hour final accumulation.",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.5,
  },
  {
    id: "rdpa_6h_prelim",
    name: "RDPA 6h Prelim",
    layer: "RDPA.6P_PR",
    description: "Regional Deterministic Precipitation Analysis, 6-hour preliminary accumulation.",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.5,
  },
  {
    id: "rdpa_24h_final",
    name: "RDPA 24h Final",
    layer: "RDPA.24F_PR",
    description: "Regional Deterministic Precipitation Analysis, 24-hour final accumulation.",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.42,
  },
  {
    id: "rdpa_24h_prelim",
    name: "RDPA 24h Prelim",
    layer: "RDPA.24P_PR",
    description: "Regional Deterministic Precipitation Analysis, 24-hour preliminary accumulation.",
    version: "1.1.1",
    srs: "EPSG:4326",
    opacity: 0.42,
  },
];

export const GEOMET_ATTRIBUTION =
  "Contains information licensed under the Open Government Licence – Canada.";

export const GEOMET_WMS_LAYER_NAMES = new Set(GEOMET_LAYERS.map((layer) => layer.layer));

export const IS_WMS_UI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WMS !== "false";
