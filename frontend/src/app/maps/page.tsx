"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapViewer } from "@/components/MapViewer";
import { MapTypeSelector } from "@/components/MapTypeSelector";
import { StatusBar } from "@/components/StatusBar";

const WarpShaderBackground = dynamic(
  () =>
    import("@/components/ui/warp-shader").then(
      (mod) => mod.WarpShaderBackground
    ),
  { ssr: false }
);

export default function MapsPage() {
  const [selectedMapType, setSelectedMapType] = useState("surface_12z");

  return (
    <div>
      {/* ─── Warp Shader Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 opacity-40 dark:opacity-40">
        <WarpShaderBackground />
      </div>

      {/* ─── Status Bar ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatusBar />
      </div>

      {/* ─── Page Header ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-4">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Live <span className="gradient-text">Maps</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-2">
          Real-time color-enhanced synoptic maps from Environment Canada
        </p>
      </div>

      {/* ─── Maps Content ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-[var(--text-secondary)] font-label text-sm uppercase tracking-widest">
                Map Type
              </h3>
              <MapTypeSelector
                selected={selectedMapType}
                onChange={setSelectedMapType}
              />
            </div>
          </aside>

          <main>
            <MapViewer selectedType={selectedMapType} />
          </main>
        </div>
      </section>
    </div>
  );
}
