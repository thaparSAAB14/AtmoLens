"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getLatestMaps, getImageUrl, MAP_TYPE_LABELS, type MapInfo } from "@/lib/api";
import { formatTimestamp, timeAgo } from "@/lib/utils";
import { Download, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

interface MapViewerProps {
  selectedType: string;
}

export function MapViewer({ selectedType }: MapViewerProps) {
  const [maps, setMaps] = useState<Record<string, MapInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const hasAnyData = Object.keys(maps).length > 0;

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
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-[var(--surface-container)]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] text-lg">No map available for</p>
          <p className="text-[var(--text-primary)] text-xl font-display font-semibold mt-1">
            {MAP_TYPE_LABELS[selectedType] || selectedType}
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-3">
            Maps are fetched automatically every 30 minutes
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

      {/* Controls bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-[var(--text-primary)] font-display font-semibold">
            {MAP_TYPE_LABELS[selectedType] || selectedType}
          </h3>
          <span className="text-[var(--text-muted)] text-xs font-label">
            {currentMap.timestamp ? timeAgo(currentMap.timestamp) : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
          >
            {isShowingOriginal ? "Original" : "Enhanced"}
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[var(--text-muted)] text-xs font-label min-w-[3ch] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
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
          className={`overflow-auto scrollbar-thin ${
            isFullscreen ? "max-h-screen" : "max-h-[600px]"
          }`}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt={MAP_TYPE_LABELS[selectedType] || selectedType}
              className="block max-w-none"
              style={{ width: `${zoom * 100}%` }}
              draggable={false}
            />
          )}
        </div>

        {/* Timestamp overlay */}
        <div className="absolute bottom-3 left-3 bg-[var(--surface)]/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <p className="text-[var(--text-secondary)] text-xs font-label">
            {currentMap.timestamp ? formatTimestamp(currentMap.timestamp) : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
