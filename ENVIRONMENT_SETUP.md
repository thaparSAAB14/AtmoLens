# 🔧 Environment Variables Setup Guide

## 🎯 Overview

AtmoLens requires environment variables to connect frontend and backend in production.

---

## 📝 Quick Setup

### Backend Environment Variables

**Railway:**
1. Railway Dashboard → Your Service
2. **Variables** tab
3. Add these:

```env
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=https://your-app.vercel.app
FETCH_INTERVAL_MINUTES=30
ARCHIVE_DAYS=7
```

**Render:**
1. Render Dashboard → Your Service
2. **Environment** tab
3. Add these:

```env
HOST=0.0.0.0
PORT=$PORT
FRONTEND_ORIGIN=https://your-app.vercel.app
FETCH_INTERVAL_MINUTES=30
ARCHIVE_DAYS=7
```

---

### Frontend Environment Variables

**Vercel:**
1. Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add:

```env
Name: NEXT_PUBLIC_API_URL
Value: https://your-backend.railway.app
Environments: Production, Preview, Development
```

4. **Deployments** → Latest → **...** → **Redeploy**

---

## 🔄 Complete Setup Flow

### Step-by-Step Connection

1. **Deploy Backend First**
   - Deploy to Railway/Render
   - Copy the backend URL (e.g., `https://atmolens-backend.railway.app`)

2. **Configure Backend CORS**
   - Go to backend service settings
   - Add environment variable:
     ```
     FRONTEND_ORIGIN=https://your-app.vercel.app
     ```
   - Note: You don't have frontend URL yet, use placeholder

3. **Deploy Frontend**
   - Deploy to Vercel
   - Copy the frontend URL (e.g., `https://atmolens-abc123.vercel.app`)

4. **Update Backend with Real Frontend URL**
   - Go back to Railway/Render
   - Update `FRONTEND_ORIGIN` with actual Vercel URL
   - Save (auto-redeploys)

5. **Configure Frontend API URL**
   - Go to Vercel → Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` with backend URL
   - Redeploy frontend

6. **Test Connection**
   - Open frontend URL
   - Check status bar for green "Live" indicator
   - Open DevTools console for any errors

---

## 🎨 Multiple Domains Support

If you have multiple frontend domains (staging, production, custom domain):

**Backend:**
```env
FRONTEND_ORIGIN=https://prod.vercel.app,https://staging.vercel.app,https://atmolens.com
```

Separate with commas, no spaces.

---

## 🧪 Local Development

### Backend (.env file)

Create `backend/.env`:
```env
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=http://localhost:3000
FETCH_INTERVAL_MINUTES=30
ARCHIVE_DAYS=7
```

### Frontend (.env.local file)

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

**Note:** `.env` and `.env.local` are gitignored (won't be committed)

---

## 📋 All Available Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `8001` | Server port |
| `FRONTEND_ORIGIN` | **Yes** | `http://localhost:3000` | Frontend URL for CORS |
| `FETCH_INTERVAL_MINUTES` | No | `30` | How often to fetch maps |
| `CLEANUP_HOUR` | No | `0` | Hour to run daily cleanup (0-23) |
| `ARCHIVE_DAYS` | No | `7` | Days to keep old maps |
| `FOREGROUND_THRESHOLD` | No | `100` | Image processing threshold |
| `WATER_COLOR_BGR` | No | `226,144,74` | Water color (BGR format) |
| `LAND_COLOR_BGR` | No | `203,236,220` | Land color (BGR format) |
| `MAP_OUTPUT_DIR` | No | `./maps` | Where to save processed maps |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:8001` | Backend API base URL |

---

## ⚠️ Important Notes

### NEXT_PUBLIC_ Prefix

Frontend variables **must** start with `NEXT_PUBLIC_` to be accessible in the browser.

❌ Wrong: `API_URL`
✅ Correct: `NEXT_PUBLIC_API_URL`

### HTTPS in Production

Always use HTTPS in production:

❌ Wrong: `http://my-app.vercel.app`
✅ Correct: `https://my-app.vercel.app`

### No Trailing Slashes

Don't include trailing slashes in URLs:

❌ Wrong: `https://backend.railway.app/`
✅ Correct: `https://backend.railway.app`

### Redeploy After Changes

**Always redeploy after changing environment variables!**

Both Vercel and Railway auto-redeploy, but it takes 1-2 minutes.

---

## 🧪 Testing Environment Variables

### Backend

SSH into backend or check logs for:
```
INFO: CORS enabled for origins: ['https://your-app.vercel.app', ...]
```

Or test endpoint:
```bash
curl https://your-backend.railway.app/api/status
```

### Frontend

Open browser console on your site:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

Should show your backend URL.

---

## 🔒 Security Best Practices

### Never Commit Secrets

- ✅ `.env` files are in `.gitignore`
- ✅ Use environment variables in hosting platform
- ❌ Never hardcode API keys or secrets
- ❌ Never commit `.env` files to git

### Frontend Variables Are Public

- `NEXT_PUBLIC_*` variables are visible in browser
- Don't put secrets in frontend env vars
- Backend URL is okay to expose

---

## 📝 Example Configurations

### Development Setup

**Backend `.env`:**
```env
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=http://localhost:3000
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Production Setup (Railway + Vercel)

**Railway (Backend):**
```env
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=https://atmolens-abc123.vercel.app
FETCH_INTERVAL_MINUTES=30
ARCHIVE_DAYS=7
```

**Vercel (Frontend):**
```env
NEXT_PUBLIC_API_URL=https://atmolens-backend-production.up.railway.app
```

### Production Setup (Render + Vercel)

**Render (Backend):**
```env
HOST=0.0.0.0
PORT=$PORT
FRONTEND_ORIGIN=https://atmolens-abc123.vercel.app
FETCH_INTERVAL_MINUTES=30
ARCHIVE_DAYS=7
```

**Vercel (Frontend):**
```env
NEXT_PUBLIC_API_URL=https://atmolens-backend.onrender.com
```

---

## ✅ Verification Checklist

Before going live:

- [ ] Backend has `FRONTEND_ORIGIN` set
- [ ] Frontend has `NEXT_PUBLIC_API_URL` set
- [ ] All URLs use HTTPS (production)
- [ ] No trailing slashes in URLs
- [ ] Redeployed after setting variables
- [ ] Backend logs show CORS enabled
- [ ] Frontend console shows correct API URL
- [ ] Status bar shows green "Live"
- [ ] No CORS errors in browser console

---

## 🆘 Troubleshooting

### Can't see environment variable in frontend

**Problem:** `process.env.NEXT_PUBLIC_API_URL` is undefined

**Solutions:**
1. Variable must start with `NEXT_PUBLIC_`
2. Redeploy frontend after adding variable
3. Clear browser cache
4. Check Vercel dashboard that variable exists

### CORS errors

**Problem:** "Blocked by CORS policy"

**Solutions:**
1. Check `FRONTEND_ORIGIN` in backend
2. Must match exact Vercel URL (with https://)
3. Redeploy backend after changing
4. Check backend logs for CORS configuration

### Variables not updating

**Problem:** Changed variable but still see old value

**Solutions:**
1. Wait 1-2 minutes for redeploy
2. Hard refresh browser (Ctrl+Shift+R)
3. Check deployment logs
4. Verify variable was saved correctly

---

## 📚 Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

Need help? Check `TEST_CONNECTION.md` for detailed testing steps.
