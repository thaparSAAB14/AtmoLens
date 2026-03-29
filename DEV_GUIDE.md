# 🚀 AtmoLens Development Guide

## Quick Start (Local Development)

### Option 1: Start Everything at Once
**Double-click:** `start-dev.bat`

This opens two terminal windows:
- **Backend** → http://localhost:8001
- **Frontend** → http://localhost:3000

### Option 2: Start Individually

**Backend only:**
```bash
# Double-click: start-backend.bat
# OR in terminal:
cd backend
python main.py
```

**Frontend only:**
```bash
# Double-click: start-frontend.bat
# OR in terminal:
cd frontend
npm run dev
```

---

## 🧪 Testing the System

1. **Start both servers** (see above)

2. **Check backend health:**
   - Open: http://localhost:8001/api/status
   - Should show scheduler status, archive count, map types

3. **View frontend:**
   - Open: http://localhost:3000
   - Status bar should show "Live" with green dot
   - Navigate to `/maps` to see processed weather maps

4. **Trigger manual fetch (testing):**
   ```bash
   curl -X POST http://localhost:8001/api/maps/fetch
   ```

---

## 📁 Project Structure

```
├── backend/               # FastAPI + OpenCV processing
│   ├── main.py           # API server & routes
│   ├── config.py         # Configuration & env vars
│   ├── fetcher.py        # HTTP client for ECCC data
│   ├── processor.py      # OpenCV image enhancement
│   ├── scheduler.py      # APScheduler automation
│   ├── storage.py        # File I/O & deduplication
│   └── maps/             # Output directory (auto-created)
│       ├── latest.json   # Current map manifest
│       ├── hashes.json   # SHA-256 deduplication
│       └── {map_type}/   # Subdirectories per map type
│
├── frontend/             # Next.js 15 + React 19
│   ├── src/
│   │   ├── app/          # Pages (page.tsx, layout.tsx)
│   │   ├── components/   # UI components
│   │   └── lib/          # API client & utilities
│   └── public/           # Static assets
│
├── start-dev.bat         # ⭐ Start both servers
├── start-backend.bat     # Start backend only
├── start-frontend.bat    # Start frontend only
└── deploy.bat            # Git commit & push
```

---

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env` (optional - defaults work):

```env
# Server
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=http://localhost:3000

# Scheduler
FETCH_INTERVAL_MINUTES=30
CLEANUP_HOUR=0
ARCHIVE_DAYS=7

# Image Processing
FOREGROUND_THRESHOLD=100
WATER_COLOR_BGR=226,144,74  # #4A90E2
LAND_COLOR_BGR=203,236,220  # #DCECCB
```

### Frontend Environment Variables
Create `frontend/.env.local` (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 🎨 Features

### Backend
- ✅ **Auto-fetch**: Every 30 minutes from ECCC
- ✅ **Dual-source**: Static GIFs + GeoMet WMS fallback
- ✅ **SHA-256 dedup**: Only process new maps
- ✅ **Color enhancement**: OpenCV land/water segmentation
- ✅ **7-day archive**: Auto-cleanup at midnight
- ✅ **RESTful API**: Full CRUD + image serving

### Frontend
- ✅ **Live status bar**: Real-time backend health
- ✅ **Map viewer**: Zoom, fullscreen, download
- ✅ **Original vs Enhanced**: Toggle comparison
- ✅ **8 map types**: Surface (00Z-18Z) + Upper Air (250-850 hPa)
- ✅ **Archive gallery**: 7-day rolling archive
- ✅ **Dual theme**: Scrapbook (light) ↔️ Obsidian (dark)
- ✅ **Shader backgrounds**: Three.js animations

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version (need 3.8+)
python --version

# Install dependencies
cd backend
pip install -r requirements.txt

# Start manually
python main.py
```

### Frontend won't start
```bash
# Install dependencies
cd frontend
npm install

# Clear cache & restart
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### No maps showing
1. **Backend not running**: Check http://localhost:8001/api/status
2. **No data fetched yet**: Trigger manual fetch:
   ```bash
   curl -X POST http://localhost:8001/api/maps/fetch
   ```
3. **CORS issue**: Ensure `FRONTEND_ORIGIN` includes your frontend URL

### Status bar shows "Backend Offline"
- Backend must be running on port **8001**
- Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`

---

## 📦 Deployment

### Deploy to Vercel
```bash
# Option 1: Use deploy script
deploy.bat

# Option 2: Manual
git add -A
git commit -m "your message"
git push origin main

# Vercel auto-deploys if connected to repo
```

### Environment Variables (Production)
In Vercel dashboard, add:
- `NEXT_PUBLIC_API_URL` → Your backend URL
- Backend needs separate hosting (Railway, Render, etc.)

---

## 🧩 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System health & scheduler info |
| `/api/maps/latest` | GET | Latest map of each type |
| `/api/maps/latest/{type}` | GET | Latest map of specific type |
| `/api/maps/archive` | GET | All maps in 7-day archive |
| `/api/maps/archive/{type}` | GET | Archive for specific type |
| `/api/maps/image/{type}/{filename}` | GET | Serve actual PNG image |
| `/api/maps/fetch` | POST | Manually trigger fetch cycle |

---

## 📝 Legal

All data sourced from Environment and Climate Change Canada (ECCC).

**Attribution**: "Contains information licensed under the Open Government Licence – Canada."

---

## 🔮 Future Enhancements

- [ ] GeoMet WMS full integration (shapefile ingestion)
- [ ] Real-time pressure contour animation
- [ ] Historical comparison tool (time-lapse)
- [ ] Mobile PWA with offline support
- [ ] Multi-language support (EN/FR)
- [ ] Export to GeoJSON/KML

---

**Need help?** Check the code comments or open an issue!
