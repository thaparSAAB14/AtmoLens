# 🎯 AtmoLens - Ready to Run

## ✅ What's Been Fixed

### Backend Issues Resolved:
1. **FileNotFoundError crashes** - Added directory existence checks in `storage.py`
2. **Import organization** - Moved asyncio and time imports to module level
3. **Unused imports removed** - Cleaned up `main.py`

### Development Environment Setup:
4. **Start scripts created**:
   - `start-dev.bat` - Start both backend + frontend
   - `start-backend.bat` - Backend only  
   - `start-frontend.bat` - Frontend only
   - `check_env.py` - Diagnostic tool

5. **Documentation added**:
   - `DEV_GUIDE.md` - Complete development guide

---

## 🚀 How to Run Locally

### **Option 1: Quick Start (Recommended)**
**Double-click:** `start-dev.bat`

This opens two windows:
- Backend → http://localhost:8001
- Frontend → http://localhost:3000

### **Option 2: Run Individually**

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### **Verify It's Working:**
1. Open browser → http://localhost:3000
2. Status bar should show green "Live" indicator
3. Click "View Live Maps"
4. If no maps yet, they'll fetch automatically in ~30 minutes
5. Or trigger manual fetch: http://localhost:8001/api/maps/fetch

---

## 📊 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 + React 19)                       │
│  http://localhost:3000                                   │
│  ├─ pages: Home, Maps, Archive, About                   │
│  ├─ theme: Scrapbook ↔️ Obsidian (Bit Depth)           │
│  └─ API calls → Backend                                  │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI + OpenCV)                              │
│  http://localhost:8001                                   │
│  ├─ /api/status - Health check                          │
│  ├─ /api/maps/latest - Current maps                     │
│  ├─ /api/maps/archive - 7-day archive                   │
│  └─ /api/maps/image/{type}/{file} - Serve images        │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  SCHEDULER (APScheduler)                                 │
│  ├─ Fetch: Every 30 minutes                             │
│  └─ Cleanup: Daily at midnight                          │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  ECCC DATA SOURCES                                       │
│  ├─ Static GIFs: weather.gc.ca/data/analysis/*.gif     │
│  └─ GeoMet WMS: geo.weather.gc.ca/geomet (future)       │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 Key Features

### Automated Processing
- ✅ Fetches ECCC maps every 30 minutes
- ✅ SHA-256 deduplication (only process new data)
- ✅ OpenCV color enhancement (land/water segmentation)
- ✅ 7-day rolling archive with auto-cleanup

### Map Types (8 total)
**Surface Analysis:**
- 00Z, 06Z, 12Z, 18Z

**Upper Air:**
- 250 hPa, 500 hPa, 700 hPa, 850 hPa

### UI Features
- ✅ Live status bar (backend health, last fetch, next run)
- ✅ Map viewer (zoom, fullscreen, download)
- ✅ Original vs Enhanced toggle
- ✅ Archive gallery
- ✅ Dual theme system ("Bit Depth")
- ✅ Shader animations (Three.js)

---

## 🔧 Project Files

### Critical Backend Files:
- `backend/main.py` - FastAPI app & routes
- `backend/config.py` - Configuration
- `backend/fetcher.py` - ECCC data fetching
- `backend/processor.py` - OpenCV image enhancement
- `backend/scheduler.py` - Automation (APScheduler)
- `backend/storage.py` - File I/O & deduplication

### Critical Frontend Files:
- `frontend/src/app/page.tsx` - Home page
- `frontend/src/app/maps/page.tsx` - Maps dashboard
- `frontend/src/components/MapViewer.tsx` - Map display
- `frontend/src/components/StatusBar.tsx` - Live status
- `frontend/src/lib/api.ts` - Backend API client

### Development Tools:
- `start-dev.bat` - ⭐ Start both servers
- `start-backend.bat` - Backend only
- `start-frontend.bat` - Frontend only
- `backend/check_env.py` - Environment diagnostics
- `DEV_GUIDE.md` - Full documentation

---

## 🐛 Common Issues

### "Backend Offline" in status bar
**Fix:** Ensure backend is running on port 8001
```bash
cd backend
python main.py
```

### No maps showing
**Fix:** Trigger manual fetch
- Open: http://localhost:8001/api/maps/fetch
- Or wait for auto-fetch (every 30 min)

### Port already in use
**Fix:** Kill process or change port in config
```bash
# Check what's using port 8001
netstat -ano | findstr :8001

# Change port in backend/config.py:
PORT = 8002  # Use different port
```

### Dependencies missing
**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## 📋 Next Steps

### Immediate:
1. ✅ Backend fixed and tested
2. ✅ Frontend connected to backend
3. ✅ Development environment ready

### Future Enhancements:
- [ ] Visual polish (tighten layouts, spacing)
- [ ] Hero section with 3D effects
- [ ] GeoMet WMS shapefile integration
- [ ] Real-time pressure contour animation
- [ ] Historical comparison tool
- [ ] Mobile PWA support

---

## 🎯 Quick Commands

```bash
# Start everything
start-dev.bat

# Check environment
cd backend && python check_env.py

# Trigger manual fetch
curl -X POST http://localhost:8001/api/maps/fetch

# Check backend health
curl http://localhost:8001/api/status

# View logs (when running)
# Backend logs in terminal running main.py
# Frontend logs in terminal running npm run dev
```

---

**🚀 You're ready to develop!**

Open `start-dev.bat` and visit http://localhost:3000
