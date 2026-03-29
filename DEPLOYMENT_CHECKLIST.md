# 🚀 ATMOLENS - COMPLETE DEPLOYMENT CHECKLIST

## ✅ Pre-Deployment Checklist

### Local Testing
- [ ] Backend starts successfully (`python backend/main.py`)
- [ ] Frontend builds successfully (`cd frontend && npm run build`)
- [ ] Frontend connects to backend (status bar shows green)
- [ ] Maps fetch successfully (trigger `/api/maps/fetch`)
- [ ] No console errors in browser
- [ ] All 8 map types display correctly

### Code Quality
- [ ] No secrets in code (check .env files are in .gitignore)
- [ ] All dependencies listed in requirements.txt
- [ ] All dependencies listed in package.json
- [ ] .gitignore updated (backend/maps/, .env files)
- [ ] Deployment configs created (Dockerfile, Procfile, fly.toml)

### Git Repository
- [ ] All changes committed
- [ ] Pushed to GitHub main branch
- [ ] Repository is public OR deployment services have access

---

## 📦 Deployment Steps

### STEP 1: Deploy Frontend to Vercel

#### Option A: Vercel Dashboard
1. [ ] Go to https://vercel.com/
2. [ ] Sign up/login with GitHub
3. [ ] Click "New Project"
4. [ ] Import your repository
5. [ ] Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
6. [ ] Click "Deploy"
7. [ ] Wait for deployment (~2-3 minutes)
8. [ ] Copy your Vercel URL (e.g., `https://atmolens-abc123.vercel.app`)

#### Option B: Vercel CLI
```bash
npm install -g vercel
vercel login
cd frontend
vercel --prod
```

**Result:** ✅ Frontend live at: ________________

---

### STEP 2: Deploy Backend

#### Option A: Railway (Recommended)
1. [ ] Go to https://railway.app/
2. [ ] Sign up/login with GitHub
3. [ ] Click "New Project"
4. [ ] Select "Deploy from GitHub repo"
5. [ ] Choose your repository
6. [ ] Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `python main.py`
7. [ ] Add Environment Variables:
   ```
   HOST=0.0.0.0
   PORT=8001
   FRONTEND_ORIGIN=https://your-vercel-url.vercel.app
   FETCH_INTERVAL_MINUTES=30
   ARCHIVE_DAYS=7
   ```
8. [ ] Click "Deploy"
9. [ ] Wait for deployment (~5 minutes)
10. [ ] Copy your Railway URL (e.g., `https://atmolens-backend.railway.app`)

**Result:** ✅ Backend live at: ________________

#### Option B: Render
1. [ ] Go to https://render.com/
2. [ ] Sign up/login with GitHub
3. [ ] Click "New" → "Web Service"
4. [ ] Connect repository
5. [ ] Configure:
   - **Name:** atmolens-backend
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. [ ] Add Environment Variables (same as Railway)
7. [ ] Click "Create Web Service"

**Result:** ✅ Backend live at: ________________

---

### STEP 3: Connect Frontend to Backend

1. [ ] Go back to Vercel Dashboard
2. [ ] Select your project
3. [ ] Go to **Settings** → **Environment Variables**
4. [ ] Add new variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.railway.app
   ```
   (Use your actual backend URL from Step 2)
5. [ ] Click "Save"
6. [ ] Go to **Deployments** tab
7. [ ] Click **...** on latest deployment → **Redeploy**
8. [ ] Wait for redeployment (~1-2 minutes)

**Result:** ✅ Frontend connected to backend

---

## 🧪 Post-Deployment Testing

### Test Backend
1. [ ] Open: `https://your-backend-url/api/status`
2. [ ] Should return JSON with:
   - System: "Weather Map Processor"
   - Scheduler: running=true
   - Map types: 8 types listed
3. [ ] Trigger fetch: `https://your-backend-url/api/maps/fetch`
4. [ ] Check logs for any errors

### Test Frontend
1. [ ] Open: `https://your-vercel-url.vercel.app`
2. [ ] Homepage loads correctly
3. [ ] Status bar shows green "Live" indicator
4. [ ] Click "View Live Maps"
5. [ ] Status bar shows:
   - Last fetch time
   - Next scheduled run
   - Maps processed count
6. [ ] Maps display correctly (may take 30 min for first fetch)

### Test Connection
1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Navigate to Maps page
4. [ ] Should see no CORS errors
5. [ ] Should see successful API calls to backend

---

## 🔄 Continuous Deployment Setup

### Auto-Deploy on Git Push
- [ ] Vercel: Already auto-deploys on push to main
- [ ] Railway: Already auto-deploys on push to main
- [ ] Render: Already auto-deploys on push to main

### To Update After Changes:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Both services redeploy automatically!

---

## 📊 Monitoring

### First 24 Hours
- [ ] Check backend logs every 2-4 hours
- [ ] Verify auto-fetch runs every 30 minutes
- [ ] Check that maps accumulate in archive
- [ ] Monitor for any error patterns

### Ongoing
- [ ] Check logs weekly
- [ ] Verify cleanup runs daily at midnight
- [ ] Monitor bandwidth usage
- [ ] Check storage usage (if limited)

---

## 🚨 Troubleshooting

### "Backend Offline" in Status Bar
**Cause:** Frontend can't reach backend
**Fix:**
1. Check `NEXT_PUBLIC_API_URL` in Vercel env vars
2. Ensure backend URL is correct (including https://)
3. Check backend logs for startup errors
4. Verify backend is running (visit /api/status)

### CORS Errors
**Cause:** Backend doesn't allow frontend origin
**Fix:**
1. Check `FRONTEND_ORIGIN` in backend env vars
2. Must exactly match Vercel URL (including https://)
3. Redeploy backend after fixing

### No Maps Appearing
**Cause:** Scheduler not running or fetch failing
**Fix:**
1. Check backend logs
2. Trigger manual fetch: `/api/maps/fetch`
3. Wait 1-2 minutes and refresh
4. Check ECCC sources are accessible

### Build Failures
**Cause:** Missing dependencies or config errors
**Fix:**
1. Check build logs in Vercel/Railway
2. Verify requirements.txt and package.json
3. Test build locally first
4. Check Node/Python versions match

---

## 💰 Cost Estimates

### Free Tier Usage:
- **Vercel:** Unlimited (within fair use)
- **Railway:** $5 free credit/month (~500 hours)
- **Render:** 750 free hours/month

### Estimated Usage:
- **Bandwidth:** ~500MB/day (downloading + serving maps)
- **Storage:** ~500MB (7-day archive)
- **CPU:** Low (only spikes during fetch/process)

### After Free Tier:
- **Railway:** ~$5-10/month
- **Render:** Free tier restarts, or ~$7/month paid
- **Vercel:** Free forever for this project

---

## ✅ Final Checklist

### Before Going Live:
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set correctly
- [ ] Custom domain configured (optional)
- [ ] Analytics added (Vercel Analytics already included)
- [ ] Legal attribution visible ("Contains information licensed under the Open Government Licence – Canada")

### After Going Live:
- [ ] Share URL with users
- [ ] Monitor for first 24 hours
- [ ] Document any issues
- [ ] Set up monitoring/alerts (optional)

---

## 🎉 YOU'RE LIVE!

**Frontend URL:** ________________
**Backend URL:** ________________
**Status:** ⬜ Testing | ⬜ Live | ⬜ Monitored

**Next Steps:**
1. Monitor for 24 hours
2. Share with users
3. Gather feedback
4. Iterate and improve

---

**📝 Notes:**

---

**🎯 Completion Date:** ____ / ____ / ________
