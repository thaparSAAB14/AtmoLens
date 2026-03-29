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
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const fetchMaps = useCallback(async () => {
    try {
      const data = await getLatestMaps();
      setMaps(data.maps || {});
      setError(null);
    } catch {
      setError("Failed to load maps. Is the backend running?");
    } finally {
      setLoading(false);
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

  const toggleFullscreen = async () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      await mapContainerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentMap?.filename || "map.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to opening in new tab
      window.open(imageUrl, "_blank");
    }
  };

  const currentMap = maps[selectedType];
  const imageUrl = currentMap
    ? getImageUrl(showOriginal && currentMap.original_url ? currentMap.original_url : currentMap.image_url)
    : null;

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-red-500/5">
        <div className="text-center px-6">
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Start the backend: <code className="bg-[var(--surface-variant)] px-2 py-1 rounded">cd backend && python main.py</code>
          </p>
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
            onClick={() => setShowOriginal(!showOriginal)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              showOriginal
                ? "bg-amber-500/20 text-amber-300"
                : "bg-[var(--accent-dim)] text-[var(--accent)]"
            }`}
          >
            {showOriginal ? "Original" : "Enhanced"}
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
              onClick={handleDownload}
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
        <div className="overflow-auto max-h-[600px] scrollbar-thin">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={MAP_TYPE_LABELS[selectedType] || selectedType}
              className="w-full transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
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
