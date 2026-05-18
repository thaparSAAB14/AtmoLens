"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getLatestMaps, getImageUrl, MAP_TYPE_LABELS, type MapInfo } from "@/lib/api";
import { formatTimestamp, formatTimestampLocal, timeAgo } from "@/lib/utils";
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Loader from "./ui/loader-12";

interface MapViewerProps {
  selectedType: string;
}

export function MapViewer({ selectedType }: MapViewerProps) {
  const [maps, setMaps] = useState<Record<string, MapInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
      window.open(url, "_blank");
    }
  };

  // Zoom logic
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => setZoom(prev => {
    const next = Math.max(prev - 0.5, 1);
    if (next === 1) setOffset({ x: 0, y: 0 });
    return next;
  });
  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault(); // Prevent text selection/drag starts
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !mapContainerRef.current || !imageRef.current) return;
    e.preventDefault();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Calculate bounds
    // We want to prevent the image from being panned completely out of view.
    // A simple approach is to clamp the offset based on the zoomed image size.
    const container = mapContainerRef.current.getBoundingClientRect();
    const img = imageRef.current.getBoundingClientRect();
    
    // Allow panning but keep at least 100px of the image visible in each dimension
    // if the image is larger than the container.
    let clampedX = newX;
    let clampedY = newY;

    if (zoom > 1) {
        const maxX = (img.width / 2);
        const maxY = (img.height / 2);
        clampedX = Math.max(-maxX, Math.min(maxX, newX));
        clampedY = Math.max(-maxY, Math.min(maxY, newY));
    } else {
        clampedX = 0;
        clampedY = 0;
    }

    setOffset({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setIsDragging(false);
    }
  };

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom(prev => {
            const next = Math.max(1, Math.min(5, prev + delta));
            if (next === 1) setOffset({ x: 0, y: 0 });
            return next;
        });
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

  useEffect(() => {
    if (imageUrl) {
      setIsImageLoading(true);
    }
  }, [imageUrl]);
  const utcTimestamp = currentMap?.timestamp ? formatTimestamp(currentMap.timestamp) : "";
  const localTimestamp = currentMap?.timestamp ? formatTimestampLocal(currentMap.timestamp) : "";

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
      <div className="flex items-center justify-center h-[500px] rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
        <div className="text-center px-6">
          <p className="text-red-700 dark:text-red-400 font-semibold text-lg">{error}</p>
          <p className="text-red-600/80 dark:text-red-400/70 text-sm mt-2">Please try again in a moment.</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchMaps();
            }}
            className="mt-5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white dark:bg-red-500/20 dark:text-red-200 dark:hover:bg-red-500/30 text-sm font-semibold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
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
            <p className="text-[var(--text-secondary)] text-sm mt-3 max-w-md mx-auto">
              We fetch new maps automatically every 30 minutes. If you just deployed, the
              first sync may take a few minutes to appear.
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchMaps();
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
          <p className="text-amber-800 dark:text-amber-300 text-sm">
            Live updates are temporarily unavailable. Showing the last available map.
          </p>
          <button
            onClick={() => fetchMaps()}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30 text-xs font-semibold transition-all disabled:opacity-60 shadow-sm"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Retry"}
          </button>
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm ${
              isShowingOriginal
                ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30"
                : "bg-[var(--accent)] text-white hover:opacity-90"
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

      {/* Map image container */}
      <div
        ref={mapContainerRef}
        className="map-container relative rounded-2xl overflow-hidden bg-[var(--surface-container)] glow-md group/container select-none"
        onWheel={handleWheel}
      >
        <div
          className={`relative w-full overflow-hidden flex items-center justify-center transition-all ${
            isFullscreen
              ? "h-screen bg-[var(--background)]"
              : "h-[70vh] max-h-[760px] min-h-[360px]"
          } ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
        >
          {imageUrl && (
            <>
              {isImageLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--surface-container)]/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
                  <div className="flex flex-col items-center gap-6">
                    <Loader />
                    <div className="w-64 h-1.5 bg-[var(--surface-container-high)] rounded-full overflow-hidden border border-[var(--border)]/30 relative">
                      <div 
                        className="absolute inset-0 h-full bg-gradient-to-r from-[var(--accent)]/40 via-[var(--accent)] to-[var(--accent)]/40"
                        style={{
                          width: '100%',
                          animation: 'progress 2s ease-in-out infinite'
                        }}
                      />
                    </div>
                    <p className="text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">
                      Processing Data Layer
                    </p>
                  </div>
                </div>
              )}
              <img
                ref={imageRef}
                src={imageUrl}
                alt={MAP_TYPE_LABELS[selectedType] || selectedType}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
                className={`max-w-full max-h-full object-contain pointer-events-none transition-all duration-500 ease-out ${
                  isImageLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                }}
                draggable={false}
              />
            </>
          )}
        </div>

        {/* Zoom Controls Overlay (Right Side) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <div className="flex flex-col gap-1 p-1 rounded-xl glass-strong shadow-lg border border-[var(--border)]">
            <button
              onClick={zoomIn}
              className="p-2 rounded-lg hover:bg-[var(--accent-dim)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <div className="h-px bg-[var(--border)] mx-2" />
            <button
              onClick={zoomOut}
              className="p-2 rounded-lg hover:bg-[var(--accent-dim)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30"
              disabled={zoom <= 1}
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <div className="h-px bg-[var(--border)] mx-2" />
            <button
              onClick={resetZoom}
              className="p-2 rounded-lg hover:bg-[var(--accent-dim)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all disabled:opacity-30"
              disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
              title="Reset View"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          
          <div className="glass px-2 py-1 rounded-lg text-[10px] font-mono text-[var(--text-muted)] text-center">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Timestamp overlay */}
        <div className="absolute bottom-3 left-3 bg-[var(--surface)]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
          <p className="text-[var(--text-secondary)] text-xs font-label">
            Local: {localTimestamp}
          </p>
          <p className="text-[var(--text-muted)] text-xs font-label">
            UTC: {utcTimestamp}
          </p>
        </div>
      </div>
    </div>
  );
}
