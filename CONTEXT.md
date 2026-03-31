# AtmoLens - Technical Context
> **LLM Sync Protocol**: Any AI assistant starting a session MUST read this file in full to understand the 100% Next.js Full-Stack pivot. Do not attempt to re-introduce Python or OpenCV.

## Project Overview

AtmoLens is an automated weather map enhancement system that transforms grayscale ECCC synoptic charts into color-enhanced, readable maps with zero manual intervention.

## Architecture

### Deployment: 100% Vercel Native

AtmoLens has been refactored into a **100% Next.js Full-Stack Architecture**. This eliminates the overhead and instability of Python serverless runtimes by leveraging native TypeScript and Node.js Edge-ready modules.

```
┌─────────────────────────────────────────┐
│  VERCEL (Unified Full-Stack)           │
├─────────────────────────────────────────┤
│                                         │
│  Frontend & API (Next.js 16)           │
│  - React 19, TypeScript, Tailwind 4    │
│  - Native API Routes (@/app/api/*)     │
│  - Server Actions (@/app/actions/*)    │
│                                         │
│  Image Processing (Node.js Edge)       │
│  - Jimp (@/lib/processor.ts)           │
│  - Pixel-perfect "Bit Depth" coloring  │
│                                         │
│  Database & Storage                    │
│  - Neon Serverless (Postgres via HTTP) │
│  - Vercel Blob (Map Image CDN)         │
│                                         │
│  Automation (Vercel Crons)             │
│  - /api/cron/fetch-maps (30 min)       │
│  - /api/cron/cleanup (daily)           │
│                                         │
└─────────────────────────────────────────┘
```

### Data Flow

```
ECCC Weather API (GIF)
    ↓
fetch() in Next.js API Route
    ↓
SHA-256 Hash Check (Neon Postgres)
    ↓
Jimp Pixel Processing (TS)
    ↓
Vercel Blob Storage
    ↓
Neon Postgres Metadata Update
    ↓
Next.js Frontend (Revalidate /maps)
    ↓
User Browser (Global CDN)
```

## Backend Logic (Next.js API Routes)

### 1. Fetching & Processing (`/api/cron/fetch-maps`)
- Core logic resides in `frontend/src/app/api/cron/fetch-maps/route.ts`.
- Fetches 8 map types from ECCC static URLs.
- Uses `crypto` for SHA-256 deduplication.
- **Image Pipeline (`src/lib/processor.ts`):** 
  - Uses `Jimp` for lightweight, dependency-free Node.js image manipulation.
  - Scans pixels sequentially: 
    - `gray < 100`: Foreground (preserves original text/isobars).
    - `100 < gray < 240`: Land (#DCECCB).
    - `gray >= 240`: Water (#4A90E2).

### 2. Database Layer (`src/lib/storage.ts`)
- Uses `@neondatabase/serverless` for **HTTP-based SQL queries**.
- Bypasses TCP connection limits and TLS/channel_binding issues common in serverless Python.
- Automatically handles table initialization (`initDb`) on every cold-start.

### 3. Meteorologist's Notebook
- Feature implementation in `src/app/actions/notes.ts`.
- Uses **Next.js Server Actions** to record observational logs directly from the UI to Neon Postgres.

### 4. Force Sync
- Integrated into `StatusBar.tsx`.
- Allows users to manually trigger the internal `/api/cron/fetch-maps` route to populate the database instantly.

## Frontend Architecture

### Pages (App Router)

1. **Home** (`/app/page.tsx`)
   - Hero with Warp Shader (Three.js/GLSL).
   - Bento-grid design system.

2. **Maps** (`/app/maps/page.tsx`)
   - **StatusBar**: Real-time Edge health and "Force Sync" control.
   - **MapViewer**: Zoomable, downloadable, revalidating map display.
   - **Notebook**: Observational log interface (Server Action).

3. **Archive** (`/app/archive/page.tsx`)
   - 7-day rolling gallery using Postgres metadata.

4. **About** (`/app/about/page.tsx`)
   - **DO NOT MODIFY** - finalized narrative asset.

5. **Historical Decision Log (LLM Persistence)**
   - **2026-03-30**: Absolute Pivot from Python/FastAPI to 100% Next.js.
   - **Reasoning**: Vercel Python runtime limits (OpenCV binary size and TCP timeout) caused persistent 500 errors.
   - **Solution**: Replaced with `jimp` (Node.js) and `@neondatabase/serverless` (HTTP).
   - **Result**: "Backend Offline" error resolved; 300ms edge execution.
   - **2026-03-31**: Normalized map API payloads (`image_url`/`original_url`) and improved Maps/Archive UX (errors, downloads, zoom). Added `/api/cron/cleanup` to match scheduled cron. Fixed `Jimp.read` binding so `/api/cron/fetch-maps` runs in production.

### API Client (`lib/api.ts`)
- Same-domain requests to `/api/status`, `/api/maps/latest`, etc.
- Standardized `SystemStatus` interface (Live Edge status).

## Database Schema

### tables

```sql
-- Map Metadata
CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    map_type TEXT NOT NULL,
    filename TEXT NOT NULL,
    blob_url TEXT NOT NULL,
    original_blob_url TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    hash TEXT UNIQUE NOT NULL
);

-- Observational Logs
CREATE TABLE observer_notes (
    id SERIAL PRIMARY KEY,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration (vercel.json)

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/fetch-maps",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Security & Compliance
1. **Neon HTTP Auth**: Secured via `POSTGRES_URL` connection strings.
2. **Vercel Blob**: Protected via `BLOB_READ_WRITE_TOKEN`.
3. **Legal**: Every data-rendering page includes: *"Contains information licensed under the Open Government Licence – Canada."*

## Recommended Technical Data (Important)

### 1. Image Processing Specs (Jimp)
- **Library**: `jimp` (Native JS)
- **Algorithm**: Logical pixel scanning (Spatial Thresholding).
- **Colors**: Land (#DCECCB), Water (#4A90E2).
- **Logic**: Preserves `gray < 100` as foreground isobars.

### 2. Database Integration (Neon)
- **Driver**: `@neondatabase/serverless` (Native HTTP).
- **Connectivity**: Uses `neon(process.env.POSTGRES_URL)`.
- **Note**: No persistent TCP connections; stateless edge execution.

### 3. Vercel Blob
- **Method**: `put(filename, buffer, { access: 'public' })`.
- **Token**: `BLOB_READ_WRITE_TOKEN`.

---

**Last Updated:** 2026-03-31
**Version:** 3.0.2 (Fetch Pipeline Fix)
