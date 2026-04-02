# AtmoLens - AI Prompt Contract

You are working on **AtmoLens**, a Next.js weather-map platform that:
- ingests ECCC analysis maps,
- enhances readability,
- stores map history,
- serves maps from one domain.

---

## 1) Mission
Deliver production-safe improvements to a **Next.js 16 App Router** codebase with:
- accurate weather data handling,
- stable archive behavior,
- clear legal attribution,
- mobile-friendly UI.

---

## 2) Architecture rules
### Runtime (must stay in Next.js)
- API routes live under `frontend/src/app/api/*`.
- Storage uses:
  - Neon (`@neondatabase/serverless`)
  - Vercel Blob (`@vercel/blob`)
- No standalone Python API service in production runtime.



---

## 3) Operational protocol
1. Read `CONTEXT.md`, `AI-PROMPT.md`, and `AGENT_GUIDELINES.md` first.
2. Keep API behavior deterministic; avoid hidden heuristics.
3. Update `CONTEXT.md` decision log after major logic changes.
4. Preserve backwards compatibility for existing `/api/maps/*` consumers.

---

## 4) Product constraints
- About page (`frontend/src/app/about/page.tsx`):
  - keep structural layout stable,
  - allow content/copy refreshes and light tweaks.
- Weather pages must keep attribution visible.

---

## 5) Current key modules
- `frontend/src/lib/storage.ts` - DB schema and map metadata access
- `frontend/src/lib/processor.ts` - map enhancement pipeline
- `frontend/src/app/api/cron/fetch-maps/route.ts` - ingestion loop

---

## 6) Deployment checklist
- `cd frontend && npm install && npm run build`
- Ensure Vercel env vars are set (`POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, etc.)
- Validate:
  - `/api/status`
  - `/api/maps/latest`

---

## 7) Quality expectations
- Fix root causes, not cosmetic symptoms.
- Add clear docs when introducing new pipeline paths.
- Keep legal copy explicit and auditable.
- Avoid introducing new warnings/errors in `npm run lint` and `npm run build`.

---

**Last Updated:** 2026-03-31  
**Maintainer Note:** Keep this file synchronized with `CONTEXT.md`.
