# AtmoLens - AI Assistant Prompt

You are helping with **AtmoLens**, a weather map visualization platform that automatically fetches, processes, and enhances ECCC (Environment and Climate Change Canada) synoptic maps.

## Your Role

Help with development, debugging, deployment, and feature additions for this Next.js + Python full-stack application.

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Vercel deployment

**Backend:**
- Python 3.12
- FastAPI
- OpenCV (image processing)
- APScheduler (scheduled tasks)
- Vercel Serverless Functions OR Railway/Render

**Database & Storage:**
- Vercel Postgres (metadata)
- Vercel Blob (image storage)

## Core Functionality

1. **Auto-fetch**: Every 30 minutes, fetch 8 map types from ECCC
2. **Process**: OpenCV enhances grayscale maps with color (land/water segmentation)
3. **Store**: Save to Vercel Blob, metadata to Postgres
4. **Serve**: Display via Next.js frontend with zoom, download, archive features
5. **Cleanup**: Delete maps older than 7 days (daily cron)

## Important Constraints

- **No-Fly Zone**: DO NOT modify `/frontend/src/app/about` - it's a finalized narrative asset
- **Visual Focus**: Prioritize high-contrast themes (Scrapbook light mode, Obsidian dark mode)
- **Attribution Required**: All maps must display: "Contains information licensed under the Open Government Licence – Canada"
- **Offline-First**: Backend may not be runnable in development - work on code/logic directly
- **Automation**: Everything should be automatic - no manual intervention needed

## Key Design Principles

1. **"Bit Depth" Design System**: Dual-theme with tactile Scrapbook mode (#fdfbf0) and high-contrast Obsidian mode (#121213)
2. **Zero Manual Work**: Auto-fetch, auto-process, auto-cleanup
3. **Deduplication**: SHA-256 hash checking prevents reprocessing identical maps
4. **Vercel-Only**: Everything deployed on Vercel (no external services)

## Common Tasks

### Adding a New Feature
1. Check if it affects frontend, backend, or both
2. Update relevant components in `frontend/src/components/`
3. Add API endpoints in `api/` for Vercel or `backend/main.py` for standalone
4. Update types in `frontend/src/lib/api.ts`
5. Test locally before deploying

### Debugging
1. Check browser console for frontend errors
2. Check Vercel logs or `backend/main.py` output for API errors
3. Verify environment variables are set correctly
4. Check CORS configuration if frontend can't reach backend

### Deployment
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys frontend + API
3. Ensure Postgres + Blob storage connected in Vercel dashboard
4. Verify environment variables set

## File Structure

```
atmolens/
├── api/                     # Vercel serverless functions
│   ├── index.py            # Main API routes
│   ├── requirements.txt    # Python dependencies
│   └── cron/               # Scheduled tasks
│
├── backend/                # Standalone Python backend (optional)
│   ├── main.py            # FastAPI app
│   ├── config.py          # Configuration
│   ├── fetcher.py         # ECCC data fetching
│   ├── processor.py       # OpenCV image processing
│   ├── scheduler.py       # APScheduler automation
│   ├── storage.py         # File I/O & deduplication
│   └── requirements.txt   # Dependencies
│
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities (API client, utils)
│   └── public/           # Static assets
│
├── .gitignore
├── vercel.json           # Vercel configuration
└── CONTEXT.md            # This file's companion
```

## Important Files

**Backend Core:**
- `backend/main.py` - FastAPI app with CORS, routes, lifespan management
- `backend/config.py` - All configuration from environment variables
- `backend/fetcher.py` - Async HTTP client for ECCC maps
- `backend/processor.py` - OpenCV pipeline (grayscale→foreground→segmentation→color→smooth)
- `backend/scheduler.py` - APScheduler with 30-min fetch, daily cleanup
- `backend/storage.py` - SHA-256 deduplication, file I/O, archive management

**Frontend Core:**
- `frontend/src/app/page.tsx` - Homepage with hero section
- `frontend/src/app/maps/page.tsx` - Live maps dashboard
- `frontend/src/app/archive/page.tsx` - 7-day archive gallery
- `frontend/src/components/MapViewer.tsx` - Map display with zoom/download
- `frontend/src/components/StatusBar.tsx` - Real-time backend status
- `frontend/src/lib/api.ts` - Backend API client

## Environment Variables

**Backend (Vercel/Railway):**
```env
HOST=0.0.0.0
PORT=8001
FRONTEND_ORIGIN=https://your-app.vercel.app  # Comma-separated for multiple
FETCH_INTERVAL_MINUTES=30
ARCHIVE_DAYS=7
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=/api  # Vercel same-domain, or https://backend-url for external
```

**Vercel (auto-set):**
```env
POSTGRES_URL=<auto>
BLOB_READ_WRITE_TOKEN=<auto>
```

## Code Style

- **Frontend**: React hooks, TypeScript strict mode, Tailwind for styling
- **Backend**: Type hints, async/await, error handling with try/except
- **Comments**: Only when clarifying complex logic - code should be self-documenting
- **Naming**: camelCase (JS/TS), snake_case (Python)

## Testing Checklist

Before deploying changes:
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Backend runs: `cd backend && python main.py`
- [ ] API responds: `curl http://localhost:8001/api/status`
- [ ] Frontend connects: Status bar shows green "Live"
- [ ] No console errors in browser
- [ ] Theme switching works (Scrapbook ↔️ Obsidian)

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel auto-deployed (check dashboard)
- [ ] Postgres connected and schema initialized
- [ ] Blob storage connected
- [ ] Environment variables set
- [ ] `/api/status` returns 200 OK
- [ ] Frontend loads without errors

## Getting Help

1. Check `CONTEXT.md` for technical details
2. Check Vercel logs for deployment issues
3. Check browser console for frontend errors
4. Verify environment variables in Vercel dashboard

## Legal Notice

All data from ECCC must include attribution:
**"Contains information licensed under the Open Government Licence – Canada"**

This must be visible on every page displaying weather data.

---

**Ready to help with AtmoLens development!** 🚀
