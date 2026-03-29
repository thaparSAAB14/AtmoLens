"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapViewer } from "@/components/MapViewer";
import { MapTypeSelector } from "@/components/MapTypeSelector";
import { ArchiveGallery } from "@/components/ArchiveGallery";
import { StatusBar } from "@/components/StatusBar";
import { SpecialText } from "@/components/ui/special-text";
import { Cloud, Layers, Archive, ArrowDown } from "lucide-react";

// Dynamically import Three.js shader (no SSR)
const ShaderAnimation = dynamic(
  () =>
    import("@/components/ui/shader-animation").then(
      (mod) => mod.ShaderAnimation
    ),
  { ssr: false }
);

export default function HomePage() {
  const [selectedMapType, setSelectedMapType] = useState("surface_12z");
  const [activeSection, setActiveSection] = useState<"live" | "archive">(
    "live"
  );

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section with Shader Background ──────────────────────────── */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Shader background */}
        <div className="absolute inset-0 opacity-60">
          <ShaderAnimation />
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[var(--background)]" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8 animate-fade-in-up">
            <Cloud size={14} className="text-cyan-400" />
            <span className="text-white/60 text-sm font-mono">
              <SpecialText speed={30} delay={0.5}>
                Automated Weather Intelligence
              </SpecialText>
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] mb-6 animate-fade-in-up animate-delay-100">
            <span className="text-white">ECCC Synoptic</span>
            <br />
            <span className="gradient-text font-medium">Map Processor</span>
          </h1>

          <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up animate-delay-200">
            Grayscale Environment Canada analysis maps transformed into
            color-enhanced, easy-to-read weather maps — automatically,
            every 30 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-300">
            <a
              href="#maps"
              className="group flex items-center gap-2 px-8 py-3 rounded-2xl bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 text-cyan-300 font-medium hover:bg-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <Layers size={18} />
              View Latest Maps
            </a>
            <a
              href="#archive"
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white/60 font-medium hover:bg-white/10 hover:text-white/80 transition-all duration-300"
            >
              <Archive size={18} />
              7-Day Archive
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown size={20} className="text-white/20" />
        </div>
      </section>

      {/* ─── Status Bar ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <StatusBar />
      </div>

      {/* ─── Section Tabs ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-2">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-fit">
          <button
            onClick={() => setActiveSection("live")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeSection === "live"
                ? "bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <Layers size={16} />
            Live Maps
          </button>
          <button
            onClick={() => setActiveSection("archive")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeSection === "archive"
                ? "bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <Archive size={16} />
            Archive
          </button>
        </div>
      </div>

      {/* ─── Maps Section ─────────────────────────────────────────────────── */}
      {activeSection === "live" && (
        <section id="maps" className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar — Map type selector */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="glass rounded-2xl p-5 space-y-4">
                <h3 className="text-white/80 font-medium text-sm uppercase tracking-widest">
                  Map Type
                </h3>
                <MapTypeSelector
                  selected={selectedMapType}
                  onChange={setSelectedMapType}
                />
              </div>
            </aside>

            {/* Main — Map viewer */}
            <main>
              <MapViewer selectedType={selectedMapType} />
            </main>
          </div>
        </section>
      )}

      {/* ─── Archive Section ──────────────────────────────────────────────── */}
      {activeSection === "archive" && (
        <section id="archive" className="max-w-7xl mx-auto px-6 py-8">
          <ArchiveGallery />
        </section>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Cloud size={20} className="text-cyan-400/60" />
              <span className="text-white/40 text-sm">
                Weather Map Processor
              </span>
            </div>
            <p className="text-white/20 text-xs text-center">
              Data source: Environment and Climate Change Canada (ECCC) ·
              weather.gc.ca · MSC GeoMet
            </p>
            <p className="text-white/20 text-xs">
              Auto-updates every 30 minutes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
