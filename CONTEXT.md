# AtmoLens - Technical Context
> Read before making architecture-level changes.

## Project state
AtmoLens now operates as an autonomous weather server on Vercel:
- periodic ingest with run-level locking,
- persistent pipeline telemetry,
- deterministic deduplication,
- hierarchical archive navigation with metadata,
- historical re-processing of stale maps.

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
1. Validate `CRON_SECRET` bearer token (if configured).
2. Acquire Postgres advisory lock.
3. Create `ingest_runs` row.
4. For each map source:
   - fetch with retries and timeout
   - validate content type + byte size
   - compute source hash
   - dedupe with `(map_type, source_hash, processing_version)`
   - process with timeout guard
   - upload to Blob
   - insert map metadata row
   - insert item log row (`ingest_items`)
5. Re-process up to 10 stale maps (older processing versions) per run.
6. Finalize run summary (`ok/partial/failed`).
7. Release advisory lock.

Self-healing behavior:
- partial failures are isolated per map type
- transient upstream failures are retried
- stale-feed detection is exposed in `/api/status`

---

## Image processing pipeline
File: `frontend/src/lib/processor.ts`

Processing flow:
1. Grayscale conversion and Otsu threshold computation.
2. Binary foreground mask with 8-neighbor refinement.
3. Foreground density classification (dense clusters / medium lines / thin lines).
4. Pressure system (H/L) detection via connected component labeling.
5. Overlay selection (cached at module level):
   - `surface_*` → `overlay.png`
   - `upper_250hpa/500hpa/700hpa/850hpa` → `upper_overlay_scaled.png`
6. If no overlay: seeded flood fill for ocean detection.
7. Multi-tone compositing:
   - Pressure H markers → red (#C0392B)
   - Pressure L markers → blue (#2980B9)
   - Dense ink (labels) → slightly lighter (#282C34)
   - Medium lines (isobars) → crisp dark (#171B23)
   - Thin lines → softer (#323741)

Overlay assets (in `frontend/src/assets/`):
- `northamerica_covergae.png` — North America surface overlay (6488×5161, primary for surface maps)
- `overlay.png` — Legacy surface overlay (6141×4357, fallback)
- `upper_overlay_scaled.png` — Upper-air map background (2428×1788)
- `upper_overlay.png` — Full-res upper overlay (4179×3647, fallback)

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

## Public API surface
- `/api/status`
- `/api/maps/latest`
- `/api/maps/archive`
- `/api/maps/archive/[mapType]`
- `/api/blob` (private blob proxy)
- `/api/cron/fetch-maps` (authenticated)

---

## Security
- `CRON_SECRET` env var protects the ingest endpoint.
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP.
- Blob access defaults to private; proxy route exposes images on-demand.

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
- 2026-03-31: Added in-house RDPA renderer and WMS fallback hardening (later removed).
- 2026-03-31: Added Herbie optional sidecar overlay support (later removed).
- 2026-04-04: Refactored cron ingest into lock-protected autonomous pipeline with run/item telemetry and improved dedupe.
- 2026-04-04: Redesigned archive API + UI to hierarchical navigation with timeline and metadata visibility.
- 2026-04-04: Added Hobby-plan compatible scheduling: Vercel cron reduced to daily and 30-minute cadence moved to GitHub Actions.
- 2026-04-08: Simplified archive UI: removed hierarchy tree panel, merged Group+Type into unified dropdown filter bar with day quick-jump chips.
- 2026-04-08: Removed Model Guidance (Herbie GDPS) from frontend map type labels and groups.
- 2026-04-08: Redesigned StatusBar with multi-stage indicators, gradient progress bar, pill badges, and Force Sync enabled in production.
- 2026-04-12: Replaced TIFF overlay with unified PNG (`250-500-700overlay.png`) for upper-air maps.
- 2026-04-12: Added historical re-processing loop to migrate stale maps to enhancer-v6.
- 2026-05-08: Full system audit — security hardening (CRON_SECRET + CSP + X-Frame-Options), dead code purge (14 files + 4 code blocks), performance optimization (overlay caching + alpha fix), dependency cleanup (5 unused packages removed), documentation sync.
- 2026-05-08: Phase 5 — front detection & styling: multi-tone foreground classification, pressure system (H/L) detection and coloring, 850hpa overlay integration, processing version bumped to enhancer-v7.
- 2026-05-08: Phase 4 — North America overlay integration: surface maps now use `northamerica_covergae.png` (6488×5161) as primary overlay, processing version bumped to enhancer-v8.
- 2026-05-12: Added 850hPa-specific overlay (`850_overlay.png`) and map loading animation.
- 2026-05-16: **Production stabilization** — fixed Vercel Blob storage quota exceeded (1GB Hobby limit). Added `pruneMapsByCount()` and `cleanupOldMaps(30)` with auto-cleanup at every ingestion run. Resolved orphaned blob references causing 500 errors during re-processing. Added time-budgeted execution to prevent Vercel timeout crashes.
- 2026-05-16: **Open-source hardening** — consolidated dual `vercel.json` files, created `.env.example`, fixed archive default to 30 days, added auth to cleanup route, removed stale dev scripts, updated all "7-day" references to "30-day".

---

**Last Updated:** 2026-05-16  
**Version:** 4.3.0 (Production Stabilization + Open-Source Hardening)
