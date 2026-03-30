"use client";

import { useState, useEffect } from "react";
import { getStatus, type SystemStatus } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Activity, Clock, Database, Zap, RefreshCw } from "lucide-react";

export function StatusBar() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStatus();
        setStatus(data);
        setError(false);
      } catch {
        setError(true);
      }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-xs font-label uppercase">Backend Offline</span>
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

  const isRunning = status.status === "online" || (status.scheduler && status.scheduler.running);

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-[var(--surface-container)] backdrop-blur-sm">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          }`}
        />
        <span className="text-[var(--text-secondary)] text-xs font-label uppercase">
          {isRunning ? "Live Edge" : "Offline"}
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

      <div className="ml-auto hidden sm:flex items-center gap-2">
        <button
          onClick={async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = `<span class="animate-pulse">Syncing...</span>`;
            try {
              await fetch('/api/cron/fetch-maps');
              window.location.reload();
            } catch {
              btn.innerHTML = `Sync Failed`;
            }
          }}
          className="text-xs font-label bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1 rounded-md transition-colors flex items-center gap-1"
        >
          <RefreshCw size={10} /> Force Sync
        </button>
      </div>
    </div>
  );
}
