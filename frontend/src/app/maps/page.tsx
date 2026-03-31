"use client";

import { useState } from "react";
import { MapViewer } from "@/components/MapViewer";
import { MapTypeSelector } from "@/components/MapTypeSelector";
import { GisLayerSelector } from "@/components/GisLayerSelector";
import { StatusBar } from "@/components/StatusBar";
import MagnetLines from "@/components/MagnetLines";

export default function MapsPage() {
  const [selectedMapType, setSelectedMapType] = useState("surface_12z");
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);

  return (
    <div>
      {/* ─── Warp Shader Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <div className="absolute inset-0 flex items-center justify-center opacity-50 blur-[6px]">
          <MagnetLines
            rows={12}
            columns={12}
            containerSize="90vmin"
            lineColor="var(--accent)"
            lineWidth="0.45vmin"
            lineHeight="4vmin"
            baseAngle={-12}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/30 to-[var(--background)]" />
      </div>

      {/* ─── Status Bar ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6 transition-all duration-300">
        <StatusBar />
      </div>

      {/* ─── Page Header ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-2">
        <h1 className="font-display text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Live <span className="gradient-text">Maps</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-2">
          Color-enhanced ECCC synoptic maps, with quick toggles, downloads, and local time readouts.
        </p>
      </div>

      {/* ─── Maps Content ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-6">
            <div className="glass rounded-2xl p-5 space-y-4 glow-md">
              <h3 className="text-[var(--text-secondary)] font-label text-sm uppercase tracking-widest flex items-center gap-2">
                Map Controls
              </h3>
              <MapTypeSelector selected={selectedMapType} onChange={setSelectedMapType} />
              
              <div className="border-t border-[var(--border)] pt-4 mt-4" />
              <GisLayerSelector selected={selectedLayers} onChange={setSelectedLayers} />
            </div>
          </aside>

          <main>
            <MapViewer selectedType={selectedMapType} selectedLayers={selectedLayers} />
          </main>
        </div>
      </section>
    </div>
  );
}
