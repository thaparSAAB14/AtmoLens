# AtmoLens (Atmospheric Lens)
**Next.js full-stack weather map platform with deterministic overlays and archive history**

AtmoLens ingests Environment and Climate Change Canada (ECCC) synoptic analysis maps, enhances readability, stores history, and serves live + archive views from a single Next.js deployment.

---

## Architecture
- **Frontend:** Next.js 16 + React 19 (`frontend`)
- **API runtime:** Next.js route handlers (`frontend/src/app/api/*`)
- **Storage:** Vercel Blob for imagery + Neon Postgres for metadata
- **Scheduler:** Vercel Cron (`/api/cron/fetch-maps` every 30 minutes)
- **Image processing:** `jimp` adaptive enhancer pipeline

### Blob access modes
- `BLOB_ACCESS=private` -> served through `/api/blob`
- `BLOB_ACCESS=public` -> direct Blob URLs

---

## Core data pipelines
## 1) Analysis map ingestion (production)
- Route: `GET /api/cron/fetch-maps`
- Source: ECCC analysis GIF endpoints
- Steps:
  1. download source image
  2. compute per-map-type hash
  3. skip unchanged latest map
  4. enhance with adaptive processor
  5. upload original + processed to Blob
  6. store metadata in Postgres


---

## API surface
- `/api/status`
- `/api/maps/latest`
- `/api/maps/latest/[mapType]`
- `/api/maps/archive`
- `/api/maps/archive/[mapType]`

- `/api/blob`
- `/api/cron/fetch-maps`
- `/api/cron/cleanup`

---

## Local development
```bash
cd frontend
npm install
npm run dev
```

Optional Vercel-style local routing (from repo root):
```bash
vercel dev
```

Production validation:
```bash
cd frontend
npm run lint
npm run build
```


---

## Legal and attribution
- Data source: Environment and Climate Change Canada (ECCC)
- Required attribution is included in runtime UI.
- Current copy includes:
  - Data Server End-use Licence (ECCC)
  - Open Government Licence - Canada
  - Non-endorsement language

---

## References

- ECCC data licence: https://eccc-msc.github.io/open-data/licence/readme_en/
- ECCC usage policy: https://eccc-msc.github.io/open-data/usage-policy/readme_en/
