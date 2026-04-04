import { NextRequest, NextResponse } from "next/server";
import { getArchive } from "@/lib/storage";
import { mapRowToArchiveEntry, type MapRow } from "@/lib/mapSerializers";
import { MAP_TYPE_LABELS, type ArchiveEntry } from "@/lib/api";

export const dynamic = "force-dynamic";

type GroupName = "Surface" | "Upper Air" | "Model Guidance" | "Other";

function resolveGroup(mapType: string): GroupName {
  if (mapType.startsWith("surface_")) return "Surface";
  if (mapType.startsWith("upper_")) return "Upper Air";
  if (mapType.includes("herbie") || mapType.includes("gdps")) return "Model Guidance";
  return "Other";
}

function parseArchiveDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);
  if (!Number.isFinite(raw)) return 30;
  return Math.min(365, Math.max(1, raw));
}

export async function GET(request: NextRequest) {
  try {
    const days = parseArchiveDays(request);
    const archive = (await getArchive(undefined, days)).map((row) =>
      mapRowToArchiveEntry(row as MapRow)
    );

    const timelineMap = new Map<string, { count: number; mapTypes: Set<string> }>();
    const hierarchyAccumulator = new Map<
      GroupName,
      Map<
        string,
        Map<
          string,
          Map<
            string,
            Map<
              string,
              {
                entries: ArchiveEntry[];
                count: number;
              }
            >
          >
        >
      >
    >();

    for (const entry of archive) {
      const day = entry.timestamp.slice(0, 10);
      const [year, month] = day.split("-");
      const group = resolveGroup(entry.map_type);

      const timelineBucket = timelineMap.get(day) ?? { count: 0, mapTypes: new Set<string>() };
      timelineBucket.count += 1;
      timelineBucket.mapTypes.add(entry.map_type);
      timelineMap.set(day, timelineBucket);

      if (!hierarchyAccumulator.has(group)) {
        hierarchyAccumulator.set(group, new Map());
      }

      const typeBuckets = hierarchyAccumulator.get(group)!;
      if (!typeBuckets.has(entry.map_type)) typeBuckets.set(entry.map_type, new Map());
      const yearBuckets = typeBuckets.get(entry.map_type)!;
      if (!yearBuckets.has(year)) yearBuckets.set(year, new Map());
      const monthBuckets = yearBuckets.get(year)!;
      if (!monthBuckets.has(month)) monthBuckets.set(month, new Map());
      const dayBuckets = monthBuckets.get(month)!;
      if (!dayBuckets.has(day)) {
        dayBuckets.set(day, { entries: [], count: 0 });
      }
      const dayBucket = dayBuckets.get(day)!;
      dayBucket.entries.push(entry);
      dayBucket.count += 1;
    }

    const hierarchy = Array.from(hierarchyAccumulator.entries()).map(([group, typeBuckets]) => {
      const types = Array.from(typeBuckets.entries())
        .map(([mapType, yearBuckets]) => {
          const years = Array.from(yearBuckets.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([year, monthBuckets]) => {
              const months = Array.from(monthBuckets.entries())
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, dayBuckets]) => {
                  const days = Array.from(dayBuckets.entries())
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([day, dayBucket]) => ({
                      day,
                      count: dayBucket.count,
                      entries: dayBucket.entries.sort((a, b) =>
                        b.timestamp.localeCompare(a.timestamp)
                      ),
                    }));
                  return {
                    month,
                    count: days.reduce((sum, bucket) => sum + bucket.count, 0),
                    days,
                  };
                });
              return {
                year,
                count: months.reduce((sum, bucket) => sum + bucket.count, 0),
                months,
              };
            });
          return {
            map_type: mapType,
            label: MAP_TYPE_LABELS[mapType] || mapType,
            count: years.reduce((sum, bucket) => sum + bucket.count, 0),
            years,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        group,
        count: types.reduce((sum, bucket) => sum + bucket.count, 0),
        types,
      };
    });

    const timeline = Array.from(timelineMap.entries())
      .map(([day, bucket]) => ({
        day,
        count: bucket.count,
        map_types: Array.from(bucket.mapTypes).sort(),
      }))
      .sort((a, b) => b.day.localeCompare(a.day));

    return NextResponse.json({
      archive,
      count: archive.length,
      days_window: days,
      timeline,
      hierarchy,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
