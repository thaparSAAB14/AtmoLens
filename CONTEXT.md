# AtmoLens - Technical Context

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
│  Frontend & API (Next.js 15)           │
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
    }
  ]
}
```

## Security & Compliance
1. **Neon HTTP Auth**: Secured via `POSTGRES_URL` connection strings.
2. **Vercel Blob**: Protected via `BLOB_READ_WRITE_TOKEN`.
3. **Legal**: Every data-rendering page includes: *"Contains information licensed under the Open Government Licence – Canada."*

---

**Last Updated:** 2026-03-30
**Version:** 3.0.0 (Next.js Full-Stack Pivot)
