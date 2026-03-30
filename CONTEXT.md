# AtmoLens - Technical Context

## Project Overview

AtmoLens is an automated weather map enhancement system that transforms grayscale ECCC synoptic charts into color-enhanced, readable maps with zero manual intervention.

## Architecture

### Deployment: 100% Vercel

```
┌─────────────────────────────────────────┐
│  VERCEL (Single Platform)              │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (Next.js 15)                 │
│  - https://your-app.vercel.app         │
│  - React 19, TypeScript, Tailwind CSS  │
│  - Dual theme: Scrapbook/Obsidian      │
│                                         │
│  Backend API (Python Serverless)       │
│  - /api/* routes                       │
│  - FastAPI handlers                    │
│  - OpenCV processing                   │
│                                         │
│  Cron Jobs (Scheduled)                 │
│  - /api/cron/fetch-maps (30 min)      │
│  - /api/cron/cleanup (daily)          │
│                                         │
│  Storage (Vercel Services)             │
│  - Postgres: Map metadata             │
│  - Blob: PNG/GIF files                │
│                                         │
└─────────────────────────────────────────┘
```

### Data Flow

```
ECCC Weather API
    ↓
Fetch (every 30 min)
    ↓
SHA-256 Hash Check (dedup)
    ↓
OpenCV Processing
    ↓
Vercel Blob Storage
    ↓
Postgres Metadata
    ↓
Next.js Frontend
    ↓
User Browser (Global CDN)
```

## Backend Processing Pipeline

### 1. Fetching (fetcher.py)
```python
# Dual-source strategy
1. Try ECCC static GIF URLs (legacy)
2. Fallback to MSC GeoMet WMS API (future-proof)
3. Return raw bytes
```

**8 Map Types:**
- Surface: 00Z, 06Z, 12Z, 18Z
- Upper Air: 250 hPa, 500 hPa, 700 hPa, 850 hPa

### 2. Deduplication (storage.py)
```python
# SHA-256 hash of raw image
hash = hashlib.sha256(image_bytes).hexdigest()

# Check if already processed
if hash in processed_hashes:
    skip  # Don't reprocess identical maps
```

### 3. Processing (processor.py)
```python
# OpenCV Pipeline:
1. Convert to grayscale
2. Extract foreground (threshold at 100)
3. Segment land vs water (pre-built mask)
4. Apply colors:
   - Water: #4A90E2 (74, 144, 226 RGB)
   - Land: #DCECCB (220, 236, 203 RGB)
5. Smooth boundaries (morphological operations)
6. Merge with original (preserve text/isobars)
```

### 4. Storage
```python
# Vercel Blob
blob_url = await blob.upload(processed_png)

# Postgres
INSERT INTO maps (map_type, filename, blob_url, timestamp, hash)
VALUES (?, ?, ?, NOW(), ?)
```

### 5. Cleanup
```python
# Daily cron (midnight)
DELETE FROM maps WHERE timestamp < NOW() - INTERVAL '7 days'
# Also delete associated Blob files
```

## Frontend Architecture

### Pages (App Router)

1. **Home** (`/app/page.tsx`)
   - Hero with shader animation
   - Feature cards (bento grid)
   - CTA buttons

2. **Maps** (`/app/maps/page.tsx`)
   - Live status bar
   - Map type selector (sidebar)
   - MapViewer component
   - Zoom, fullscreen, download controls

3. **Archive** (`/app/archive/page.tsx`)
   - Gallery view (7-day rolling)
   - Filters by map type
   - Date navigation

4. **About** (`/app/about/page.tsx`)
   - **DO NOT MODIFY** - finalized narrative

### Key Components

**MapViewer** (`components/MapViewer.tsx`)
```tsx
// Features:
- Fetch latest maps from API
- Display with zoom controls
- Toggle original vs enhanced
- Fullscreen mode
- Download functionality
- Auto-refresh every 60 seconds
```

**StatusBar** (`components/StatusBar.tsx`)
```tsx
// Real-time status:
- Backend health (green dot = live)
- Last fetch time
- Next scheduled run
- Total maps processed
- Archive count
```

**ThemeProvider** (`components/ThemeProvider.tsx`)
```tsx
// Dual theme system:
- Scrapbook: Light, tactile, #fdfbf0 background
- Obsidian: Dark, high-contrast, #121213 background
- Uses next-themes for persistence
```

### API Client (`lib/api.ts`)

```typescript
// Base URL configuration
const API_BASE = "/api";  // Same domain (Vercel)

// Key functions:
- getStatus() → System health
- getLatestMaps() → All latest maps
- getArchive() → 7-day archive
- getImageUrl(path) → Blob URL
```

## Database Schema

### Postgres Tables

```sql
CREATE TABLE maps (
    id SERIAL PRIMARY KEY,
    map_type VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    blob_url TEXT NOT NULL,
    original_blob_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    file_size INTEGER,
    hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maps_type ON maps(map_type);
CREATE INDEX idx_maps_timestamp ON maps(timestamp DESC);
CREATE INDEX idx_maps_hash ON maps(hash);

-- View for latest maps
CREATE VIEW latest_maps AS
SELECT DISTINCT ON (map_type) *
FROM maps
ORDER BY map_type, timestamp DESC;
```

## Configuration

### Backend (config.py)

```python
# Environment variable driven
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in FRONTEND_ORIGIN.split(",")]

# ECCC Data Sources
STATIC_MAP_SOURCES = {
    "surface_00z": "https://weather.gc.ca/data/analysis/jac00_100.gif",
    # ... 8 total
}

# Processing settings
FOREGROUND_THRESHOLD = 100
WATER_COLOR = (226, 144, 74)  # BGR
LAND_COLOR = (203, 236, 220)  # BGR
```

### Vercel (vercel.json)

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.9"
    }
  },
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

## API Endpoints

### Backend Routes

```
GET  /api/status           → System health, scheduler info
GET  /api/maps/latest      → Latest map of each type
GET  /api/maps/latest/:type → Latest map of specific type
GET  /api/maps/archive     → All maps in 7-day archive
GET  /api/maps/archive/:type → Archive for specific type
GET  /api/maps/image/:type/:filename → Serve PNG image
POST /api/maps/fetch       → Manually trigger fetch cycle
GET  /api/cron/fetch-maps  → Cron job handler
GET  /api/cron/cleanup     → Cron job handler
```

## Design System

### Colors

**Scrapbook Mode (Light):**
```css
--background: #fdfbf0
--surface: #ffffff
--text-primary: #1a1a1a
--text-secondary: #666666
--accent: #4A90E2
```

**Obsidian Mode (Dark):**
```css
--background: #121213
--surface: #1e1e1f
--text-primary: #ffffff
--text-secondary: #a0a0a0
--accent: #64b5f6
```

### Typography

```css
--font-display: Space Grotesk (headings)
--font-body: Plus Jakarta Sans (body text)
--font-label: Inter (UI labels)
--font-handwriting: Caveat (annotations)
```

## Performance Optimizations

1. **Next.js Image Optimization**: All images served via Next.js Image component
2. **Static Generation**: Homepage and about page pre-rendered
3. **Incremental Regeneration**: Maps page revalidates every 60 seconds
4. **Edge Caching**: CDN caches static assets globally
5. **Lazy Loading**: Heavy components load on demand
6. **Code Splitting**: Automatic per-route code splitting

## Security

1. **CORS**: Configured to allow only specified origins
2. **Rate Limiting**: Vercel automatic DDoS protection
3. **Environment Variables**: Secrets stored securely in Vercel
4. **SQL Injection**: Parameterized queries (psycopg2)
5. **XSS**: React automatic escaping
6. **CSP**: Content Security Policy headers

## Monitoring

1. **Vercel Analytics**: Built-in (already integrated)
2. **Backend Logs**: Vercel function logs
3. **Error Tracking**: Console logs in Vercel dashboard
4. **Uptime**: Vercel status page
5. **Cron Job Status**: Vercel cron logs

## Common Issues & Solutions

### Issue: Backend Offline
**Cause:** API not deployed or crashed
**Fix:** Check Vercel logs, redeploy

### Issue: CORS Errors
**Cause:** Frontend origin not allowed
**Fix:** Add frontend URL to `FRONTEND_ORIGIN` env var

### Issue: No Maps Showing
**Cause:** Cron hasn't run yet or fetch failed
**Fix:** Manually trigger `/api/maps/fetch`

### Issue: Database Connection Failed
**Cause:** Postgres not connected to project
**Fix:** Vercel dashboard → Storage → Connect Postgres

### Issue: Blob Upload Failed
**Cause:** Blob storage not configured
**Fix:** Vercel dashboard → Storage → Connect Blob

## Development Workflow

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# Backend (standalone)
cd backend
python -m pip install -r requirements.txt
python main.py  # http://localhost:8001
```

### Deployment
```bash
git add .
git commit -m "Your message"
git push origin main
# Vercel auto-deploys in 1-2 minutes
```

### Testing
```bash
# Frontend build test
cd frontend
npm run build

# Backend test
cd backend
python main.py
# Then: curl http://localhost:8001/api/status
```

## Dependencies

### Frontend (package.json)
```json
{
  "next": "16.2.1",
  "react": "19.2.4",
  "framer-motion": "^12.38.0",
  "next-themes": "^0.4.6",
  "lucide-react": "^1.7.0",
  "tailwindcss": "^4"
}
```

### Backend (requirements.txt)
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
opencv-python-headless==4.10.0.84
numpy==1.26.4
Pillow==10.4.0
httpx==0.27.0
apscheduler==3.10.4
python-dotenv==1.0.1
```

### API (api/requirements.txt)
```
httpx==0.27.0
Pillow==10.4.0
psycopg2-binary==2.9.9
```

## Future Enhancements

1. **GeoMet WMS Integration**: Full WMS/WFS support with shapefile ingestion
2. **Real-time Updates**: WebSocket for live map updates
3. **Historical Analysis**: Time-lapse animations, trend analysis
4. **Mobile App**: PWA with offline support
5. **Multi-language**: English/French bilingual support
6. **Export Options**: GeoJSON, KML format exports
7. **Custom Annotations**: User-drawn notes on maps

---

**Last Updated:** 2026-03-29
**Version:** 2.0.0 (Vercel-only deployment)
