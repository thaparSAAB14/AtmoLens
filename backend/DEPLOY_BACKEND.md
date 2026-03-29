# AtmoLens Backend - Production Deployment

## 🚀 Deploy Backend to Cloud

### Option 1: Railway (Recommended - Free Tier Available)

1. **Go to:** https://railway.app/
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select** this repository
5. **Add variables:**
   ```
   PORT=8001
   HOST=0.0.0.0
   FRONTEND_ORIGIN=https://your-app.vercel.app
   FETCH_INTERVAL_MINUTES=30
   ARCHIVE_DAYS=7
   ```
6. **Root Directory:** `/backend`
7. **Start Command:** `python main.py`
8. **Deploy!** ✅

**Cost:** Free tier available (500 hours/month)

---

### Option 2: Render (Free Tier)

1. **Go to:** https://render.com/
2. **Sign up** with GitHub
3. **New** → **Web Service**
4. **Connect** this repository
5. **Settings:**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables:**
   ```
   FRONTEND_ORIGIN=https://your-app.vercel.app
   FETCH_INTERVAL_MINUTES=30
   ARCHIVE_DAYS=7
   ```
7. **Deploy!** ✅

**Cost:** Free tier available

---

### Option 3: Fly.io (Free Tier)

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create fly.toml in backend directory** (already created below)

4. **Deploy:**
   ```bash
   cd backend
   fly launch
   fly deploy
   ```

**Cost:** Free tier available

---

### Option 4: Google Cloud Run (Pay-as-you-go)

**Requirements:** Docker + Google Cloud account

See: `backend/Dockerfile` (created below)

---

### Option 5: Heroku (No longer has free tier)

**Not recommended** - requires paid plan

---

## 📝 After Backend Deployment:

1. **Copy your backend URL** (e.g., `https://atmolens-backend.railway.app`)
2. **Update frontend** environment variable
3. **Redeploy frontend** to Vercel

---

## 🔐 Environment Variables for Production:

```env
# Required
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=https://your-frontend.vercel.app

# Optional (defaults work)
FETCH_INTERVAL_MINUTES=30
CLEANUP_HOUR=0
ARCHIVE_DAYS=7
FOREGROUND_THRESHOLD=100
WATER_COLOR_BGR=226,144,74
LAND_COLOR_BGR=203,236,220
```

---

## ⚠️ Important Notes:

- Backend needs **persistent storage** for maps archive
- Some free tiers have **ephemeral storage** (files deleted on restart)
- For permanent storage, use paid tier OR store maps in cloud storage (S3, GCS)
- Expected bandwidth: ~500MB/day (downloading + serving maps)

---

## 🧪 Test Deployed Backend:

```bash
# Replace with your backend URL
curl https://your-backend-url.com/api/status
```

Should return JSON with system status.
