"use client";

import { MAP_TYPE_LABELS, MAP_TYPE_GROUPS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MapTypeSelectorProps {
  selected: string;
  onChange: (type: string) => void;
}

export function MapTypeSelector({ selected, onChange }: MapTypeSelectorProps) {
  return (
    <div className="space-y-4">
      {Object.entries(MAP_TYPE_GROUPS).map(([group, types]) => (
        <div key={group}>
          <p className="text-[var(--text-muted)] text-xs font-label uppercase tracking-widest mb-2 px-1">
            {group}
          </p>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => onChange(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-xs",
                  selected === type
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "bg-[var(--surface-container)] text-[var(--text-secondary)] hover:bg-[var(--surface-container-high)] hover:text-[var(--text-primary)]"
                )}
              >
                {MAP_TYPE_LABELS[type]?.replace("Surface Analysis — ", "").replace("Upper Air — ", "") || type}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
