"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getArchive,
  getImageUrl,
  MAP_TYPE_LABELS,
  MAP_TYPE_GROUPS,
  type ArchiveEntry,
  type ArchiveResponse,
} from "@/lib/api";
import { formatTimestamp, formatTimestampLocal } from "@/lib/utils";
import { Calendar, ChevronDown, Database, Download, RefreshCw } from "lucide-react";

const WINDOW_OPTIONS = [7, 30, 90] as const;

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function ArchiveGallery() {
  const [data, setData] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysWindow, setDaysWindow] = useState<number>(7);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getArchive(daysWindow);
      setData(response);
      setError(null);
    } catch {
      setError("We couldn't load the archive right now.");
    } finally {
      setLoading(false);
    }
  }, [daysWindow]);

  useEffect(() => {
    void load();
  }, [load]);

  const archive = useMemo(() => data?.archive ?? [], [data?.archive]);

  /* ── Derive available types, excluding Model Guidance ───────────────── */
  const availableTypes = useMemo(() => {
    const validTypes = new Set<string>();
    for (const group of Object.keys(MAP_TYPE_GROUPS)) {
      for (const t of MAP_TYPE_GROUPS[group]) {
        validTypes.add(t);
      }
    }
    const typeSet = new Set<string>();
    for (const entry of archive) {
      if (validTypes.has(entry.map_type)) {
        typeSet.add(entry.map_type);
      }
    }
    return Array.from(typeSet).sort(
      (a, b) => (MAP_TYPE_LABELS[a] || a).localeCompare(MAP_TYPE_LABELS[b] || b)
    );
  }, [archive]);

  useEffect(() => {
    if (selectedType !== "all" && !availableTypes.includes(selectedType)) {
      setSelectedType("all");
    }
  }, [availableTypes, selectedType]);

  /* ── Filter archive ─────────────────────────────────────────────────── */
  const typeFiltered = useMemo(() => {
    const validTypes = new Set<string>();
    for (const group of Object.keys(MAP_TYPE_GROUPS)) {
      for (const t of MAP_TYPE_GROUPS[group]) {
        validTypes.add(t);
      }
    }
    return archive.filter((entry) => {
      if (!validTypes.has(entry.map_type)) return false;
      if (selectedType !== "all" && entry.map_type !== selectedType) return false;
      return true;
    });
  }, [archive, selectedType]);

  /* ── Timeline from filtered data ────────────────────────────────────── */
  const timeline = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const entry of typeFiltered) {
      const day = entry.timestamp.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    return Array.from(dayMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.day.localeCompare(a.day));
  }, [typeFiltered]);

  const filtered = useMemo(() => {
    if (selectedDay === "all") return typeFiltered;
    return typeFiltered.filter((entry) => entry.timestamp.startsWith(selectedDay));
  }, [typeFiltered, selectedDay]);

  /* ── Group by day for rendering ─────────────────────────────────────── */
  const groupedByDay = useMemo(() => {
    const map = new Map<string, ArchiveEntry[]>();
    for (const entry of filtered) {
      const day = entry.timestamp.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(entry);
    }
    const sortedDays = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    for (const day of sortedDays) {
      map.get(day)!.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return { map, sortedDays };
  }, [filtered]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  /* ── States ─────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-9 h-9 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error && archive.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
        <p className="text-red-300 font-medium">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500/15 text-red-200 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (archive.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="mx-auto text-[var(--text-muted)] mb-4" size={48} />
        <p className="text-[var(--text-secondary)]">No archived maps yet</p>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          The archive fills after the first successful autonomous sync.
        </p>
        <button
          onClick={() => void load()}
          className="mt-5 px-4 py-2 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/15 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  const selectedTypeLabel =
    selectedType === "all" ? "All types" : MAP_TYPE_LABELS[selectedType] || selectedType;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          Archive loaded from last successful response. Live refresh failed.
        </div>
      )}

      {/* ── Unified Filter Bar ──────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-label uppercase tracking-widest">
            <Database size={14} />
            Archive
          </div>

          {/* Right side: Days + Type + Refresh */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Days selector */}
            {WINDOW_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setDaysWindow(option);
                  setSelectedDay("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  daysWindow === option
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {option}d
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-[var(--border)] mx-1 hidden sm:block" />

            {/* Type dropdown */}
            <div className="relative">
              <button
                onClick={() => setTypeDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-container)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all min-w-[120px] justify-between"
              >
                <span className="truncate max-w-[140px]">{selectedTypeLabel}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 flex-shrink-0 ${typeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {typeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setTypeDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in-up">
                    <button
                      onClick={() => {
                        setSelectedType("all");
                        setTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                        selectedType === "all"
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-container)]"
                      }`}
                    >
                      All map types
                    </button>
                    {Object.entries(MAP_TYPE_GROUPS).map(([group, types]) => {
                      const groupTypes = types.filter((t) =>
                        availableTypes.includes(t)
                      );
                      if (groupTypes.length === 0) return null;
                      return (
                        <div key={group}>
                          <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)] bg-[var(--surface-container-low)]">
                            {group}
                          </div>
                          {groupTypes.map((mapType) => (
                            <button
                              key={mapType}
                              onClick={() => {
                                setSelectedType(mapType);
                                setTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                                selectedType === mapType
                                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-container)]"
                              }`}
                            >
                              {MAP_TYPE_LABELS[mapType] || mapType}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={() => void load()}
              className="p-2 rounded-lg bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title="Refresh archive"
              aria-label="Refresh archive"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── Day Quick-Jump Chips ──────────────────────────────────────── */}
        {timeline.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDay("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedDay === "all"
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              All days
            </button>
            {timeline.slice(0, 14).map((point) => (
              <button
                key={point.day}
                onClick={() => setSelectedDay(point.day)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                  selectedDay === point.day
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
                title={`${point.day} (${point.count} maps)`}
              >
                {point.day.slice(5)} <span className="opacity-60">({point.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Result count */}
        <div className="text-[var(--text-muted)] text-[11px]">
          {filtered.length} {filtered.length === 1 ? "map" : "maps"} in{" "}
          {groupedByDay.sortedDays.length}{" "}
          {groupedByDay.sortedDays.length === 1 ? "day" : "days"}
        </div>
      </div>

      {/* ── Map Cards ──────────────────────────────────────────────────── */}
      <div className="space-y-5">
        {groupedByDay.sortedDays.map((day) => {
          const entries = groupedByDay.map.get(day) ?? [];
          return (
            <section key={day} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[var(--text-secondary)] text-sm font-label flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--text-muted)]" />
                  {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-CA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </h4>
                <span className="text-[var(--text-muted)] text-xs">
                  {entries.length} maps
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <article
                    key={entry.path || `${entry.map_type}-${entry.filename}`}
                    className="group rounded-xl overflow-hidden bg-[var(--surface-container)] border border-[var(--border)]/50 transition-shadow duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/5"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-variant)]">
                      <a
                        href={getImageUrl(entry.image_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${MAP_TYPE_LABELS[entry.map_type] || entry.map_type}`}
                      >
                        <img
                          src={getImageUrl(entry.image_url)}
                          alt={MAP_TYPE_LABELS[entry.map_type] || entry.map_type}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                    </div>

                    <div className="p-3 space-y-1">
                      <p className="text-[var(--text-primary)] text-sm font-display font-medium">
                        {MAP_TYPE_LABELS[entry.map_type] || entry.map_type}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Map time:{" "}
                        {entry.source_timestamp
                          ? formatTimestamp(entry.source_timestamp)
                          : formatTimestamp(entry.timestamp)}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Ingested:{" "}
                        {entry.ingested_at
                          ? formatTimestampLocal(entry.ingested_at)
                          : formatTimestampLocal(entry.timestamp)}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Source: {formatBytes(entry.source_size_bytes)} • Processed:{" "}
                        {formatBytes(entry.processed_size_bytes)}
                      </p>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-2">
                      <button
                        onClick={() =>
                          void handleDownload(
                            getImageUrl(entry.image_url),
                            entry.filename
                          )
                        }
                        className="px-3 py-1.5 rounded-lg text-xs bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)]/15 transition-colors"
                      >
                        Download Enhanced
                      </button>
                      {entry.original_url && (
                        <button
                          onClick={() =>
                            void handleDownload(
                              getImageUrl(entry.original_url!),
                              entry.original_filename || entry.filename
                            )
                          }
                          className="p-2 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Download original"
                          aria-label="Download original"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
