export interface GeoMetLayer {
  id: string;
  name: string;
  layer: string;
  description: string;
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
    opacity: 0.7,
  },
  {
    id: "temp_2m",
    name: "2m temperature",
    layer: "GDPS.ETA_TT",
    description: "Near-surface air temperature (K).",
    opacity: 0.55,
  },
];

export const GEOMET_ATTRIBUTION =
  "Contains information licensed under the Open Government Licence – Canada.";
