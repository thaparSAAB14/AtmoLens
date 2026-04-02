# AtmoLens - Technical Context
> Read this file before architecture-level changes.

## System summary
AtmoLens is a Next.js full-stack weather map system that:
- fetches ECCC analysis maps,
- enhances map readability,
- stores original + processed history,
- serves live and archive APIs.

---

## Runtime architecture
- **Deployment:** Vercel
- **Framework:** Next.js 16 App Router
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Route handlers in `frontend/src/app/api/*`
- **Database:** Neon Postgres (`@neondatabase/serverless`)
- **Object storage:** Vercel Blob (`@vercel/blob`)
- **Image processing:** `jimp` (`frontend/src/lib/processor.ts`)
- **Schedulers:** Vercel Cron
  - `/api/cron/fetch-maps` every 30 minutes
  - `/api/cron/cleanup` daily

---

## Primary ingestion flow
1. Fetch latest ECCC source GIF per map type.
2. Build hash using processing version + map type + source bytes.
3. Skip ingest if newest row hash for that map type is unchanged.
4. Enhance source map through adaptive processor.
5. Upload processed PNG + original GIF to Blob.
6. Store metadata row in Postgres `maps` table.
7. Serve latest and archive via same-domain APIs.

---

## Enhancement pipeline (processor)
File: `frontend/src/lib/processor.ts`

Steps:
1. Convert RGBA to luminance map.
2. Compute bounded Otsu threshold.
3. Build + refine foreground mask.
4. Build ocean mask via seeded flood-fill.
5. Apply map-type palette while preserving dark linework.
6. Export PNG.

Surface maps use stronger contrast; upper-air maps use softer tones.

---

## Data model
File: `frontend/src/lib/storage.ts`

`maps` columns:
- `id SERIAL PRIMARY KEY`
- `map_type TEXT NOT NULL`
- `filename TEXT NOT NULL`
- `blob_url TEXT NOT NULL`
- `original_blob_url TEXT`
- `timestamp TIMESTAMPTZ NOT NULL`
- `hash TEXT NOT NULL`

Indexes:
- `idx_maps_type_ts (map_type, timestamp DESC)`
- `idx_maps_type_hash_ts (map_type, hash, timestamp DESC)`

Behavior:
- hash is scoped by map type + processor version
- archive retention currently 7 days
- dedupe is latest-per-map-type only

---

## Public API surface
- `/api/status`
- `/api/maps/latest`
- `/api/maps/latest/[mapType]`
- `/api/maps/archive`
- `/api/maps/archive/[mapType]`

- `/api/blob`
- `/api/cron/fetch-maps`
- `/api/cron/cleanup`

---

## Security and compliance
1. **Secrets**
   - `POSTGRES_URL` required
   - `BLOB_READ_WRITE_TOKEN` required
2. **Licensing text in UI**
   - ECCC attribution required on weather views
   - include OGL + ECCC End-use licence context
   - include non-endorsement language
3. **Legal exposure (2026-03-31)**
   - status: low to moderate, mitigated
   - references:
     - ECCC Data Servers End-use Licence v2.1
     - ECCC usage policy
   - open risks:
     - legacy product decommission notices by ECCC

---

## Historical decision log
- 2026-03-30: Migrated from Python/OpenCV backend to 100% Next.js runtime.
- 2026-03-30: Stabilized Blob proxy + cron ingestion.
- 2026-03-30: Improved Maps/Archive UX and local-time display.
- 2026-03-31: Completed legal exposure review and attribution hardening.
- 2026-04-02: Removed all Herbie/Geomet overlays to strictly focus on a pure serverless map processing pipeline.
- 2026-04-02: Fixed cron ingestion silence caused by Jimp ESM resolution and Blob access issues.

---

**Last Updated:** 2026-03-31  
**Version:** 3.1.1 (Detailed Documentation Refresh + Herbie Context)
