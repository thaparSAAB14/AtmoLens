"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getArchive, getImageUrl, MAP_TYPE_LABELS, type ArchiveEntry, type ArchiveResponse } from "@/lib/api";
import { formatTimestamp, formatTimestampLocal } from "@/lib/utils";
import { Calendar, Download, RefreshCw, X, Database, ChevronDown, Layers } from "lucide-react";
import Image from "next/image";
import { ThreeDWallCalendar, type CalendarEvent } from "./ui/three-dwall-calendar";
import { ArchiveDetailTree } from "@/components/ArchiveDetailTree";
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
  
  // Fetch 14 days to populate the calendar wall
  const daysWindow = 14;
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Filtering state
  const [selectedType, setSelectedType] = useState<string>("all");
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

  const filteredArchive = useMemo(() => {
    if (selectedType === "all") return archive;
    return archive.filter((entry) => entry.map_type === selectedType);
  }, [archive, selectedType]);

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return filteredArchive.map((entry) => ({
      id: entry.path || `${entry.map_type}-${entry.filename}`,
      title: MAP_TYPE_LABELS[entry.map_type] || entry.map_type,
      date: entry.timestamp,
    }));
  }, [filteredArchive]);

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

  const selectedTypeLabel = selectedType === "all" ? "All Categories" : MAP_TYPE_LABELS[selectedType] || selectedType;

  // Find all maps for the selected date
  const selectedDayEntries = selectedDate 
    ? filteredArchive.filter(entry => entry.timestamp.startsWith(selectedDate.toISOString().slice(0, 10)))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-9 h-9 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error && archive.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-8 text-center">
        <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white dark:bg-red-500/20 dark:text-red-200 dark:hover:bg-red-500/30 text-sm font-semibold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          Archive loaded from last successful response. Live refresh failed.
        </div>
      )}

      {/* ── Top Dashboard Bar ──────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-label uppercase tracking-widest">
            <Database size={16} className="text-[var(--accent)]" />
            Archive Map Index
          </div>
          <div className="hidden sm:block w-px h-5 bg-[var(--border)]" />
          <div className="text-[var(--text-primary)] font-medium text-sm">
            <span className="text-[var(--accent)] font-bold">{archive.length}</span> Total Maps Indexed
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Category Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setTypeDropdownOpen((v) => !v)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--surface-container-high)] text-[var(--text-primary)] hover:bg-[var(--surface-variant)] transition-all border border-[var(--border)] hover:border-[var(--accent)]/50 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[var(--text-muted)]" />
                <span className="truncate max-w-[140px]">{selectedTypeLabel}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--text-muted)] transition-transform duration-200 ${typeDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            
            {typeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTypeDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-[240px] rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in-up">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setSelectedType("all");
                        setTypeDropdownOpen(false);
                        setSelectedDate(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedType === "all"
                          ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-container)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      All Categories
                    </button>
                    {Object.entries(MAP_TYPE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedType(key);
                          setTypeDropdownOpen(false);
                          setSelectedDate(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedType === key
                            ? "bg-[var(--accent-dim)] text-[var(--accent)] font-medium"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-container)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => void load()}
            className="p-2.5 rounded-xl bg-[var(--surface-container-high)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-all shadow-sm"
            title="Refresh archive"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Detail View (when a day is clicked) ──────────────────────────── */}
      {selectedDate ? (
        <div className="space-y-6 animate-fade-in-up mt-8">
          <div className="glass rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-[var(--accent)]">
            <div>
              <h3 className="text-xl font-display font-semibold text-[var(--text-primary)]">
                {selectedDate.toLocaleDateString("en-CA", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                {selectedDayEntries.length} {selectedTypeLabel.toLowerCase()} map(s) archived on this date.
              </p>
            </div>
            
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-container)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-container-high)] transition-all shadow-sm border border-[var(--border)]"
            >
              <X size={16} />
              <span className="hidden sm:inline">Close Day View</span>
            </button>
          </div>

          <div className="mt-4 animate-fade-in-up">
            {selectedDayEntries.length === 0 ? (
              <div className="py-16 text-center text-[var(--text-muted)] bg-[var(--surface-container)] rounded-2xl border border-[var(--border)] border-dashed">
                No {selectedTypeLabel} maps found for this date.
              </div>
            ) : (
              <ArchiveDetailTree entries={selectedDayEntries} />
            )}
          </div>
        </div>
      ) : (
        /* ── Calendar View ─────────────────────────────────────────────── */
        <div className="animate-fade-in-up mt-4">
          {archive.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <Calendar className="mx-auto text-[var(--text-muted)] mb-4" size={48} />
              <p className="text-[var(--text-secondary)]">No archived maps available in this timeframe</p>
            </div>
          ) : (
            <div className="w-full relative overflow-visible pt-12 pb-12 mt-8">
              <ThreeDWallCalendar 
                events={calendarEvents} 
                onDayClick={setSelectedDate} 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
