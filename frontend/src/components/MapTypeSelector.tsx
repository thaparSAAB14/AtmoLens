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
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-2 px-1">
            {group}
          </p>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => onChange(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "border backdrop-blur-sm",
                  selected === type
                    ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/10"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70 hover:border-white/20"
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
