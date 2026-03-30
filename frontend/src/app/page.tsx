"use client";

import dynamic from "next/dynamic";
import { SpecialText } from "@/components/ui/special-text";
import { Cloud, Layers, Archive, ArrowDown, ArrowRight, MapPin, Zap, Clock, Eye } from "lucide-react";
import Link from "next/link";

const ShaderAnimation = dynamic(
  () =>
    import("@/components/ui/shader-animation").then(
      (mod) => mod.ShaderAnimation
    ),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div>
      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <ShaderAnimation />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/30 via-transparent to-[var(--background)]" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
            <Cloud size={14} className="text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)] text-sm font-label">
              <SpecialText speed={30} delay={0.5}>
                Automated Weather Intelligence
              </SpecialText>
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-fade-in-up animate-delay-100">
            <span className="text-[var(--text-primary)]">See Weather</span>
            <br />
            <span className="gradient-text">Like Never Before</span>
          </h1>

          <p className="text-[var(--text-secondary)] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up animate-delay-200">
            Grayscale ECCC synoptic charts, automatically transformed into
            color-enhanced, readable maps. Every 30 minutes. Zero intervention.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-300">
            <Link
              href="/maps"
              className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-glow)] text-[#004346] font-semibold hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/20"
            >
              <Eye size={18} />
              View Live Maps
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/archive"
              className="flex items-center gap-2 px-8 py-3 rounded-xl glass text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-container-high)] hover:text-[var(--text-primary)] transition-all duration-300"
            >
              <Archive size={18} />
              7-Day Archive
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown size={20} className="text-[var(--text-muted)]" />
        </div>
      </section>

      {/* ─── How It Works — asymmetric bento ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-16">
          <span className="text-[var(--text-muted)] text-xs font-label uppercase tracking-[0.15em]">
            The Pipeline
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-4">
            Automated end to end.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Feature 1 — wide card */}
          <div className="lg:col-span-2 rounded-2xl bg-[var(--surface-container)] p-8 hover:bg-[var(--surface-container-high)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[var(--accent)]/5 blur-3xl group-hover:bg-[var(--accent)]/10 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center mb-5 group-hover:bg-[var(--accent)]/20 transition-colors">
                <MapPin size={22} className="text-[var(--accent)]" />
              </div>
              <h3 className="text-[var(--text-primary)] font-display font-semibold text-xl mb-3">
                Dual-Source Fetch
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-md">
                Pulls from ECCC static maps and MSC GeoMet WMS API with
                intelligent fallback. If one source is down, the other kicks in
                automatically.
              </p>
            </div>
          </div>

          {/* Feature 2 — tall card */}
          <div className="row-span-2 rounded-2xl bg-[var(--surface-container)] p-8 hover:bg-[var(--surface-container-high)] transition-all duration-300 group flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center mb-5 group-hover:bg-[var(--accent)]/20 transition-colors">
                <Zap size={22} className="text-[var(--accent)]" />
              </div>
              <h3 className="text-[var(--text-primary)] font-display font-semibold text-xl mb-3">
                Color Enhancement
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                OpenCV pipeline: foreground extraction, land/water segmentation
                via pre-built mask, and color mapping that preserves all
                meteorological notation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-label mt-6">
              <Layers size={14} />
              <span>Land mask + Color overlay</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-[var(--surface-container)] p-8 hover:bg-[var(--surface-container-high)] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center mb-5 group-hover:bg-[var(--accent)]/20 transition-colors">
              <Clock size={22} className="text-[var(--accent)]" />
            </div>
            <h3 className="text-[var(--text-primary)] font-display font-semibold text-xl mb-3">
              Always Current
            </h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              APScheduler runs every 30 min. SHA-256 dedup ensures only new data
              is stored in a rolling 7-day archive.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
