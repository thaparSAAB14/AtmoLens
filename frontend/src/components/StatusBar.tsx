"use client";

import { useCallback, useEffect, useState } from "react";
import { getStatus, type SystemStatus } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Activity, Clock, Database, RefreshCw, Wifi, WifiOff } from "lucide-react";

type StatusPhase = "connecting" | "live" | "stale" | "syncing" | "error";

export function StatusBar() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<"idle" | "ok" | "failed">("idle");
  const [progressWidth, setProgressWidth] = useState(0);

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

  // Progress animation during sync
  useEffect(() => {
    if (!isSyncing) {
      setProgressWidth(0);
      return;
    }
    setProgressWidth(15);
    const t1 = setTimeout(() => setProgressWidth(45), 300);
    const t2 = setTimeout(() => setProgressWidth(70), 1500);
    const t3 = setTimeout(() => setProgressWidth(85), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isSyncing]);

  // Clear sync result after a few seconds
  useEffect(() => {
    if (syncResult === "idle") return;
    const t = setTimeout(() => setSyncResult("idle"), 4000);
    return () => clearTimeout(t);
  }, [syncResult]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncResult("idle");
    try {
      const res = await fetch("/api/cron/fetch-maps", { cache: "no-store" });
      if (!res.ok) throw new Error("Sync failed");
      setProgressWidth(100);
      setSyncResult("ok");
      window.dispatchEvent(new Event("atmolens:refresh"));
      await load();
    } catch {
      setSyncResult("failed");
    } finally {
      setIsSyncing(false);
    }
  };

  /* ── Derive current phase ──────────────────────────────────────────── */
  const phase: StatusPhase = (() => {
    if (error) return "error";
    if (!status) return "connecting";
    if (isSyncing) return "syncing";
    const stale = Boolean(status.ingest_health?.stale);
    if (stale) return "stale";
    return "live";
  })();

  const phaseConfig: Record<
    StatusPhase,
    { dotClass: string; label: string; icon: typeof Wifi; ringClass: string }
  > = {
    connecting: {
      dotClass: "bg-[var(--text-muted)] animate-pulse",
      label: "Connecting",
      icon: Wifi,
      ringClass: "",
    },
    live: {
      dotClass: "bg-emerald-400",
      label: "Autonomous Live",
      icon: Wifi,
      ringClass: "ring-emerald-400/30",
    },
    stale: {
      dotClass: "bg-amber-400 animate-pulse",
      label: "Stale Feed",
      icon: WifiOff,
      ringClass: "ring-amber-400/30",
    },
    syncing: {
      dotClass: "bg-sky-400 animate-pulse",
      label: "Syncing",
      icon: Activity,
      ringClass: "ring-sky-400/30",
    },
    error: {
      dotClass: "bg-red-500 animate-pulse",
      label: "Offline",
      icon: WifiOff,
      ringClass: "ring-red-500/30",
    },
  };

  const { dotClass, label, icon: PhaseIcon, ringClass } = phaseConfig[phase];
  const latestRunStatus = String(
    (status?.ingest_health?.latest_run as { status?: string } | null)?.status ?? ""
  );

  /* ── Error state ───────────────────────────────────────────────────── */
  if (phase === "error" && !status) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-red-500/8 border border-red-500/15">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${dotClass} ring-4 ${ringClass}`} />
            <span className="text-red-400 text-xs font-label uppercase tracking-wider">
              {label}
            </span>
          </div>
          <span className="text-red-400/70 text-xs">Live updates unavailable</span>
          <button
            onClick={() => load()}
            className="ml-auto text-xs font-label bg-red-500/12 text-red-300 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-all duration-200 hover:scale-[1.02]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-[var(--surface-container)] border border-[var(--border)]/60 backdrop-blur-sm transition-all duration-500">
      {/* ── Gradient progress bar ──────────────────────────────────────── */}
      {(isSyncing || syncResult === "ok") && (
        <div className="absolute top-0 left-0 right-0 h-[2px]">
          <div
            className={`h-full rounded-full transition-all ${
              syncResult === "ok"
                ? "bg-emerald-400 duration-300"
                : "bg-gradient-to-r from-[var(--accent)] via-sky-400 to-[var(--tertiary)] duration-1000"
            }`}
            style={{ width: `${syncResult === "ok" ? 100 : progressWidth}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-2.5">
        {/* ── Status dot + label ────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${dotClass} ring-4 ${ringClass}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <PhaseIcon size={12} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)] text-xs font-label uppercase tracking-wider">
              {label}
            </span>
          </div>
        </div>

        {/* ── Stats pills ──────────────────────────────────────────────── */}
        {status && (
          <>
            {status.scheduler?.last_fetch_time && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-container-high)]/60 text-[var(--text-muted)] text-[11px]">
                <Clock size={11} />
                <span>{timeAgo(status.scheduler.last_fetch_time)}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-container-high)]/60 text-[var(--text-muted)] text-[11px]">
              <Database size={11} />
              <span>{status.archive_count} maps</span>
            </div>

            {latestRunStatus && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] ${
                  latestRunStatus === "ok"
                    ? "bg-emerald-500/8 text-emerald-400"
                    : latestRunStatus === "partial"
                    ? "bg-amber-500/8 text-amber-400"
                    : "bg-[var(--surface-container-high)]/60 text-[var(--text-muted)]"
                }`}
              >
                <Activity size={11} />
                <span className="uppercase tracking-wider">{latestRunStatus}</span>
              </div>
            )}
          </>
        )}

        {/* ── Sync button (enabled in production) ──────────────────────── */}
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {syncResult === "ok" && (
            <span className="text-emerald-400 text-[11px] font-label animate-fade-in-up">
              ✓ Synced
            </span>
          )}
          {syncResult === "failed" && (
            <span className="text-red-400 text-[11px] font-label animate-fade-in-up">
              Sync failed
            </span>
          )}
          <button
            onClick={handleSyncClick}
            className="text-xs font-label bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)]/15 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 hover:scale-[1.02]"
            disabled={isSyncing}
          >
            <RefreshCw
              size={11}
              className={isSyncing ? "animate-spin" : ""}
            />
            {isSyncing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>
    </div>
  );
}
