# AtmoLens

**Automated ECCC Synoptic Map Enhancement System**

AtmoLens automatically fetches grayscale synoptic maps from Environment and Climate Change Canada (ECCC), transforms them into color-enhanced, easy-to-read weather maps, and publishes them on a real-time website with a rolling 7-day archive.

## Features

- **Fully Automated** — Fetches and processes maps every 30 minutes, zero human intervention
- **Dual-Source Data** — Static GIF scraping + MSC GeoMet WMS API fallback (future-proof)
- **Smart Deduplication** — SHA-256 hash comparison prevents re-processing identical maps
- **Color Enhancement** — Water → blue, Land → green/beige, meteorological features preserved
- **7-Day Archive** — Automatic cleanup of old data
- **Real-Time Dashboard** — Live status, map viewer with zoom, before/after comparison slider

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────┐
│  Scheduler   │───▶│  Data Fetcher    │───▶│  Image Processor │───▶│  Storage  │
│  (APScheduler)│    │  (Static + WMS)  │    │  (OpenCV)        │    │  Manager  │
└─────────────┘    └──────────────────┘    └─────────────────┘    └────┬─────┘
                                                                       │
                   ┌──────────────────┐    ┌─────────────────┐         │
                   │  Next.js Frontend │◀───│  FastAPI Server  │◀───────┘
                   └──────────────────┘    └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, OpenCV, NumPy, APScheduler |
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Three.js |
| Data Source | Environment Canada (weather.gc.ca), MSC GeoMet WMS |

## Quick Start

### Backend
```bash
cd backend
uv venv .venv --python 3.12
uv pip install -r requirements.txt
.venv/Scripts/activate    # Windows
python main.py            # Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Runs on http://localhost:3000
```

The frontend auto-proxies `/api/*` to the backend via Next.js rewrites.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | System health + scheduler info |
| GET | `/api/maps/latest` | Latest processed map per type |
| GET | `/api/maps/archive` | Full 7-day archive |
| GET | `/api/maps/image/{type}/{file}` | Serve actual image |
| POST | `/api/maps/fetch` | Manual fetch trigger |

## Map Types

- **Surface Analysis** — 00Z, 06Z, 12Z, 18Z
- **Upper Air** — 250 hPa, 500 hPa, 700 hPa, 850 hPa

## License

MIT
