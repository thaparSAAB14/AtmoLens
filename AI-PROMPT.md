# AtmoLens - AI Assistant Prompt

You are helping with **AtmoLens**, a 100% Next.js weather map visualization platform that automatically fetches, processes, and enhances ECCC (Environment and Climate Change Canada) synoptic maps.

## Your Role

Help with development, debugging, deployment, and feature additions for this **Full-Stack Next.js 15 application**.

## Tech Stack (100% Next.js Native)

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4, Framer Motion
- **Database**: Neon Serverless (Postgres via HTTP) - `@neondatabase/serverless`
- **Storage**: Vercel Blob (Image CDN) - `@vercel/blob`
- **Processing**: Node.js Native Pixel Scanning - `jimp`
- **Deployment**: Vercel (Unified Monorepo)

## Core Functionality

1. **Auto-fetch**: `/api/cron/fetch-maps` (Vercel Cron) triggers 8 map downloads from ECCC every 30 mins.
2. **Process**: `src/lib/processor.ts` (Jimp) enhances grayscale maps:
   - Land: #DCECCB (220, 236, 203)
   - Water: #4A90E2 (74, 144, 226)
   - Foreground (Text/Isobars): Preserved if gray < 100.
3. **Store**: SHA-256 deduplicated, stored in Vercel Blob, metadata in Neon Postgres.
4. **Notebook**: Server Action in `@/app/actions/notes.ts` records observational metadata.
5. **UI**: High-fidelity dual-theme (Scrapbook/Obsidian modes).

## Important Constraints

- **NO PYTHON**: The project is entirely Next.js. No `api/`, `backend/`, or `requirements.txt`.
- **NO-FLY ZONE**: DO NOT modify `/frontend/src/app/about` - it is a finalized narrative asset.
- **Visual Focus**: High-contrast themes (Scrapbook #fdfbf0, Obsidian #121213).
- **Attribution Required**: All maps MUST display: *"Contains information licensed under the Open Government Licence – Canada."*
- **Offline-First**: Focus on analyzing JSX/CSS and TS logic directly without browser access.
- **Neon Driver**: Always use `neon(process.env.POSTGRES_URL)` via `@neondatabase/serverless`.

## File Structure

```
atmolens/
├── frontend/                # Root of Next.js application
│   ├── src/
│   │   ├── app/            # Pages & API Routes
│   │   │   ├── api/        # Next.js Serverless Routes
│   │   │   ├── actions/    # Next.js Server Actions
│   │   │   └── maps/       # Maps Feature
│   │   ├── components/     # React UI Components
│   │   ├── lib/            # Shared logic (storage, processor)
│   │   └── public/         # Static assets
│   ├── package.json        # Dependencies: next, jimp, @vercel/blob
│   └── tsconfig.json
├── .gitignore
└── vercel.json             # Vercel deployment config (Crons)
```

## Key Modules

- **`src/lib/storage.ts`**: Database interface. Uses `initDb()` on each route entry for schema safety.
- **`src/lib/processor.ts`**: Jimp pixel scanning pipeline.
- **`src/app/api/cron/fetch-maps/route.ts`**: Core fetch/process/upload loop.
- **`src/components/StatusBar.tsx`**: Health indicator with manual **Force Sync** button.

## Deployment Checklist

- [ ] Push to GitHub: `git push origin main`
- [ ] Vercel auto-deploys via `npm run build`
- [ ] Ensure **POSTGRES_URL** and **BLOB_READ_WRITE_TOKEN** are set in Vercel.
- [ ] Verify `/api/status` returns `{"status": "online"}`.

---

**Last Updated:** 2026-03-30
**Mission Directive Compiled by Antigravity — Google DeepMind.**
