"use client";

import { useCallback, useEffect, useState } from "react";
import { getStatus, type SystemStatus } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Clock, Database, RefreshCw } from "lucide-react";

export function StatusBar() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatus(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncFailed(false);
    try {
      const res = await fetch("/api/cron/fetch-maps", { cache: "no-store" });
      if (!res.ok) throw new Error("Sync failed");
      window.dispatchEvent(new Event("atmolens:refresh"));
      await load();
    } catch {
      setSyncFailed(true);
    } finally {
      setIsSyncing(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl bg-red-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-label uppercase">
            Live updates unavailable
          </span>
        </div>
        <button
          onClick={() => load()}
          className="ml-auto text-xs font-label bg-red-500/15 text-red-300 hover:bg-red-500/20 px-3 py-1 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-container)]">
        <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" />
        <span className="text-[var(--text-muted)] text-xs font-label uppercase">Connecting...</span>
      </div>
    );
  }

  const canForceSync = process.env.NODE_ENV !== "production";
  const isRunning = status.status === "online" || (status.scheduler && status.scheduler.running);
  const stale = Boolean(status.ingest_health?.stale);
  const latestRunStatus = String((status.ingest_health?.latest_run as { status?: string } | null)?.status ?? "");

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-[var(--surface-container)] backdrop-blur-sm">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning && !stale ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          }`}
        />
        <span className="text-[var(--text-secondary)] text-xs font-label uppercase">
          {isRunning && !stale ? "Autonomous Live" : stale ? "Stale Feed" : "Offline"}
        </span>
      </div>

      {status.scheduler?.last_fetch_time && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
          <Clock size={12} />
          <span>Last: {timeAgo(status.scheduler.last_fetch_time)}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
        <Database size={12} />
        <span>{status.archive_count} maps indexed</span>
      </div>

      {latestRunStatus && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
          <span className="uppercase text-[10px] tracking-widest">Run:</span>
          <span>{latestRunStatus}</span>
        </div>
      )}

      {canForceSync && (
        <div className="ml-auto hidden sm:flex items-center gap-2">
        <button
          onClick={handleSyncClick}
          className="text-xs font-label bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1 rounded-md transition-colors flex items-center gap-1 disabled:opacity-60"
          disabled={isSyncing}
        >
          <RefreshCw size={10} />
          {isSyncing ? "Syncing…" : syncFailed ? "Sync failed" : "Force Sync"}
        </button>
      </div>
      )}
    </div>
  );
}
