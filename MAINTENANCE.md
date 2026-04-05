# AtmoLens Maintenance Manual
## "Server-less Server" Operations Guide

This document explains how AtmoLens runs autonomously on Vercel and how to diagnose failures without manual babysitting.

---

## 1) Runtime topology
- **Ingestion trigger (primary):** GitHub Actions (`.github/workflows/fetch-maps.yml`) calls `GET /api/cron/fetch-maps` every 30 minutes.
- **Ingestion trigger (fallback):** Vercel Cron calls `GET /api/cron/fetch-maps` once daily (Hobby-safe).
- **Processing runtime:** Next.js Route Handlers (Node runtime on Vercel).
- **Primary storage:** Vercel Blob (imagery) + Neon Postgres (metadata and run logs).
- **Health endpoint:** `GET /api/status`.
- **Cron config file:** `frontend/vercel.json` (project root is `frontend` in Vercel).

---

## 2) Ingestion lifecycle
Each run follows strict stages:
1. **Acquire lock** (`pg_try_advisory_lock`) to prevent overlapping runs.
2. **Open run record** in `ingest_runs` with `status=running`.
3. For each source map:
   - Fetch with retries and timeout.
   - Validate response and minimum byte size.
   - Compute source hash.
   - Deduplicate against latest `(map_type, source_hash, processing_version)`.
   - Process image with timeout protection.
   - Upload blobs.
   - Insert `maps` metadata row.
   - Log item-level result in `ingest_items`.
4. **Finalize run** with `ok/partial/failed` summary.
5. **Release lock**.

---

## 3) Reliability controls
- **Network resilience:** retry on `404/408/429/5xx`.
- **Timeout boundaries:** fetch and processing timeouts prevent hung executions.
- **Atomic map handling:** one map failure does not cancel whole run.
- **Deduplication 2.0:** source hash + processing version prevents bloat and preserves unique charts.
- **Health telemetry:** run summaries and per-map item logs are persisted.

---

## 4) Archive organization model
- API: `GET /api/maps/archive?days=<n>`
- UI hierarchy: **Group -> Type -> Year -> Month -> Day**
- Timeline chips allow direct day jumps.
- Card metadata includes:
  - map/source time
  - ingest time
  - source/processed file size
  - processing version

---

## 5) Key database objects
### `maps`
- chart metadata + source/process size + processing version + source hash

### `ingest_runs`
- one row per cron/manual run with aggregate run health

### `ingest_items`
- one row per map attempt for run-level debugging

---

## 6) Runbook: normal checks
1. `GET /api/status`
   - confirm `status=online`
   - inspect `ingest_health.latest_run`
   - compare `scheduler.last_fetch_time` (last run) vs `scheduler.last_new_map_time` (last new insert)
2. `GET /api/maps/latest`
   - verify map timestamps move forward
3. Open `/archive`
   - verify new day buckets and metadata populate

---

## 7) Incident triage
## A) `status=degraded` or stale feed
- Check `ingest_health.minutes_since_last_fetch` (scheduler activity age).
- Check `ingest_health.minutes_since_last_new_map` (data freshness age).
- Check latest run status and failed item errors.
- Trigger a manual run:
  - `GET /api/cron/fetch-maps?trigger=manual`

## B) Repeated upstream fetch failures
- Validate ECCC endpoint availability.
- Inspect `ingest_items.error_message` for status pattern (`404`, timeout, etc.).

## C) Blob or DB write failures
- Confirm Vercel env vars:
  - `POSTGRES_URL`
  - `BLOB_READ_WRITE_TOKEN`
- Validate Neon/Blob service status.

---

## 8) Configuration checklist
- `POSTGRES_URL` set in Vercel.
- `BLOB_READ_WRITE_TOKEN` set in Vercel.
- `BLOB_ACCESS` set (`private` recommended).
- `ENABLE_GEOMET_WMS` / `NEXT_PUBLIC_ENABLE_WMS` set as intended.

---

## 9) Capacity notes
- Keep image processing lean; avoid loading many large images in parallel inside one request.
- Item-level sequential processing is intentional for memory stability.
- If archive grows beyond UX/perf targets, adjust `days` window defaults and retention policy.

---

## 10) Deployment verification
Run after every major release:
```bash
cd frontend
npm run lint
npm run build
```
Then verify:
- `/api/status`
- `/api/maps/latest`
- `/api/maps/archive?days=30`
- `/archive`
