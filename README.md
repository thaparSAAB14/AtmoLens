# ⚓ AtmoLens (Atmospheric Lens)
**100% Vercel-Native | Bit-Depth Aesthetics | GeoMet WMS Overlays**

AtmoLens is a meteorological restoration and enhancement platform that ingests Environment and Climate Change Canada (ECCC) synoptic charts, preserves originals, and publishes color-enhanced analysis maps with optional geo-referenced Weather Canada overlays.

## 🏗️ Architecture: Vercel Serverless Monorepo
AtmoLens has been fully migrated to a **"One Domain, One Port"** serverless architecture on Vercel.

- **Frontend**: Next.js 16 (React 19) located in `/frontend`.
- **Backend**: Next.js Route Handlers under `/frontend/src/app/api` (same domain).
- **Storage**: **Vercel Blob** (Images) + Postgres metadata (Neon Serverless via `@neondatabase/serverless`).
- **Automation**: Automated ECCC synoptic pulls every 30 minutes via **Vercel Cron Jobs**.
- **Deduplication**: Per-map SHA-256; unchanged maps are skipped to keep cron fast.
- **Formats**: Enhanced maps stored as PNG; originals stored as GIF.
- **Blob access**: `BLOB_ACCESS=private` serves images through `/api/blob`; set `BLOB_ACCESS=public` to use direct blob URLs.

## 🎨 Design System: "Bit Depth"
The interface utilizes the bespoke **Bit Depth** design system, switching seamlessly between:
- **🗂️ Scrapbook (Light)**: Focused on historical, tactile analysis with #fdfbf0 background and tape-like accents.
- **🌑 Obsidian (Dark)**: A high-contrast, modern synoptic mode using #121213 with glowing data overlays.

## 🗺️ GeoMet WMS Integration (Current)
AtmoLens maps now support **MSC GeoMet WMS overlays** directly in the Maps experience.

- **Interactive overlays in Maps UI**: Layer toggles in the sidebar are wired to the map viewer.
- **Current layers**:
  - `GDPS.ETA_PRMSL` (Sea-level pressure)
  - `GDPS.ETA_TT` (2m temperature)
  - `RDPA.24F_PR` (24h precipitation)
- **Backend WMS proxy**: `/api/geomet/wms` validates and forwards `GetMap` requests to `https://geo.weather.gc.ca/geomet`.
- **Production enablement flags**:
  - `NEXT_PUBLIC_ENABLE_WMS=true` (enables WMS controls in Maps UI)
  - `ENABLE_GEOMET_WMS=true` (enables backend WMS proxy route)
- **Geo-reference behavior**: Overlays are requested with EPSG:4326 + North America extent for alignment against surface analysis views.
- **Time-aware overlays**: When available, the current map timestamp is passed to WMS requests.
- **Legal compliance**: ECCC attribution is rendered in-map:
  - *"Contains information licensed under the Open Government Licence – Canada."*

> Note: archive and storage pipelines remain unchanged; overlays are visual and do not alter stored source/archive files.

## 🚀 Getting Started (Local Development)
To run the full-stack Next.js app locally:
1.  Install deps: `cd frontend && npm install`
2.  Start dev server: `npm run dev`
3.  If you rely on Vercel resources/env vars: `vercel env pull`

**Optional (Vercel-style local routing):**
- From the repository root: `vercel dev`

## 📜 Legal & Attribution
"Contains information licensed under the Open Government Licence – Canada."
Processed meteorological data provided by **Environment and Climate Change Canada (ECCC)**.

---
*Developed by Antigravity.*
