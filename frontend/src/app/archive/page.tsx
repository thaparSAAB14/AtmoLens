"use client";

import { motion } from "framer-motion";
import { ArchiveGallery } from "@/components/ArchiveGallery";
import { Database, Download, Clock, SlidersHorizontal } from "lucide-react";

const archiveHighlights = [
  {
    title: "Smart filters",
    description: "Pick a map type from the dropdown, select a day range, and jump to any date.",
    icon: SlidersHorizontal,
  },
  {
    title: "Metadata-rich cards",
    description: "See map time, ingest time, file sizes, and processor version at a glance.",
    icon: Download,
  },
  {
    title: "Timeline jumps",
    description: "Use daily timeline chips for rapid historical lookup.",
    icon: Clock,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ArchivePage() {
  return (
    <div>
      {/* ─── Archive Hero ───────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            initial="hidden"
            animate="show"
            variants={fadeUp}
          >
            <Database size={14} className="text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)] text-sm font-label">
              Autonomous Historical Archive
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4"
            initial="hidden"
            animate="show"
            variants={fadeUp}
          >
            Map <span className="gradient-text">Archive</span>
          </motion.h1>
          <motion.p
            className="text-[var(--text-secondary)] max-w-2xl mx-auto"
            initial="hidden"
            animate="show"
            variants={fadeUp}
          >
            Browse by map family, year, month, and day with ingest metadata, timeline quick-jumps,
            and one-click downloads for both enhanced and original charts.
          </motion.p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3 text-left">
            {archiveHighlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <div className="size-9 rounded-xl bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-display font-semibold">
                      {item.title}
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Archive Gallery ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <ArchiveGallery />
      </section>
    </div>
  );
}
