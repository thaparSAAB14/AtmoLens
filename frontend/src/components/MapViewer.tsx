"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getLatestMaps, getImageUrl, MAP_TYPE_LABELS, type MapInfo } from "@/lib/api";
import { GEOMET_ATTRIBUTION, GEOMET_LAYERS, type GeoMetLayer } from "@/lib/geomet";
import { formatTimestamp, formatTimestampLocal, timeAgo } from "@/lib/utils";
import { Download, Maximize2, Minimize2 } from "lucide-react";

interface MapViewerProps {
  selectedType: string;
  selectedLayers: string[];
  wmsEnabled: boolean;
}

export function MapViewer({ selectedType, selectedLayers, wmsEnabled }: MapViewerProps) {
  const [maps, setMaps] = useState<Record<string, MapInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [overlayWarning, setOverlayWarning] = useState<string | null>(null);
  const [generatedFallbackLayers, setGeneratedFallbackLayers] = useState<Set<string>>(new Set());
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const fetchMaps = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getLatestMaps();
      setMaps(data.maps || {});
      setError(null);
    } catch {
      setError("We couldn’t load the latest maps right now.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
    const interval = setInterval(fetchMaps, 60_000);
    return () => clearInterval(interval);
  }, [fetchMaps]);

  // Track fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Allow other components (e.g., StatusBar) to request a refresh.
  useEffect(() => {
    const handler = () => fetchMaps();
    window.addEventListener("atmolens:refresh", handler);
    return () => window.removeEventListener("atmolens:refresh", handler);
  }, [fetchMaps]);

  const toggleFullscreen = async () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      await mapContainerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "map.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback to opening in new tab
      window.open(url, "_blank");
    }
  };

  const currentMap = maps[selectedType];
  const hasOriginal = !!currentMap?.original_url;
  const isShowingOriginal = showOriginal && hasOriginal;

  useEffect(() => {
    if (showOriginal && !hasOriginal) setShowOriginal(false);
  }, [showOriginal, hasOriginal]);

  const imageUrl = currentMap
    ? getImageUrl(isShowingOriginal ? currentMap.original_url! : currentMap.image_url)
    : null;
  const utcTimestamp = currentMap?.timestamp ? formatTimestamp(currentMap.timestamp) : "";
  const localTimestamp = currentMap?.timestamp ? formatTimestampLocal(currentMap.timestamp) : "";

  const hasAnyData = Object.keys(maps).length > 0;
  const canUseGeoMet = wmsEnabled && selectedType.startsWith("surface_");
  const geometBbox = "-175,10,-15,85"; // minLon,minLat,maxLon,maxLat (WMS 1.1.1 + EPSG:4326)
  const selectedGeoLayers = GEOMET_LAYERS.filter((layer) => selectedLayers.includes(layer.id));

  const buildWmsOverlaySrc = useCallback((layer: GeoMetLayer) => {
    const qs = new URLSearchParams({
      service: "WMS",
      version: layer.version ?? "1.1.1",
      request: "GetMap",
      layers: layer.layer,
      styles: layer.style ?? "",
      transparent: "true",
      format: layer.format ?? "image/png",
      srs: layer.srs ?? "EPSG:4326",
      bbox: geometBbox,
      width: "1400",
      height: "900",
    });
    return `/api/geomet/wms?${qs.toString()}`;
  }, [geometBbox]);

  useEffect(() => {
    setOverlayWarning(null);
    setGeneratedFallbackLayers(new Set());
  }, [selectedType, selectedLayers.join("|"), wmsEnabled]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-[var(--surface-container)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm font-label uppercase tracking-widest">
            Loading maps...
          </p>
        </div>
      </div>
    );
  }

  if (error && !hasAnyData) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-red-500/5">
        <div className="text-center px-6">
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">Please try again in a moment.</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchMaps();
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/15 transition-colors disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Retrying…" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  if (!currentMap) {
    if (!hasAnyData) {
      return (
        <div className="flex items-center justify-center h-[500px] rounded-2xl bg-[var(--surface-container)]">
          <div className="text-center px-6">
            <p className="text-[var(--text-primary)] text-xl font-display font-semibold">
              No maps indexed yet
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-3">
              We fetch new maps automatically every 30 minutes. If you just deployed, the
              first sync may take a few minutes to appear.
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchMaps();
              }}
              className="mt-5 px-4 py-2 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/15 transition-colors disabled:opacity-60"
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-[var(--surface-container)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] text-lg">No map available for</p>
          <p className="text-[var(--text-primary)] text-xl font-display font-semibold mt-1">
            {MAP_TYPE_LABELS[selectedType] || selectedType}
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-3">
            Try a different map type, or check back after the next update cycle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && hasAnyData && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-amber-200 text-sm">
            Live updates are temporarily unavailable. Showing the last available map.
          </p>
          <button
            onClick={() => fetchMaps()}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Retry"}
          </button>
        </div>
      )}
      {overlayWarning && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
          <p className="text-orange-200 text-sm">{overlayWarning}</p>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-[var(--text-primary)] font-display font-semibold">
            {MAP_TYPE_LABELS[selectedType] || selectedType}
          </h3>
          <span className="text-[var(--text-muted)] text-xs font-label">
            {currentMap.timestamp ? timeAgo(currentMap.timestamp) : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {/* Toggle original/processed */}
          <button
            onClick={() => hasOriginal && setShowOriginal((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isShowingOriginal
                ? "bg-amber-500/20 text-amber-300"
                : "bg-[var(--accent-dim)] text-[var(--accent)]"
            }`}
            disabled={!hasOriginal}
            title={hasOriginal ? "Toggle original/enhanced" : "Original not available for this map yet"}
            aria-pressed={isShowingOriginal}
          >
            {isShowingOriginal ? "Original" : "Enhanced"}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Download */}
          {imageUrl && (
            <button
              onClick={() =>
                handleDownload(
                  imageUrl,
                  isShowingOriginal
                    ? currentMap.original_filename || currentMap.filename
                    : currentMap.filename
                )
              }
              className="p-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              title="Download"
              aria-label="Download map image"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Map image */}
      <div
        ref={mapContainerRef}
        className="map-container relative rounded-2xl overflow-hidden bg-[var(--surface-container)] glow-md"
      >
        <div
          className={`flex items-center justify-center w-full ${
            isFullscreen
              ? "h-screen"
              : "h-[70vh] max-h-[760px] min-h-[360px]"
          }`}
        >
          {imageUrl && (
            <>
              <img
                src={imageUrl}
                alt={MAP_TYPE_LABELS[selectedType] || selectedType}
                className="w-full h-full object-contain"
                draggable={false}
              />
              {canUseGeoMet &&
                selectedGeoLayers.map((layer) => {
                  const tryGeneratedOverlay =
                    layer.source === "generated" &&
                    !!layer.collectionId &&
                    !generatedFallbackLayers.has(layer.id);
                  const overlaySrc =
                    tryGeneratedOverlay
                      ? `/api/geomet/rdpa?collection=${encodeURIComponent(layer.collectionId!)}&width=1400&height=900&bbox=${encodeURIComponent(geometBbox)}`
                      : buildWmsOverlaySrc(layer);

                  return (
                    <img
                      key={layer.id}
                      src={overlaySrc}
                      alt={`${layer.name} overlay`}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ opacity: layer.opacity ?? 0.6 }}
                      onError={() => {
                        if (tryGeneratedOverlay) {
                          setGeneratedFallbackLayers((previous) => {
                            if (previous.has(layer.id)) return previous;
                            const next = new Set(previous);
                            next.add(layer.id);
                            return next;
                          });
                          setOverlayWarning(
                            `${layer.name} generated overlay is temporarily unavailable. Falling back to GeoMet layer.`
                          );
                          return;
                        }
                        setOverlayWarning(
                          "One or more weather overlays could not be loaded right now. Try toggling the layer or refreshing."
                        );
                      }}
                      draggable={false}
                    />
                  );
                })}
            </>
          )}
        </div>

        {/* Timestamp overlay */}
        <div className="absolute bottom-3 left-3 bg-[var(--surface)]/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <p className="text-[var(--text-secondary)] text-xs font-label">
            Local: {localTimestamp}
          </p>
          <p className="text-[var(--text-muted)] text-xs font-label">
            UTC: {utcTimestamp}
          </p>
        </div>
        {canUseGeoMet && selectedGeoLayers.length > 0 && (
          <div className="absolute right-3 bottom-3 max-w-[min(60ch,60%)] bg-[var(--surface)]/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-[10px] text-[var(--text-secondary)] font-label">Overlay: {selectedGeoLayers.map((l) => l.name).join(", ")}</p>
            <p className="text-[10px] text-[var(--text-secondary)] font-label">
              Source: RDPA generated in-house {generatedFallbackLayers.size > 0 ? `(GeoMet fallback: ${generatedFallbackLayers.size})` : ""}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{GEOMET_ATTRIBUTION}</p>
          </div>
        )}
      </div>
    </div>
  );
}
