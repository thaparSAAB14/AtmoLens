"use client";

import { GEOMET_LAYERS, type GeoMetLayer } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

interface GisLayerSelectorProps {
  selected: string[];
  onChange: (layers: string[]) => void;
}

export function GisLayerSelector({ selected, onChange }: GisLayerSelectorProps) {
  const toggleLayer = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((l) => l !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 text-[var(--accent)] mb-2">
        <Layers size={14} />
        <h4 className="text-xs font-label uppercase tracking-widest">
           Weather Data Overlays (WMS)
        </h4>
      </div>
      <div className="flex flex-col gap-2">
        {GEOMET_LAYERS.map((layer: GeoMetLayer) => (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={cn(
              "flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 group",
              selected.includes(layer.id)
                ? "bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/20"
                : "bg-[var(--surface-container)] text-[var(--text-muted)] hover:bg-[var(--surface-container-high)] hover:text-[var(--text-secondary)] border border-transparent"
            )}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span>{layer.name}</span>
              <span className="text-[10px] opacity-60 font-normal">
                {layer.id.toUpperCase()} • GeoMet Vector
              </span>
            </div>
            {selected.includes(layer.id) && (
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            )}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-4 px-1 leading-relaxed italic opacity-60">
        "Contains information licensed under the Open Government Licence – Canada."
      </p>
    </div>
  );
}
