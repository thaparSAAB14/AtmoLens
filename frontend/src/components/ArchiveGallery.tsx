"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getArchive, getImageUrl, MAP_TYPE_LABELS, type ArchiveEntry, type ArchiveResponse } from "@/lib/api";
import { formatTimestamp, formatTimestampLocal } from "@/lib/utils";
import { Calendar, Download, RefreshCw, X, Database } from "lucide-react";
import Image from "next/image";
import { ThreeDWallCalendar, type CalendarEvent } from "./ui/three-dwall-calendar";

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
  
  // Always fetch 90 days to populate the calendar
  const daysWindow = 90;
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return archive.map((entry) => ({
      id: entry.path || `${entry.map_type}-${entry.filename}`,
      title: MAP_TYPE_LABELS[entry.map_type] || entry.map_type,
      date: entry.timestamp,
    }));
  }, [archive]);

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

  // Find all maps for the selected date
  const selectedDayEntries = selectedDate 
    ? archive.filter(entry => entry.timestamp.startsWith(selectedDate.toISOString().slice(0, 10)))
    : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          Archive loaded from last successful response. Live refresh failed.
        </div>
      )}

      {/* Detail View (when a day is clicked) */}
      {selectedDate ? (
        <div className="space-y-6 animate-fade-in-up">
          <div className="glass rounded-2xl p-5 flex items-center justify-between">
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
                {selectedDayEntries.length} maps archived on this date.
              </p>
            </div>
            
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-container)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-container-high)] transition-all"
            >
              <X size={16} />
              <span>Back to Calendar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {selectedDayEntries.map((entry) => (
              <article
                key={entry.path || `${entry.map_type}-${entry.filename}`}
                className="group rounded-xl overflow-hidden bg-[var(--surface-container)] border border-[var(--border)]/50 transition-shadow duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/5 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-variant)]">
                  <a
                    href={getImageUrl(entry.image_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${MAP_TYPE_LABELS[entry.map_type] || entry.map_type}`}
                  >
                    <Image
                      src={getImageUrl(entry.image_url)}
                      alt={MAP_TYPE_LABELS[entry.map_type] || entry.map_type}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>
                </div>

                <div className="p-4 flex-1 space-y-1.5">
                  <p className="text-[var(--text-primary)] text-sm font-display font-medium">
                    {MAP_TYPE_LABELS[entry.map_type] || entry.map_type}
                  </p>
                  <div className="text-[var(--text-muted)] text-[11px] space-y-0.5">
                    <p>Map time: {entry.source_timestamp ? formatTimestamp(entry.source_timestamp) : formatTimestamp(entry.timestamp)}</p>
                    <p>Ingested: {entry.ingested_at ? formatTimestampLocal(entry.ingested_at) : formatTimestampLocal(entry.timestamp)}</p>
                    <p>Source: {formatBytes(entry.source_size_bytes)} • Processed: {formatBytes(entry.processed_size_bytes)}</p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => void handleDownload(getImageUrl(entry.image_url), entry.filename)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)]/15 transition-colors text-center"
                  >
                    Download Enhanced
                  </button>
                  {entry.original_url && (
                    <button
                      onClick={() => void handleDownload(getImageUrl(entry.original_url!), entry.original_filename || entry.filename)}
                      className="p-2 rounded-lg bg-[var(--surface-container-high)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Download original"
                      aria-label="Download original"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-label uppercase tracking-widest">
              <Database size={16} />
              Interactive Archive
            </div>
            <button
              onClick={() => void load()}
              className="p-2 rounded-lg bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title="Refresh archive"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          {archive.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <Calendar className="mx-auto text-[var(--text-muted)] mb-4" size={48} />
              <p className="text-[var(--text-secondary)]">No archived maps available in this timeframe</p>
            </div>
          ) : (
            <div className="w-full relative overflow-visible pt-8 pb-12">
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
