# AtmoLens - Technical Context
> LLM Sync Protocol: read this file before changing architecture.

## Project Overview
AtmoLens is a Next.js full-stack system that fetches ECCC analysis maps, preserves originals, enhances readability, stores map history, and serves live/archived map experiences.

## Architecture
- Deployment: Vercel + Next.js App Router
- Frontend: React 19, TypeScript, Tailwind CSS 4
- API: Next.js route handlers under `frontend/src/app/api/*`
- Processing: `jimp` in `frontend/src/lib/processor.ts`
- Database: Neon Serverless Postgres (`@neondatabase/serverless`)
- Storage: Vercel Blob (`@vercel/blob`)
- Automation: Vercel Cron (`/api/cron/fetch-maps` every 30 min, `/api/cron/cleanup` daily)

## Data Flow
1. Fetch latest map GIF from ECCC static endpoints.
2. Compute hash (includes map type + enhancer version).
3. Skip only when latest stored hash for that map type is unchanged.
4. Process with adaptive enhancement pipeline.
5. Upload processed PNG + original GIF to Blob.
6. Insert metadata row in Postgres.
7. Serve latest and archive via same-domain API.

## Current Map Enhancement Pipeline
File: `frontend/src/lib/processor.ts`

Steps:
1. Convert RGBA image to luminance map.
2. Compute adaptive threshold (Otsu, bounded) for foreground extraction.
3. Refine foreground mask to preserve weather lines and remove speckles.
4. Build ocean mask using seeded flood-fill on non-foreground regions.
5. Recolor with map-type palettes while preserving dark foreground ink.
6. Export PNG.

Notes:
- Surface maps use stronger land/water contrast.
- Upper-air maps use softer tones for readability.

## Overlay System (Geo-referenced)
- Proxy route: `frontend/src/app/api/geomet/wms/route.ts`
- Generated overlay route: `frontend/src/app/api/geomet/rdpa/route.ts`
- Herbie overlay route: `frontend/src/app/api/herbie/gdps-t2m/route.ts`
- Herbie status route: `frontend/src/app/api/herbie/status/route.ts`
- Source endpoint: `https://geo.weather.gc.ca/geomet`
- Source coverage API: `https://api.weather.gc.ca/collections/*/coverage`
- Current overlay strategy: RDPA-first WMS layers (EPSG:4326)
  - `RDPA.6F_PR`
  - `RDPA.6P_PR`
  - `RDPA.24F_PR`
  - `RDPA.24P_PR`
- Optional model guidance layer: Herbie-generated GDPS 2m temperature (`TMP/TGL_2`).
- Herbie deterministic config (no implicit defaults):
  - model=`gdps`
  - product=`15km/grib2/lat_lon`
  - variable=`TMP`
  - level=`TGL_2`
  - fxx=`0`
- RDPA overlays are now generated server-side from raw coverage grids and colorized in-house.
- Frontend automatically falls back to GeoMet WMS if a generated overlay fails.
- Proxy safeguards:
  - whitelist layer names
  - whitelist CRS and output format
  - reject non-image upstream responses (including XML service exceptions)

## Storage Model
File: `frontend/src/lib/storage.ts`

`maps` table fields:
- `id SERIAL PRIMARY KEY`
- `map_type TEXT NOT NULL`
- `filename TEXT NOT NULL`
- `blob_url TEXT NOT NULL`
- `original_blob_url TEXT`
- `timestamp TIMESTAMPTZ NOT NULL`
- `hash TEXT NOT NULL`

Indexes:
- `idx_maps_type_ts` on `(map_type, timestamp DESC)`
- `idx_maps_type_hash_ts` on `(map_type, hash, timestamp DESC)`

Important behavior:
- `hash` is no longer globally unique.
- Archive preserves history; dedupe is "latest-per-map-type" only.

## API Surface
- `/api/status`
- `/api/maps/latest`
- `/api/maps/latest/[mapType]`
- `/api/maps/archive`
- `/api/maps/archive/[mapType]`
- `/api/geomet/wms`
- `/api/blob`
- `/api/cron/fetch-maps`
- `/api/cron/cleanup`

## Security and Compliance
1. Secrets
- `POSTGRES_URL` and `BLOB_READ_WRITE_TOKEN` required server-side.

2. Licensing and attribution
- Footer includes the required OGL notice and source attribution.
- Overlay panel includes OGL attribution text.

3. Legal exposure check (2026-03-31)
- Status: low to moderate, mitigated.
- Reference: ECCC Data Servers End-use Licence v2.1 (September 2022).
- Verified:
  - OGL Canada attribution present in runtime UI.
  - ECCC Data Servers End-use Licence link and attribution added in runtime UI.
  - ECCC source identified.
  - Non-endorsement language included in footer.
- Key obligations reflected in product copy:
  - attribution required for reuse/derivatives
  - non-endorsement language
  - no use of Government names/crests/logos as branding
- Mitigations added:
  - Removed runtime Google Fonts request from 404 component.
  - Normalized OGL text to clean ASCII to avoid encoding corruption.
- Open items to monitor:
  - Decommission notice for legacy analysis products by end of 2026.
  - Optional: replace external Unsplash image with first-party asset to reduce third-party dependency.
  - Herbie pipeline outputs are optional artifacts (not generated inside Vercel runtime).
  - Python runtime + eccodes availability is required wherever Herbie pipeline is executed.

## Historical Decision Log
- 2026-03-30: Pivoted from Python/OpenCV backend to 100% Next.js full-stack.
- 2026-03-30: Added Blob proxy and fixed cron processing stability.
- 2026-03-30: Improved Maps/Archive UX and local-time display.
- 2026-03-31: Introduced RDPA-first georeferenced overlays and hardened WMS proxy error handling.
- 2026-03-31: Upgraded enhancer to adaptive multi-step pipeline and versioned processing hash.
- 2026-03-31: Completed legal exposure audit and tightened attribution/compliance text.
- 2026-03-31: Added own RDPA coverage renderer (`/api/geomet/rdpa`) to generate precipitation overlays from Weather Canada raw grid data.
- 2026-03-31: Added generated-overlay to WMS fallback behavior and synchronized map viewport bbox rendering.
- 2026-03-31: Integrated Herbie deterministic GDPS pipeline (`pipelines/herbie`) and exposed overlay/status routes in the web app.

---
**Last Updated:** 2026-03-31
**Version:** 3.1.0 (Herbie GDPS Pipeline Integration)
