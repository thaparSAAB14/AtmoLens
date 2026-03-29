"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Satellite,
  Layers,
  Database,
  Globe,
  ArrowRight,
  Shield,
  ExternalLink,
  PenTool,
  BookOpen,
  Coffee,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const HandWrittenTitle = dynamic(
  () => import("@/components/ui/hand-writing-text").then((mod) => mod.HandWrittenTitle),
  { ssr: false }
);

/* ── Reveal on scroll ──────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export default function AboutPage() {
  return (
    <div className="bg-fun-pattern min-h-screen pb-24">
      {/* ─── 01 · Hand-Written Hero ──────────────────────────────────────── */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <HandWrittenTitle 
          title="About AtmoLens" 
          subtitle="A story of squinting at maps and fixing them."
        />
      </section>

      {/* ─── 02 · The Narration (Notebook Style) ─────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6">
        <Reveal>
          <div className="notebook-paper p-8 sm:p-12 mb-16 dark:notebook-paper-dark depth-lifted">
            {/* Binding Holes */}
            <div className="notebook-binding-holes">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="notebook-binding-hole" />
               ))}
            </div>

            <div className="flex items-center gap-3 mb-8">
              <PenTool size={20} className="text-red-400 rotate-12" />
              <span className="font-handwriting text-2xl text-[var(--accent)]">
                ENTRY #001: The Problem
              </span>
            </div>

            <div className="font-handwriting text-xl sm:text-2xl text-[var(--text-primary)] space-y-8 leading-[2rem]">
              <p>
                It all started in a dark room, staring at a screen filled with grey noise.
                As a student, I was tasked with reading Environment Canada (ECCC) synoptic charts.
                If you haven't seen them, they're... <span className="underline decoration-red-400">challenging</span>.
              </p>
              
              <p>
                Land blends into the sea. Coastlines disappear under isobars.
                I spent more time trying to figure out if I was looking at Ontario or the Pacific Ocean
                 than actually analyzing the weather patterns.
              </p>

              <div className="flex justify-center py-4">
                <div className="w-1/2 h-px bg-red-200/50" />
              </div>

              <p>
                Then I realized something. The map background — the coastlines, the borders, the grid — 
                it <span className="italic font-bold">never changes</span>. 
                It's exactly the same pixels in every single analysis chart they publish.
              </p>

              <p className="text-[var(--accent)] font-bold">
                "Wait, why don't I just paint over the boring parts?"
              </p>
            </div>
          </div>
        </Reveal>

        {/* ─── 03 · The Solution (Scrapbook feel) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          <Reveal delay={0.2} className="relative">
            <div className="bg-[#fcf8e8] dark:bg-zinc-800 p-6 rounded-sm rotate-[-1.5deg] depth-floating border border-zinc-200/50 dark:border-white/5 mx-auto max-w-sm relative group curled-corner">
               {/* REALISTIC TAPE */}
               <div className="visual-tape tape-jagged-horizontal -top-4 left-1/2 -translate-x-1/2 rotate-3 opacity-80" />
               
               <div className="w-full aspect-video bg-zinc-100/30 dark:bg-zinc-900/40 rounded-xs flex items-center justify-center mb-6 border border-zinc-200/10">
                  <Coffee size={44} className="text-zinc-400 group-hover:scale-110 transition-transform duration-500" />
               </div>
               
               <h3 className="font-handwriting text-2xl font-bold mb-3 text-zinc-900 dark:text-zinc-100">Development Fuel</h3>
               <p className="font-handwriting text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed">
                 Countless cups of coffee were sacrificed to the OpenCV gods while fine-tuning the land mask.
               </p>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="bg-[#fcf8e8] dark:bg-zinc-800 p-6 rounded-sm rotate-[1.5deg] depth-floating border border-zinc-200/50 dark:border-white/5 mx-auto max-w-sm relative group curled-corner">
               {/* REALISTIC TAPE */}
               <div className="visual-tape tape-jagged-horizontal -top-4 left-1/2 -translate-x-1/2 -rotate-2 opacity-80" />

               <div className="w-full aspect-video bg-zinc-100/30 dark:bg-zinc-900/40 rounded-xs flex items-center justify-center mb-6 border border-zinc-200/10">
                  <Sparkles size={44} className="text-[var(--accent)] group-hover:scale-110 transition-transform duration-500" />
               </div>

               <h3 className="font-handwriting text-2xl font-bold mb-3 text-zinc-900 dark:text-zinc-100">The Magic Trick</h3>
               <p className="font-handwriting text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed">
                 The script separates the meteorological data from the background, paints the world, 
                 and stitches it back together. All in 0.4 seconds.
               </p>
            </div>
          </Reveal>
        </div>

        {/* ─── 04 · How it works (Narrated) ──────────────────────────────── */}
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="font-handwriting text-4xl font-bold mb-4">The Automated Journal</h2>
            <div className="flex items-center justify-center gap-2">
               <BookOpen size={20} className="text-[var(--accent)]" />
               <p className="font-handwriting text-xl text-zinc-700 dark:text-zinc-300">How we do it, every 30 minutes.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               { icon: Satellite, title: "1. The Retrieval", desc: "Our robots wake up every half hour to check the ECCC servers for fresh synoptics." },
               { icon: Layers, title: "2. The Extraction", desc: "OpenCV identifies the foreground lines (pressure, systems) vs the background noise." },
               { icon: Sparkles, title: "3. The Coloration", desc: "We apply the master land mask. Land gets its green, ocean gets its blue. The contrast hits." },
             ].map((item, i) => (
                <div key={i} className="bg-white/60 dark:bg-zinc-800/60 p-5 rounded-xs border border-zinc-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group relative curled-corner">
                   {/* TAPE LABEL */}
                   <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-200/40 dark:bg-white/15 backdrop-blur-sm text-[10px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest clip-path-tape">
                      STAGES
                   </div>
                   
                   <div className="w-10 h-10 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <item.icon size={18} className="text-[var(--accent)]" />
                   </div>
                   <h4 className="font-handwriting text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h4>
                   <p className="font-handwriting text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">{item.desc}</p>
                </div>
             ))}
          </div>
        </Reveal>

        {/* ─── 05 · Footerish Note ────────────────────────────────────────── */}
        <Reveal delay={0.5} className="mt-24">
          <div className="border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 pt-12 text-center">
             <p className="font-handwriting text-2xl text-[var(--text-primary)]">
               "Making complex data look simple was the goal. I hope it helps you too." <br/>
               <span className="text-[var(--text-muted)] text-lg">— The AtmoLens Team</span>
             </p>
             
             <div className="mt-12 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-6">
                    <Shield size={16} className="text-zinc-500" />
                    <p className="text-sm font-label text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
                      Data license: ECCC MSC v2.1
                    </p>
                 </div>
                <a 
                  href="/maps" 
                  className="inline-flex items-center gap-2 font-handwriting text-2xl text-[var(--accent)] hover:underline"
                >
                  Enough talk, let's see some maps <ArrowRight size={20} rotate={-45} />
                </a>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
