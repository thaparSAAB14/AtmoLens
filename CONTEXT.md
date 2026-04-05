# AtmoLens - Technical Context
> Read before making architecture-level changes.

## Project state
AtmoLens now operates as an autonomous weather server on Vercel:
- periodic ingest with run-level locking,
- persistent pipeline telemetry,
- deterministic deduplication,
- hierarchical archive navigation with metadata.

---

## Runtime architecture
- **Frontend:** Next.js 16 + React 19 (`frontend/src/app/*`)
- **Backend:** Next.js route handlers (`frontend/src/app/api/*`)
- **DB:** Neon Postgres (`@neondatabase/serverless`)
- **Blob:** Vercel Blob (`@vercel/blob`)
- **Processor:** `jimp` adaptive enhancement (`frontend/src/lib/processor.ts`)
- **Scheduler:** GitHub Actions (`.github/workflows/fetch-maps.yml`) every 30 minutes + Vercel daily fallback cron (`/api/cron/fetch-maps`)

---

## Autonomous pipeline design
Route: `frontend/src/app/api/cron/fetch-maps/route.ts`

Execution model:
1. Acquire Postgres advisory lock.
2. Create `ingest_runs` row.
3. For each map source:
   - fetch with retries and timeout
   - validate content type + byte size
   - compute source hash
   - dedupe with `(map_type, source_hash, processing_version)`
   - process with timeout guard
   - upload to Blob
   - insert map metadata row
   - insert item log row (`ingest_items`)
4. Finalize run summary (`ok/partial/failed`).
5. Release advisory lock.

Self-healing behavior:
- partial failures are isolated per map type
- transient upstream failures are retried
- stale-feed detection is exposed in `/api/status`

---

## Data model
Primary table: `maps`

Core columns:
- `map_type`, `filename`, `blob_url`, `original_blob_url`
- `timestamp`, `hash`
- `source_hash`, `processing_version`
- `source_timestamp`, `ingested_at`
- `source_size_bytes`, `processed_size_bytes`
- `source_url`

Pipeline telemetry tables:
- `ingest_runs` (aggregate run health)
- `ingest_items` (per-map result records)

Supporting table:
- `observer_notes`

---

## Archive API + UI model
Endpoint: `GET /api/maps/archive?days=<n>`

Response includes:
- flat list (`archive`)
- day timeline (`timeline`)
- hierarchical tree (`hierarchy`): Group -> Type -> Year -> Month -> Day
- retention window reflection (`days_window`)

UI (`frontend/src/components/ArchiveGallery.tsx`) supports:
- group/type/day filtering
- timeline quick-jumps
- metadata-rich cards (source time, ingest time, sizes, processor version)

---

## Overlay system
- RDPA generated overlay: `frontend/src/app/api/geomet/rdpa/route.ts`
- GeoMet WMS fallback: `frontend/src/app/api/geomet/wms/route.ts`
- Optional Herbie sidecar overlay routes:
  - `frontend/src/app/api/herbie/gdps-t2m/route.ts`
  - `frontend/src/app/api/herbie/status/route.ts`

Herbie remains optional and artifact-based; it is not a long-running backend service in Vercel.

---

## Public API surface
- `/api/status`
- `/api/maps/latest`
- `/api/maps/latest/[mapType]`
- `/api/maps/archive`
- `/api/maps/archive/[mapType]`
- `/api/geomet/rdpa`
- `/api/geomet/wms`
- `/api/herbie/gdps-t2m`
- `/api/herbie/status`
- `/api/blob`
- `/api/cron/fetch-maps`
- `/api/cron/cleanup`

---

## Compliance and exposure
- Required ECCC attribution is present in runtime UI.
- Non-endorsement language is included.
- Legal references:
  - ECCC Data Servers End-use Licence
  - Open Government Licence - Canada
- Current exposure: low-to-moderate, mitigated by explicit attribution and telemetry visibility.

---

## Historical decision log
- 2026-03-30: Migrated to 100% Next.js runtime architecture.
- 2026-03-31: Added in-house RDPA renderer and WMS fallback hardening.
- 2026-03-31: Added Herbie optional sidecar overlay support.
- 2026-04-04: Refactored cron ingest into lock-protected autonomous pipeline with run/item telemetry and improved dedupe.
- 2026-04-04: Redesigned archive API + UI to hierarchical navigation with timeline and metadata visibility.
- 2026-04-04: Identified production stale-ingest root cause as missing active cron schedule (project root mismatch); fixed by adding `frontend/vercel.json` cron config.
- 2026-04-04: Fixed health semantics so `/api/status.last_fetch_time` tracks latest ingest run activity even when all items are deduped/skipped; added `last_new_map_time` for actual data freshness.
- 2026-04-04: Added Hobby-plan compatible scheduling: Vercel cron reduced to daily and 30-minute cadence moved to GitHub Actions.

---

**Last Updated:** 2026-04-04  
**Version:** 3.2.3 (Hobby Cron + GitHub Scheduler)
