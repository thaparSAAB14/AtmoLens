# AtmoLens
**Autonomous weather-map server on Vercel (Next.js 16 + Neon + Blob)**

AtmoLens ingests Environment and Climate Change Canada (ECCC) weather charts, processes them into high-contrast analysis maps, stores historical records, and serves a structured archive with metadata-rich navigation.

---

## 1) Runtime architecture
- **Framework:** Next.js 16 (App Router), React 19
- **API runtime:** `frontend/src/app/api/*`
- **Database:** Neon Postgres (`@neondatabase/serverless`)
- **Object storage:** Vercel Blob (`@vercel/blob`)
- **Image processing:** `jimp` (adaptive Otsu-threshold enhancement)
- **Scheduler (Hobby-safe):**
  - primary: GitHub Actions (`.github/workflows/fetch-maps.yml`) every 30 min, with auto-recovery fallback
  - fallback: Vercel Cron (`/api/cron/fetch-maps`) daily via `frontend/vercel.json`

---

## 2) Autonomous ingestion pipeline
Route: `GET /api/cron/fetch-maps`

Pipeline stages:
1. Acquire Postgres advisory lock (prevents overlapping runs).
2. Create run log in `ingest_runs`.
3. Per map source (Surface 00/06/12/18Z + Upper Air 250/500/700/850 hPa):
   - fetch with timeout + retries
   - validate response type and minimum size
   - compute source hash
   - dedupe via `(map_type, source_hash, processing_version)`
   - process image with timeout guard
   - upload original + processed files
   - write metadata row to `maps`
   - write item-level log to `ingest_items`
4. Finalize run status (`ok`, `partial`, `failed`).
5. Release lock.

Reliability behavior:
- one map failure does not abort the whole run
- run health is persisted and exposed in `/api/status`
- stale feed detection is computed server-side
- `/api/status` distinguishes scheduler activity (`last_fetch_time`) from data freshness (`last_new_map_time`)
- GitHub Actions workflow includes auto-recovery step if primary fetch fails

---

## 3) Archive UI
Primary endpoint: `GET /api/maps/archive?days=<n>`

**Simplified filter bar:**
- Day window selector (7 / 30 / 90 days)
- Grouped type dropdown (Surface, Upper Air)
- Day quick-jump chips
- One-click refresh

Response includes:
- flat entries for grid rendering
- `timeline` for day-level jumps
- `hierarchy` for Type → Year → Month → Day navigation
- `days_window` to reflect retention query

Map metadata returned per entry:
- map/source time, ingest time
- source size + processed size
- processing version, source URL

---

## 4) Status dashboard
The Maps page includes a real-time status bar with:
- Multi-stage status indicator (Connecting → Live → Stale → Error)
- Gradient progress bar during sync operations
- Pill badges showing archive count, last update, and run health
- Manual sync button (available in production)

---

## 5) Database model highlights
### `maps`
Stores chart artifact metadata and processing metadata, including:
- `source_hash`, `processing_version`
- `source_timestamp`, `ingested_at`
- `source_size_bytes`, `processed_size_bytes`
- `source_url`

### `ingest_runs`
One row per ingest execution with rollup health metrics.

### `ingest_items`
Per-map attempt log for debugging and reliability analysis.

---

## 6) Local development
```bash
cd frontend
npm install
npm run dev
```

Validation:
```bash
cd frontend
npm run lint
npm run build
```

Optional local Vercel routing (repo root):
```bash
vercel dev
```

---

## 7) Configuration
Required:
- `POSTGRES_URL`
- `BLOB_READ_WRITE_TOKEN`

Optional:
- `BLOB_ACCESS=private|public`
- `ENABLE_GEOMET_WMS=true|false`
- `NEXT_PUBLIC_ENABLE_WMS=true|false`

---

## 8) Operations and maintenance
See full runbook: **`MAINTENANCE.md`**

It covers:
- health checks
- stale-feed triage
- manual run flow
- incident diagnosis
- deployment verification

---

## 9) Legal and attribution
- Source: Environment and Climate Change Canada (ECCC)
- Runtime UI includes:
  - Data Server End-use Licence reference
  - Open Government Licence - Canada reference
  - non-endorsement language

---

## 10) References
- ECCC licence: https://eccc-msc.github.io/open-data/licence/readme_en/
- ECCC usage policy: https://eccc-msc.github.io/open-data/usage-policy/readme_en/
- Herbie repository: https://github.com/blaylockbk/Herbie
- Herbie GDPS docs: https://herbie.readthedocs.io/en/2025.12.0/gallery/eccc_models/gdps.html

---

## 11) Contributors & Acknowledgments
This project was developed with the assistance of:

| Contributor | Role |
|---|---|
| **Claude** (Anthropic) | AI pair-programming, architecture design, and autonomous pipeline development |
| **Antigravity** (Google DeepMind) | UI engineering, StatusBar redesign, archive simplification, and Git hardening |
| **Copilot** (GitHub) | Dependency security analysis and code review |
| **Vercel** | Hosting platform, Blob storage, serverless runtime, and cron infrastructure |
