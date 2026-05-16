# AtmoLens 🌤️
**Turning Grayscale Data into Colored Synoptic Intelligence**

AtmoLens is an autonomous GIS pipeline designed to solve a specific problem: the low readability of standard Environment Canada (ECCC) synoptic charts. By automating the ingestion and color-enhancement of meteorological data, AtmoLens provides a clear, interactive, and high-contrast view of weather patterns for the Canadian region and Northern Hemisphere.

---

## 📽️ The Problem & Solution

### The Problem
Traditional synoptic charts are often published in **grayscale**, where land blends into the sea, coastlines disappear under isobars, and meteorological symbols are difficult to isolate at a glance. For students and weather analysts, this leads to significant "visual noise" and slower interpretation times.

### The AtmoLens Solution
AtmoLens "paints" over the boring parts. It uses a deterministic server-side pipeline to:
1.  **Ingest**: Automatically fetch the latest charts from ECCC every 30 minutes.
2.  **Transform**: Apply a custom coloration engine to re-map land, water, and grid-lines while preserving the integrity of the synoptic ink.
3.  **Archive**: Catalog processed maps into a structured, searchable 30-day archive.
4.  **Visualize**: Present the data in a premium, interactive viewer with advanced zoom and pan capabilities.

---

## ✨ Key Features

### 🎨 Colored Synoptic Maps
AtmoLens transforms standard "grey noise" into vibrant, high-contrast maps.
*   **Canada Surface Maps**: Enhanced with custom overlays for maximum coastline clarity.
*   **Northern Hemispheric Coverage**: Optimized for wide-scale atmospheric analysis.
*   **Upper Air Analysis**: Precision-scaled overlays for 250, 500, 700, and 850 hPa levels.

### 🔍 Interactive Map Viewer
A professional-grade inspection tool built directly into the browser:
*   **Precision Zoom**: Inspect systems at up to 500% zoom without losing frame context.
*   **Fluid Panning**: Navigate across the map with clamped boundaries to ensure you never lose your place.
*   **Original vs. Enhanced**: Toggle between the raw ECCC gif and the AtmoLens colored version with a single click.
*   **Local & UTC Time**: Automated timestamp syncing for real-time analysis.

### ⚙️ Autonomous Pipeline
*   **Zero Intervention**: Runs 24/7 using GitHub Actions and Vercel Cron.
*   **Self-Healing**: Automated re-processing logic that can update the entire archive when logic is improved.
*   **Health Dashboard**: Real-time status monitoring (Connecting → Live → Stale).
*   **Auto-Cleanup**: 30-day retention policy with automatic blob storage management.

---

## 🛠️ Technical Architecture

- **Core**: Next.js 16 (App Router) & React 19
- **Image Processing**: `jimp` (Deterministic coloration and masking)
- **Persistence**: Neon Postgres (Metadata) & Vercel Blob (Storage)
- **Automation**: GitHub Actions (30-min sync) & Vercel Cron (Daily maintenance)
- **Styling**: Tailwind CSS + Vanilla CSS with a "Scrapbook" design aesthetic

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Neon Postgres](https://neon.tech) database
- A [Vercel](https://vercel.com) account with Blob storage enabled

### Local Development
```bash
cd frontend
cp .env.example .env.local
# Fill in POSTGRES_URL and BLOB_READ_WRITE_TOKEN in .env.local
npm install
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | ✅ | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob storage token |
| `CRON_SECRET` | Optional | Auth for maintenance API routes |
| `BLOB_ACCESS` | Optional | `"public"` or `"private"` (default: `"private"`) |
| `ARCHIVE_RETENTION_DAYS` | Optional | Days for age-based cleanup (default: `30`) |

See [`frontend/.env.example`](frontend/.env.example) for the complete list with descriptions.

### GitHub Actions Secrets
For the automated fetch scheduler, configure these secrets in your GitHub repository:
- `CRON_SECRET`: Must match the `CRON_SECRET` env var on Vercel

### Deployment
AtmoLens is optimized for **Vercel (Hobby tier)**:
1.  Connect your GitHub repository to Vercel
2.  Set root directory to `/` (monorepo mode — `vercel.json` handles the build command)
3.  Configure the environment variables listed above
4.  Vercel will auto-deploy on push to `main`

> **Storage Note**: The Hobby plan has a 1GB Blob storage limit. The auto-cleanup system enforces 30-day retention and prunes excess maps to stay within budget.

---

## 📁 Project Structure

```
AtmoLens/
├── .github/workflows/     # GitHub Actions (30-min fetch scheduler)
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages & API routes
│   │   │   ├── api/       # Backend API (cron, maps, status, diagnostics)
│   │   │   ├── archive/   # Archive browser page
│   │   │   ├── maps/      # Live maps viewer page
│   │   │   └── about/     # About page
│   │   ├── components/    # React components (MapViewer, ArchiveGallery, etc.)
│   │   ├── lib/           # Core logic (storage, processor, API client)
│   │   └── assets/        # Overlay images for map enhancement
│   ├── public/            # Static assets
│   └── .env.example       # Environment variable template
├── vercel.json            # Vercel deployment config (monorepo root)
└── README.md
```

---

## 🔧 API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/status` | GET | — | System health + latest ingest run |
| `/api/maps/latest` | GET | — | Latest map per type |
| `/api/maps/archive` | GET | — | Archive browser (query: `?days=30`) |
| `/api/cron/fetch-maps` | GET | — | Main ingestion pipeline |
| `/api/cron/cleanup` | GET | CRON_SECRET | Storage cleanup (prune/age modes) |
| `/api/cron/cleanup-orphans` | GET | CRON_SECRET | Delete orphaned blobs |
| `/api/cron/reprocess-stale` | GET | CRON_SECRET | Re-process maps with updated enhancer |
| `/api/diagnostics/ingest` | GET | CRON_SECRET | Full system diagnostics |

---

## ⚖️ Legal & Attribution
*   **Data Source**: Environment and Climate Change Canada (ECCC).
*   **License**: This project is open-source and operates under the [Open Government Licence - Canada](https://open.canada.ca/en/open-government-licence-canada).
*   **Non-Endorsement**: This project is not affiliated with or endorsed by ECCC.

---

## 🤝 Contributors & Acknowledgments
AtmoLens was developed by **Priyanshu** with the assistance of:

- **Claude (Anthropic)**: Architecture design and initial pipeline development.
- **Antigravity (Google DeepMind)**: UI/UX engineering, Zoom/Pan implementation, and pipeline hardening.
- **Vercel**: Infrastructure and storage.

---

## 📋 Changelog

### v3.2.4 — Production Hardening (2026-05-16)
- **Fixed**: Vercel Blob storage quota exceeded — added auto-cleanup (30-day retention)
- **Fixed**: Orphaned blob references causing 500 errors during re-processing
- **Fixed**: Time-budgeted execution prevents Vercel timeout crashes
- **Fixed**: Dual `vercel.json` conflict resolved (consolidated to root)
- **Fixed**: Cron expression corrected for Hobby plan (daily max)
- **Added**: `pruneMapsByCount()` for emergency storage management
- **Added**: `.env.example` for open-source contributors
- **Improved**: Auth consistency across all maintenance API routes
- **Improved**: Archive defaults to 30-day view (was 7)
- **Removed**: Stale dev scripts (`check_db.ts`, `test_fetch.js`)

---
*Created with passion for Geospatial Science and Clean Code.*
