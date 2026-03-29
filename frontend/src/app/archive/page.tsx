"use client";

import { ArchiveGallery } from "@/components/ArchiveGallery";
import { Database } from "lucide-react";

export default function ArchivePage() {
  return (
    <div>
      {/* ─── Archive Hero ───────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Database size={14} className="text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)] text-sm font-label">
              7-Day Rolling Archive
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Map <span className="gradient-text">Archive</span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Browse all processed maps from the last 7 days. Filter by type,
            download originals or enhanced versions.
          </p>
        </div>
      </section>

      {/* ─── Archive Gallery ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <ArchiveGallery />
      </section>
    </div>
  );
}
