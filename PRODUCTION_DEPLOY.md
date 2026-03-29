# 🚀 PRODUCTION DEPLOYMENT GUIDE

## 🎯 Quick Deploy (3 Steps)

### Step 1: Deploy Frontend to Vercel (5 minutes)
### Step 2: Deploy Backend to Railway/Render (10 minutes)
### Step 3: Connect Them Together (2 minutes)

---

## 📦 STEP 1: Deploy Frontend to Vercel

### **Method A: Vercel Dashboard (Easiest)**

1. **Push to GitHub first:**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Go to:** https://vercel.com/
3. **Sign up** with GitHub
4. **New Project** → **Import Git Repository**
5. **Select** your AtmoLens repo
6. **Framework:** Next.js (auto-detected)
7. **Root Directory:** `frontend`
8. **Build Command:** `npm run build` (auto-filled)
9. **Output Directory:** `.next` (auto-filled)
10. **Environment Variables** (leave empty for now)
11. Click **Deploy** ✅

**Your frontend URL:** `https://atmolens-xyz.vercel.app`

---

### **Method B: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name: atmolens
# - Directory: ./frontend
# - Deploy? Yes
```

---

## 🖥️ STEP 2: Deploy Backend

### **Option 1: Railway** (Recommended - Free tier)

1. **Go to:** https://railway.app/
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select** AtmoLens repository
5. **Settings:**
   - **Root Directory:** `backend`
   - **Start Command:** `python main.py`
6. **Variables** (click "Add Variable"):
   ```
   HOST=0.0.0.0
   PORT=8001
   FRONTEND_ORIGIN=https://atmolens-xyz.vercel.app
   FETCH_INTERVAL_MINUTES=30
   ```
   *(Replace with your actual Vercel URL from Step 1)*

7. Click **Deploy** ✅

**Your backend URL:** `https://atmolens-backend-production.up.railway.app`

---

### **Option 2: Render** (Free tier)

1. **Go to:** https://render.com/
2. **Sign up** with GitHub
3. **New** → **Web Service**
4. **Connect** AtmoLens repository
5. **Settings:**
   - **Name:** atmolens-backend
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables:**
   ```
   FRONTEND_ORIGIN=https://atmolens-xyz.vercel.app
   FETCH_INTERVAL_MINUTES=30
   ```

7. Click **Create Web Service** ✅

**Your backend URL:** `https://atmolens-backend.onrender.com`

---

## 🔗 STEP 3: Connect Frontend to Backend

1. **Go back to Vercel dashboard**
2. **Your project** → **Settings** → **Environment Variables**
3. **Add variable:**
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-url.railway.app
   ```
   *(Use your actual backend URL from Step 2)*

4. **Save**
5. **Redeploy:** Go to **Deployments** → Click **...** on latest → **Redeploy**

---

## ✅ VERIFY DEPLOYMENT

### Check Backend:
```
https://your-backend-url.com/api/status
```
Should show JSON with system info.

### Check Frontend:
```
https://atmolens-xyz.vercel.app
```
Should load homepage. Status bar should show green dot.

### Check Connection:
1. Go to https://atmolens-xyz.vercel.app/maps
2. Status bar should show "Live" with green indicator
3. If red, check environment variables

---

## 🔄 AUTOMATIC UPDATES

### When you push to GitHub:
- ✅ **Vercel** auto-deploys frontend (main branch)
- ✅ **Railway/Render** auto-deploys backend (main branch)

### To update:
```bash
git add .
git commit -m "Update message"
git push origin main
```

Both services redeploy automatically!

---

## 💰 COST BREAKDOWN

### Free Tier Limits:

**Vercel (Frontend):**
- ✅ Unlimited bandwidth
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Perfect for this project

**Railway (Backend):**
- ✅ $5/month free credit
- ✅ ~500 hours/month free
- ✅ Persistent storage included
- ⚠️ After free credit: ~$5-10/month

**Render (Backend Alternative):**
- ✅ 750 hours/month free
- ✅ Spins down after 15min inactive
- ⚠️ Cold starts (slower first request)
- ⚠️ No persistent storage on free tier

---

## 🎯 RECOMMENDED SETUP

**Best for this project:**
- **Frontend:** Vercel (free forever)
- **Backend:** Railway ($5/month after free credit)

**Why Railway?**
- Persistent storage (maps archive stays)
- No cold starts (always running)
- Easy to use
- Good free tier to start

---

## 🛠️ TROUBLESHOOTING

### Frontend shows "Backend Offline":
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure backend URL is correct
- Redeploy frontend after adding env var

### Backend not fetching maps:
- Check Railway/Render logs
- Verify scheduler is running
- Trigger manual fetch: `https://backend-url/api/maps/fetch`

### CORS errors:
- Check `FRONTEND_ORIGIN` in backend env vars
- Must match exact Vercel URL (including https://)

---

## 📝 PRODUCTION CHECKLIST

Before deploying:
- [x] Backend code fixed and tested
- [x] Frontend builds successfully
- [x] Environment variables documented
- [x] .gitignore updated (no secrets)
- [x] Docker configs created
- [x] Deployment guides written
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Connect with environment variables
- [ ] Test production URLs
- [ ] Monitor for 24 hours

---

## 🎉 YOU'RE LIVE!

Once deployed:
- ✅ Frontend accessible worldwide
- ✅ Backend running 24/7
- ✅ Maps auto-fetch every 30 minutes
- ✅ No manual intervention needed

**Share your live URL!** 🌐

---

Need help? Check the detailed guides:
- `backend/DEPLOY_BACKEND.md` - Backend deployment details
- `DEV_GUIDE.md` - Development setup
- `README.md` - Project overview
