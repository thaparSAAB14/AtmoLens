"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getArchive,
  getImageUrl,
  MAP_TYPE_LABELS,
  type ArchiveEntry,
  type ArchiveResponse,
  type ArchiveTreeGroup,
} from "@/lib/api";
import { formatTimestamp, formatTimestampLocal } from "@/lib/utils";
import { Calendar, Database, Download, Filter, Layers3, RefreshCw } from "lucide-react";

const WINDOW_OPTIONS = [7, 30, 90] as const;

type GroupName = "Surface" | "Upper Air" | "Model Guidance" | "Other";

function resolveGroup(mapType: string): GroupName {
  if (mapType.startsWith("surface_")) return "Surface";
  if (mapType.startsWith("upper_")) return "Upper Air";
  if (mapType.includes("herbie") || mapType.includes("gdps")) return "Model Guidance";
  return "Other";
}

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
  const [daysWindow, setDaysWindow] = useState<number>(30);
  const [selectedGroup, setSelectedGroup] = useState<GroupName | "all">("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");

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
  const hierarchy = useMemo(() => data?.hierarchy ?? [], [data?.hierarchy]);

  const availableGroups = useMemo(
    () => hierarchy.filter((bucket) => bucket.count > 0).map((bucket) => bucket.group as GroupName),
    [hierarchy]
  );

  const availableTypes = useMemo(() => {
    const groups = selectedGroup === "all"
      ? hierarchy
      : hierarchy.filter((group) => group.group === selectedGroup);
    const typeSet = new Set<string>();
    for (const group of groups) {
      for (const typeBucket of group.types) {
        typeSet.add(typeBucket.map_type);
      }
    }
    return Array.from(typeSet).sort((a, b) => (MAP_TYPE_LABELS[a] || a).localeCompare(MAP_TYPE_LABELS[b] || b));
  }, [hierarchy, selectedGroup]);

  useEffect(() => {
    if (selectedType !== "all" && !availableTypes.includes(selectedType)) {
      setSelectedType("all");
    }
  }, [availableTypes, selectedType]);

  const groupAndTypeFiltered = useMemo(() => {
    return archive.filter((entry) => {
      if (selectedGroup !== "all" && resolveGroup(entry.map_type) !== selectedGroup) return false;
      if (selectedType !== "all" && entry.map_type !== selectedType) return false;
      return true;
    });
  }, [archive, selectedGroup, selectedType]);

  const timeline = useMemo(() => {
    const dayMap = new Map<string, { count: number; types: Set<string> }>();
    for (const entry of groupAndTypeFiltered) {
      const day = entry.timestamp.slice(0, 10);
      const bucket = dayMap.get(day) ?? { count: 0, types: new Set<string>() };
      bucket.count += 1;
      bucket.types.add(entry.map_type);
      dayMap.set(day, bucket);
    }
    return Array.from(dayMap.entries())
      .map(([day, bucket]) => ({
        day,
        count: bucket.count,
        map_types: Array.from(bucket.types).sort(),
      }))
      .sort((a, b) => b.day.localeCompare(a.day));
  }, [groupAndTypeFiltered]);

  const filtered = useMemo(() => {
    if (selectedDay === "all") return groupAndTypeFiltered;
    return groupAndTypeFiltered.filter((entry) => entry.timestamp.startsWith(selectedDay));
  }, [groupAndTypeFiltered, selectedDay]);

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

  const filteredHierarchy = useMemo((): ArchiveTreeGroup[] => {
    const groups = selectedGroup === "all"
      ? hierarchy
      : hierarchy.filter((bucket) => bucket.group === selectedGroup);

    return groups
      .map((group) => ({
        ...group,
        types: group.types.filter((typeBucket) => selectedType === "all" || typeBucket.map_type === selectedType),
      }))
      .filter((group) => group.types.length > 0);
  }, [hierarchy, selectedGroup, selectedType]);

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

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
          Archive loaded from last successful response. Live refresh failed.
        </div>
      )}

      <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-label uppercase tracking-widest">
            <Database size={14} />
            Autonomous Archive
          </div>
          <div className="ml-auto flex items-center gap-2">
            {WINDOW_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setDaysWindow(option)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  daysWindow === option
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {option}d
              </button>
            ))}
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[var(--text-muted)] text-xs font-label uppercase tracking-widest flex items-center gap-1">
            <Filter size={12} />
            Group
          </span>
          <button
            onClick={() => setSelectedGroup("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedGroup === "all"
                ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            All
          </button>
          {availableGroups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedGroup === group
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[var(--text-muted)] text-xs font-label uppercase tracking-widest flex items-center gap-1">
            <Layers3 size={12} />
            Type
          </span>
          <button
            onClick={() => setSelectedType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedType === "all"
                ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            All
          </button>
          {availableTypes.map((mapType) => (
            <button
              key={mapType}
              onClick={() => setSelectedType(mapType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === mapType
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {MAP_TYPE_LABELS[mapType] || mapType}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[var(--text-secondary)] text-xs font-label uppercase tracking-widest">
            Timeline (Year &gt; Month &gt; Day)
          </p>
          <button
            onClick={() => setSelectedDay("all")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              selectedDay === "all"
                ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            All days
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {timeline.slice(0, 21).map((point) => (
            <button
              key={point.day}
              onClick={() => setSelectedDay(point.day)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                selectedDay === point.day
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
              title={`${point.day} (${point.count})`}
            >
              {point.day.slice(5)} ({point.count})
            </button>
          ))}
        </div>

        <div className="max-h-[250px] overflow-auto pr-1 space-y-4">
          {filteredHierarchy.map((group) => (
            <div key={group.group}>
              <p className="text-[var(--text-primary)] text-sm font-display mb-2">
                {group.group} <span className="text-[var(--text-muted)]">({group.count})</span>
              </p>
              <div className="space-y-2">
                {group.types.map((typeBucket) => (
                  <div key={typeBucket.map_type} className="rounded-xl bg-[var(--surface-container)] p-2.5">
                    <p className="text-[var(--text-secondary)] text-xs mb-2">
                      {typeBucket.label} <span className="text-[var(--text-muted)]">({typeBucket.count})</span>
                    </p>
                    <div className="space-y-1.5">
                      {typeBucket.years.map((yearBucket) => (
                        <div key={`${typeBucket.map_type}-${yearBucket.year}`}>
                          <p className="text-[var(--text-muted)] text-[11px] uppercase tracking-widest">
                            {yearBucket.year}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {yearBucket.months.flatMap((monthBucket) =>
                              monthBucket.days.map((dayBucket) => (
                                <button
                                  key={`${typeBucket.map_type}-${dayBucket.day}`}
                                  onClick={() => setSelectedDay(dayBucket.day)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                                    selectedDay === dayBucket.day
                                      ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                                      : "bg-[var(--surface-container-high)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                  }`}
                                  title={`${dayBucket.day} (${dayBucket.count})`}
                                >
                                  {dayBucket.day.slice(5)} ({dayBucket.count})
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <span className="text-[var(--text-muted)] text-xs">{entries.length} maps</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {entries.map((entry) => (
                  <article
                    key={entry.path || `${entry.map_type}-${entry.filename}`}
                    className="group rounded-xl overflow-hidden bg-[var(--surface-container)] border border-[var(--border)]/50"
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
                        Map time: {entry.source_timestamp ? formatTimestamp(entry.source_timestamp) : formatTimestamp(entry.timestamp)}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Ingested: {entry.ingested_at ? formatTimestampLocal(entry.ingested_at) : formatTimestampLocal(entry.timestamp)}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Source size: {formatBytes(entry.source_size_bytes)} • Processed: {formatBytes(entry.processed_size_bytes)}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px]">
                        Processor: {entry.processing_version || "legacy"}
                      </p>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-2">
                      <button
                        onClick={() => void handleDownload(getImageUrl(entry.image_url), entry.filename)}
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
