"use client";

import { useEffect, useState } from "react";
import { getStatus, type SystemStatus } from "@/lib/api";
import { Database, HardDrive, ShieldAlert, Settings, Trash2, Loader2, RefreshCw } from "lucide-react";

export default function StoragePage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted?: number; error?: string } | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getStatus();
      setStatus(data);
    } catch (e) {
      console.error("Failed to load status", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to run the storage cleanup now? This will permanently delete maps older than the retention policy limit.")) {
      return;
    }
    
    setIsCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch("/api/cron/cleanup");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cleanup failed");
      setCleanupResult({ deleted: data.deleted });
      await load();
    } catch (e: any) {
      setCleanupResult({ error: e.message || "Unknown error" });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <HardDrive className="text-[var(--accent)]" size={36} />
            Storage <span className="gradient-text">Management</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            DVR-style retention management and archive health monitoring.
          </p>
        </div>
        <button
          onClick={load}
          className="p-3 rounded-xl bg-[var(--surface-container)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all duration-300 glow-sm"
          title="Refresh metrics"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {isLoading && !status ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Storage Overview Card */}
          <div className="col-span-1 md:col-span-2 glass rounded-2xl p-6 glow-md border border-[var(--border)] space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="text-emerald-400" size={24} />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Archive Volume</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--surface-container-high)] rounded-xl p-4 border border-[var(--border)]/50">
                <p className="text-[var(--text-muted)] text-xs font-label uppercase tracking-widest mb-1">Total Maps Stored</p>
                <p className="text-3xl font-display font-bold text-[var(--text-primary)]">
                  {status?.archive_count || 0}
                </p>
              </div>
              
              <div className="bg-[var(--surface-container-high)] rounded-xl p-4 border border-[var(--border)]/50">
                <p className="text-[var(--text-muted)] text-xs font-label uppercase tracking-widest mb-1">Total Processed (Lifetime)</p>
                <p className="text-3xl font-display font-bold text-[var(--text-primary)]">
                  {status?.scheduler?.maps_processed_total || 0}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex gap-4 items-start">
              <ShieldAlert className="text-sky-400 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sky-300 text-sm font-semibold mb-1">Retention Policy: Active</h4>
                <p className="text-sky-200/80 text-sm leading-relaxed">
                  The system is currently configured to automatically delete maps older than the defined retention threshold during the daily maintenance window. 
                  This ensures storage costs remain predictable, similar to a rolling CCTV DVR system.
                </p>
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="glass rounded-2xl p-6 glow-md border border-[var(--border)] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-[var(--accent)]" size={24} />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Controls</h2>
            </div>

            <div className="space-y-4 flex-grow">
              <div className="bg-[var(--surface-container-high)] rounded-xl p-4 border border-[var(--border)]/50">
                <p className="text-[var(--text-muted)] text-xs font-label uppercase tracking-widest mb-1">Retention Limit</p>
                <p className="text-xl font-display font-bold text-[var(--text-primary)]">
                  Environment Default
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-2">
                  (Controlled via ARCHIVE_RETENTION_DAYS in Vercel)
                </p>
              </div>

              <button
                onClick={handleCleanup}
                disabled={isCleaning}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isCleaning ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                )}
                {isCleaning ? "Running Cleanup..." : "Force Cleanup Now"}
              </button>

              {cleanupResult && (
                <div className={`p-3 rounded-lg text-sm border ${cleanupResult.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                  {cleanupResult.error ? cleanupResult.error : `Success: ${cleanupResult.deleted} stale maps purged.`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
