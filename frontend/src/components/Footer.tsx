"use client";

import { Cloud } from "lucide-react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-[var(--border)]">
      {/* Flickering grid background */}
      <div className="absolute inset-0 opacity-10">
        <FlickeringGrid
          squareSize={3}
          gridGap={8}
          flickerChance={0.2}
          color="rgb(0, 180, 180)"
          maxOpacity={0.25}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface-container-low)]/40 to-[var(--surface-container-low)]/80" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Cloud size={20} className="text-[var(--accent)]/60" />
            <span className="text-[var(--text-secondary)] text-sm font-display font-semibold">
              AtmoLens
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-xs text-center max-w-md">
             Data Source: Environment and Climate Change Canada. Contains information licensed under the Open Government Licence – Canada. See the{" "}
             <a
               href="https://eccc-msc.github.io/open-data/licence/readme_en/"
               target="_blank"
               rel="noopener noreferrer"
               className="text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors underline underline-offset-2"
             >
               ECCC Data Servers End-use Licence
             </a>
             .
          </p>
          <p className="text-[var(--text-secondary)] text-xs font-label">
             Auto-updates every 30 min
          </p>
        </div>
      </div>
    </footer>
  );
}
