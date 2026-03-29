"use client";

import { useState, useRef, useCallback } from "react";

interface ComparisonSliderProps {
  originalUrl: string;
  enhancedUrl: string;
  label?: string;
}

export function ComparisonSlider({
  originalUrl,
  enhancedUrl,
  label,
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between px-1">
          <span className="text-white/60 text-sm">{label}</span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-amber-300/60">← Original</span>
            <span className="text-cyan-300/60">Enhanced →</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden cursor-ew-resize select-none border border-white/10 shadow-2xl"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Enhanced (bottom layer) */}
        <img
          src={enhancedUrl}
          alt="Enhanced map"
          className="w-full block"
          draggable={false}
        />

        {/* Original (top layer, clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={originalUrl}
            alt="Original map"
            className="w-full h-full object-cover"
            style={{
              width: containerRef.current?.offsetWidth || "100%",
              maxWidth: "none",
            }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
          style={{ left: `${position}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center backdrop-blur-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              className="text-slate-800"
            >
              <path
                d="M6 10L2 10M6 10L8 8M6 10L8 12M14 10L18 10M14 10L12 8M14 10L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 bg-amber-900/80 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-amber-200 text-xs font-mono">ORIGINAL</span>
        </div>
        <div className="absolute bottom-3 right-3 bg-cyan-900/80 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-cyan-200 text-xs font-mono">ENHANCED</span>
        </div>
      </div>
    </div>
  );
}
