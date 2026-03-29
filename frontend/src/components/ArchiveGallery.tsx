"use client";

import { useState, useEffect } from "react";
import { getArchive, getImageUrl, MAP_TYPE_LABELS, type ArchiveEntry } from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";
import { Calendar, Download } from "lucide-react";

export function ArchiveGallery() {
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await getArchive();
        setArchive(data.archive || []);
      } catch {
        // Silently fail — archive is secondary
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Group by date
  const grouped: Record<string, ArchiveEntry[]> = {};
  const filtered = filter === "all" ? archive : archive.filter((e) => e.map_type === filter);

  for (const entry of filtered) {
    const date = entry.timestamp.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(entry);
  }

  const dates = Object.keys(grouped).sort().reverse();

  // Get unique map types for filter
  const mapTypes = [...new Set(archive.map((e) => e.map_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (archive.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="mx-auto text-white/20 mb-4" size={48} />
        <p className="text-white/40">No archived maps yet</p>
        <p className="text-white/20 text-sm mt-1">
          Maps will appear here after the first fetch cycle
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filter === "all"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "bg-white/5 text-white/40 border border-white/10 hover:text-white/60"
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
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/60"
            }`}
          >
            {MAP_TYPE_LABELS[type]?.split(" — ")[0] || type}
          </button>
        ))}
      </div>

      {/* Grouped by date */}
      {dates.map((date) => (
        <div key={date}>
          <h4 className="text-white/60 text-sm font-mono mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-white/30" />
            {new Date(date + "T00:00:00Z").toLocaleDateString("en-CA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
            <span className="text-white/20">({grouped[date].length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grouped[date].map((entry) => (
              <div
                key={`${entry.map_type}-${entry.filename}`}
                className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                  <img
                    src={getImageUrl(entry.image_url)}
                    alt={entry.map_type}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div className="p-3 space-y-1">
                  <p className="text-white/80 text-sm font-medium truncate">
                    {MAP_TYPE_LABELS[entry.map_type] || entry.map_type}
                  </p>
                  <p className="text-white/30 text-xs font-mono">
                    {entry.timestamp ? formatTimestamp(entry.timestamp) : ""}
                  </p>
                </div>

                {/* Download overlay */}
                <a
                  href={getImageUrl(entry.image_url)}
                  download={entry.filename}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white/50 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                >
                  <Download size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
