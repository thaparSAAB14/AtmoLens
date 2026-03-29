"use client";

import { useState, useEffect, useCallback } from "react";
import { getLatestMaps, getImageUrl, MAP_TYPE_LABELS, type MapInfo } from "@/lib/api";
import { formatTimestamp, timeAgo } from "@/lib/utils";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface MapViewerProps {
  selectedType: string;
}

export function MapViewer({ selectedType }: MapViewerProps) {
  const [maps, setMaps] = useState<Record<string, MapInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);

  const fetchMaps = useCallback(async () => {
    try {
      const data = await getLatestMaps();
      setMaps(data.maps || {});
      setError(null);
    } catch (err) {
      setError("Failed to load maps. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
    const interval = setInterval(fetchMaps, 60_000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchMaps]);

  const currentMap = maps[selectedType];
  const imageUrl = currentMap
    ? getImageUrl(showOriginal && currentMap.original_url ? currentMap.original_url : currentMap.image_url)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-white/50 text-sm font-mono tracking-wider">LOADING MAPS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-red-500/5 backdrop-blur-sm border border-red-500/20">
        <div className="text-center px-6">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <p className="text-red-300 font-medium">{error}</p>
          <p className="text-white/40 text-sm mt-2">
            Start the backend: <code className="bg-white/10 px-2 py-1 rounded">cd backend && python main.py</code>
          </p>
        </div>
      </div>
    );
  }

  if (!currentMap) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="text-center">
          <p className="text-white/50 text-lg">No map available for</p>
          <p className="text-white/80 text-xl font-medium mt-1">
            {MAP_TYPE_LABELS[selectedType] || selectedType}
          </p>
          <p className="text-white/30 text-sm mt-3">
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
          <h3 className="text-white/90 font-medium">
            {MAP_TYPE_LABELS[selectedType] || selectedType}
          </h3>
          <span className="text-white/30 text-xs font-mono">
            {currentMap.timestamp ? timeAgo(currentMap.timestamp) : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle original/processed */}
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              showOriginal
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
            }`}
          >
            {showOriginal ? "Original" : "Enhanced"}
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-white/40 text-xs font-mono min-w-[3ch] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
            title="Reset zoom"
          >
            <Maximize2 size={16} />
          </button>

          {/* Download */}
          {imageUrl && (
            <a
              href={imageUrl}
              download={currentMap.filename}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
              title="Download"
            >
              <Download size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Map image */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/20">
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
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <p className="text-white/70 text-xs font-mono">
            {currentMap.timestamp ? formatTimestamp(currentMap.timestamp) : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
