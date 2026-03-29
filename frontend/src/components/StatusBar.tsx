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

  const sched = status.scheduler;
  const isRunning = sched.running;

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
          {isRunning ? "Live" : "Paused"}
        </span>
      </div>

      {/* Last fetch */}
      {sched.last_fetch_time && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
          <Clock size={12} />
          <span>Last: {timeAgo(sched.last_fetch_time)}</span>
        </div>
      )}

      {/* Next run */}
      {sched.next_scheduled_run && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
          <Zap size={12} />
          <span>Next: {timeAgo(sched.next_scheduled_run)}</span>
        </div>
      )}

      {/* Total processed */}
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
        <Activity size={12} />
        <span>{sched.maps_processed_total} processed</span>
      </div>

      {/* Archive count */}
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">
        <Database size={12} />
        <span>{status.archive_count} in archive</span>
      </div>

      {/* Interval */}
      <div className="text-[var(--text-muted)] text-xs font-label ml-auto hidden sm:flex items-center gap-1">
        <RefreshCw size={10} />
        {sched.fetch_interval_minutes}min
      </div>
    </div>
  );
}
