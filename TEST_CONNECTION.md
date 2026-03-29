# 🧪 Testing Frontend-Backend Connection

## Local Testing

### Step 1: Start Backend
```bash
cd backend
python main.py
```

Should see:
```
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8001
```

### Step 2: Test Backend Directly
Open browser: http://localhost:8001/api/status

Should return JSON:
```json
{
  "system": "Weather Map Processor",
  "version": "1.0.0",
  "scheduler": { ... },
  "archive_count": 0,
  "map_types": [ ... ]
}
```

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

Should see:
```
- Local:        http://localhost:3000
```

### Step 4: Test Connection
1. Open: http://localhost:3000/maps
2. Open Browser DevTools (F12) → Console
3. Look for: `🔌 API Base URL: http://localhost:8001`
4. Status bar should show green "Live" indicator
5. No CORS errors in console

---

## Production Testing

### After Deploying to Vercel + Railway

#### Step 1: Test Backend
```bash
# Replace with your actual backend URL
curl https://your-backend.railway.app/api/status
```

Should return JSON with system info.

#### Step 2: Test Frontend
Open: https://your-app.vercel.app

#### Step 3: Check Connection
1. Open browser DevTools (F12)
2. Go to Console tab
3. Should see: `🔌 API Base URL: https://your-backend.railway.app`
4. Go to Network tab
5. Navigate to /maps page
6. Should see successful requests to backend
7. Status bar shows green "Live"

---

## Common Issues & Fixes

### Issue: "Backend Offline" in status bar

**Check 1: Backend is running**
```bash
curl https://your-backend-url/api/status
```
If this fails, backend is not running or URL is wrong.

**Check 2: Frontend has correct backend URL**
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Should have: `NEXT_PUBLIC_API_URL=https://your-backend-url`
- After adding/changing, redeploy frontend

**Check 3: CORS is configured**
- Backend logs should show: `CORS enabled for origins: [...]`
- Must include your Vercel URL

---

### Issue: CORS errors in console

Example error:
```
Access to fetch at 'https://backend...' from origin 'https://frontend...'
has been blocked by CORS policy
```

**Fix:**
1. Go to Railway/Render dashboard
2. Environment Variables
3. Set `FRONTEND_ORIGIN` to your Vercel URL:
   ```
   FRONTEND_ORIGIN=https://your-app.vercel.app
   ```
4. Redeploy backend
5. Wait 1-2 minutes
6. Refresh frontend

**Multiple domains:**
```
FRONTEND_ORIGIN=https://prod.vercel.app,https://atmolens.com,http://localhost:3000
```

---

### Issue: Environment variables not working

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL`
3. Value: `https://your-backend-url`
4. Apply to: Production, Preview, Development
5. Go to Deployments tab
6. Latest deployment → **...** → Redeploy

**Railway/Render:**
1. Dashboard → Your Service → Variables
2. Add: `FRONTEND_ORIGIN`
3. Value: `https://your-vercel-url`
4. Save (auto-redeploys)

---

### Issue: Works locally but not in production

**Common causes:**
1. Forgot to set environment variables
2. HTTP instead of HTTPS in URLs
3. Typo in URLs
4. Backend not deployed
5. Backend crashed (check logs)

**Debug checklist:**
- [ ] Backend URL is HTTPS (not HTTP)
- [ ] Frontend URL is HTTPS (not HTTP)
- [ ] Environment variables are set in both services
- [ ] Redeployed after setting env vars
- [ ] Check backend logs for errors
- [ ] Check browser console for errors

---

## Quick Test Commands

### Local Development
```bash
# Test backend
curl http://localhost:8001/api/status

# Test frontend connection (from frontend console)
fetch('http://localhost:8001/api/status').then(r => r.json()).then(console.log)
```

### Production
```bash
# Test backend
curl https://your-backend.railway.app/api/status

# Test from browser console (on your frontend site)
fetch('https://your-backend.railway.app/api/status').then(r => r.json()).then(console.log)
```

---

## Environment Variable Checklist

### Backend (Railway/Render)
- [ ] `HOST=0.0.0.0`
- [ ] `PORT=8001` (or `$PORT` for Render)
- [ ] `FRONTEND_ORIGIN=https://your-vercel-url`
- [ ] Optional: `FETCH_INTERVAL_MINUTES=30`
- [ ] Optional: `ARCHIVE_DAYS=7`

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL=https://your-backend-url`

---

## Visual Verification

### Local (Working)
```
Frontend: http://localhost:3000
  ↓ (makes request to)
Backend: http://localhost:8001
  ↓ (returns data)
Status Bar: 🟢 Live
```

### Production (Working)
```
Frontend: https://your-app.vercel.app
  ↓ (makes request to)
Backend: https://your-backend.railway.app
  ↓ (returns data with CORS headers)
Status Bar: 🟢 Live
```

### Production (Not Working - CORS)
```
Frontend: https://your-app.vercel.app
  ↓ (makes request to)
Backend: https://your-backend.railway.app
  ↓ (rejects - CORS error)
Status Bar: 🔴 Backend Offline
Console: CORS policy error
```

**Fix:** Add frontend URL to `FRONTEND_ORIGIN` in backend

---

## Success Indicators

### Backend Healthy:
- ✅ `/api/status` returns 200 OK
- ✅ Logs show: "Application startup complete"
- ✅ Logs show: "CORS enabled for origins"
- ✅ No error messages in logs

### Frontend Healthy:
- ✅ Pages load correctly
- ✅ No 404 errors in Network tab
- ✅ Console shows API base URL
- ✅ No environment variable warnings

### Connection Healthy:
- ✅ Status bar shows green dot
- ✅ No CORS errors in console
- ✅ API requests succeed (check Network tab)
- ✅ Maps display (after 30 min or manual fetch)

---

## Production Readiness Test

Run through this before going live:

1. [ ] Backend `/api/status` returns 200
2. [ ] Frontend homepage loads
3. [ ] Frontend /maps page loads
4. [ ] Status bar shows green "Live"
5. [ ] No errors in browser console
6. [ ] No errors in backend logs
7. [ ] Can trigger manual fetch successfully
8. [ ] Maps appear after fetch
9. [ ] Zoom/download controls work
10. [ ] Theme switching works

If all green, you're ready! 🚀

---

## Getting Help

If still having issues:

1. **Check logs:**
   - Backend: Railway/Render dashboard → Logs
   - Frontend: Browser DevTools → Console

2. **Verify URLs:**
   - Backend should be HTTPS
   - Frontend should be HTTPS
   - No typos in environment variables

3. **Test separately:**
   - Backend API with curl
   - Frontend in isolation
   - Then test together

4. **Common mistakes:**
   - Forgot to redeploy after adding env vars
   - Used HTTP instead of HTTPS
   - Wrong backend URL in frontend
   - Wrong frontend URL in backend CORS
   - Backend crashed (check logs)
