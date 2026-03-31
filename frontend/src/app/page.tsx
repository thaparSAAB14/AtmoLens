"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { SpecialText } from "@/components/ui/special-text";
import {
  Cloud,
  Archive,
  ArrowDown,
  ArrowRight,
  MapPin,
  Zap,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";

const ShaderAnimation = dynamic(
  () =>
    import("@/components/ui/shader-animation").then(
      (mod) => mod.ShaderAnimation
    ),
  { ssr: false }
);

const scrapbookNotes = [
  {
    title: "Timed Fetch",
    copy:
      "Every 30 minutes we grab the latest ECCC analysis charts and tag them with a fresh timestamp.",
    meta: "Auto-sync",
    icon: Clock,
    tilt: "-rotate-2",
  },
  {
    title: "Bit-Depth Color",
    copy:
      "We preserve the synoptic ink while re-mapping land and water into clear, readable tones.",
    meta: "Enhance",
    icon: Zap,
    tilt: "rotate-1",
  },
  {
    title: "Publish + Archive",
    copy:
      "Processed maps land in a 7-day archive so you can revisit the last week at a glance.",
    meta: "Store",
    icon: Archive,
    tilt: "-rotate-1",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div>
      {/* --- Hero Section ------------------------------------------------- */}
      <section className="relative min-h-[90svh] flex items-center justify-center overflow-hidden pb-20 pt-16 sm:pt-20">
        <div className="absolute inset-0 opacity-45">
          <ShaderAnimation />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/40 via-[var(--background)]/10 to-[var(--background)]" />

        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            variants={fadeUp}
          >
            <Cloud size={14} className="text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)] text-sm font-label">
              <SpecialText speed={30} delay={0.5}>
                Automated Weather Intelligence
              </SpecialText>
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            variants={fadeUp}
          >
            <span className="text-[var(--text-primary)]">See Weather</span>
            <br />
            <span className="gradient-text">Like Never Before</span>
          </motion.h1>

          <motion.p
            className="text-[var(--text-secondary)] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
            variants={fadeUp}
          >
            Grayscale ECCC synoptic charts, automatically transformed into
            color-enhanced, readable maps. Every 30 minutes. Zero intervention.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeUp}
          >
            <Link
              href="/maps"
              className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-glow)] text-[var(--accent-foreground)] font-semibold hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/20"
            >
              <Eye size={18} />
              View Live Maps
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/archive"
              className="flex items-center gap-2 px-8 py-3 rounded-xl glass text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-container-high)] hover:text-[var(--text-primary)] transition-all duration-300"
            >
              <Archive size={18} />
              7-Day Archive
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <ArrowDown size={20} className="text-[var(--text-muted)] animate-bounce" />
        </motion.div>
      </section>

      {/* --- Scrapbook Pipeline Section ----------------------------------- */}
      <section className="relative py-20 sm:py-24">
        <div className="absolute inset-0 bg-fun-pattern" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/60 to-[var(--background)]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            className="mb-12"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
          >
            <span className="text-[var(--text-muted)] text-xs font-label uppercase tracking-[0.2em]">
              The Scrapbook
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-4">
              The pipeline, but human.
            </h2>
            <p className="text-[var(--text-secondary)] mt-3 max-w-2xl">
              Think of it as a field notebook: raw maps, annotated color, and a tidy
              archive that stays fresh.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div className="grid sm:grid-cols-2 gap-6">
              {scrapbookNotes.map((note, index) => {
                const Icon = note.icon;
                return (
                  <motion.article
                    key={note.title}
                    className={`scrap-card depth-lifted ${note.tilt} relative p-6`}
                    initial={{ opacity: 0, y: 24, rotate: -2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -6, rotate: 1 }}
                  >
                    <div className="visual-tape tape-jagged-horizontal -top-4 left-6" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-10 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center">
                        <Icon size={20} className="text-[var(--accent)]" />
                      </div>
                      <span className="text-[var(--text-muted)] text-xs font-label uppercase tracking-[0.2em]">
                        {note.meta}
                      </span>
                    </div>
                    <h3 className="text-[var(--text-primary)] font-display font-semibold text-xl mb-2">
                      {note.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      {note.copy}
                    </p>
                  </motion.article>
                );
              })}
            </div>

            <motion.div
              className="scrap-card curled-corner depth-lifted relative p-8 flex flex-col gap-6"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: 0.2 }}
            >
              <div className="visual-tape tape-jagged-horizontal -top-4 left-1/2 -translate-x-1/2 rotate-2" />
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center">
                  <MapPin size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-xs font-label uppercase tracking-[0.2em]">
                    Live board
                  </p>
                  <h3 className="text-[var(--text-primary)] font-display text-2xl font-semibold">
                    Maps, pinned in place.
                  </h3>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--surface-container-high)] p-4 flex flex-col gap-4">
                <div className="h-36 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 via-transparent to-[var(--tertiary)]/20 border border-[var(--border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] text-sm">
                    Freshness tracked, no guesswork.
                  </span>
                  <motion.span
                    className="text-[var(--accent)] text-xs font-label uppercase tracking-[0.2em]"
                    whileHover={{ scale: 1.05 }}
                  >
                    Tap any map
                  </motion.span>
                </div>
              </div>

              <Link
                href="/maps"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors"
              >
                Explore the live board
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
