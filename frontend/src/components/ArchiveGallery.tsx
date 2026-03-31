"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getArchive, getImageUrl, MAP_TYPE_LABELS, type ArchiveEntry } from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";
import { Calendar, Download } from "lucide-react";

export function ArchiveGallery() {
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getArchive();
      setArchive(data.archive || []);
      setError(null);
    } catch {
      setError("We couldn't load the archive right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === "all" ? archive : archive.filter((e) => e.map_type === filter)),
    [archive, filter]
  );

  const { grouped, dates } = useMemo(() => {
    const groupedByDate: Record<string, ArchiveEntry[]> = {};
    for (const entry of filtered) {
      const date = entry.timestamp?.split("T")?.[0];
      if (!date) continue;
      if (!groupedByDate[date]) groupedByDate[date] = [];
      groupedByDate[date].push(entry);
    }
    return {
      grouped: groupedByDate,
      dates: Object.keys(groupedByDate).sort().reverse(),
    };
  }, [filtered]);

  const mapTypes = useMemo(
    () => [...new Set(archive.map((e) => e.map_type))].sort(),
    [archive]
  );

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error && archive.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 font-medium">{error}</p>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          Please try again in a moment.
        </p>
        <button
          onClick={() => load()}
          className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/15 transition-colors"
        >
          Try again
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
          Maps will appear here after the first fetch cycle
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-amber-200 text-sm">
            Live updates are temporarily unavailable. Showing the last available archive.
          </p>
          <button
            onClick={() => load()}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-200 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filter === "all"
              ? "bg-[var(--accent-dim)] text-[var(--accent)]"
              : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          All Types
        </button>
        {mapTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === type
                ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {MAP_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Grouped by date */}
      {dates.map((date) => (
        <div key={date}>
          <h4 className="text-[var(--text-secondary)] text-sm font-label mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-[var(--text-muted)]" />
            {new Date(date + "T00:00:00Z").toLocaleDateString("en-CA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
            <span className="text-[var(--text-muted)]">({grouped[date].length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grouped[date].map((entry) => (
              <div
                key={entry.path || `${entry.map_type}-${entry.filename}`}
                className="group relative rounded-xl overflow-hidden bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--surface-variant)]">
                  <a
                    href={getImageUrl(entry.image_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
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
                  <p className="text-[var(--text-primary)] text-sm font-display font-medium truncate">
                    {MAP_TYPE_LABELS[entry.map_type] || entry.map_type}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs font-label">
                    {entry.timestamp ? formatTimestamp(entry.timestamp) : ""}
                  </p>
                </div>

                {/* Download overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleDownload(getImageUrl(entry.image_url), entry.filename)}
                    className="p-2 rounded-lg bg-[var(--surface)]/50 backdrop-blur-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                    title="Download enhanced"
                    aria-label="Download enhanced"
                  >
                    <Download size={14} />
                  </button>
                  {entry.original_url && (
                    <button
                      onClick={() =>
                        handleDownload(
                          getImageUrl(entry.original_url!),
                          entry.original_filename || entry.filename
                        )
                      }
                      className="p-2 rounded-lg bg-[var(--surface)]/50 backdrop-blur-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      title="Download original"
                      aria-label="Download original"
                    >
                      <Download size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
