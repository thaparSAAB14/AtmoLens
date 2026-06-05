# AtmoLens Agent Guidelines
**Scope:** Coding agents working in this repository.

---

## 1) Non-negotiable constraints
1. **Production runtime stays Next.js-only**
   - Backend logic must live in `frontend/src/app/api/*`.
   - Do not introduce a standalone Python API server.
2. **About page policy**
   - `frontend/src/app/about/page.tsx` layout is stable.
   - Content and light non-structural adjustments are allowed.
3. **Attribution policy**
   - Any weather data UI must keep ECCC licensing + attribution text.
4. **No silent behavior changes**
   - If API contract changes, update docs and affected UI consumers.
5. **Security policy**
   - The cron endpoint (`/api/cron/fetch-maps`) MUST check `CRON_SECRET` when the env var is configured.
   - Do not remove security headers from `next.config.ts`.

---

## 2) Pipeline architecture expectations
Current ingest route: `frontend/src/app/api/cron/fetch-maps/route.ts`

Required characteristics:
- `CRON_SECRET` bearer token validation (when configured)
- advisory lock to avoid overlapping runs
- explicit stage flow: fetch -> validate -> process -> store
- run/item telemetry persisted in DB
- per-map isolation (single map failure should not crash whole run)
- deterministic dedupe by source hash + processing version
- stale-map re-processing in batches of 10
- auto-cleanup via `cleanupOldMaps(14)` before each ingestion cycle
- time-budgeted execution to prevent Vercel timeout crashes

Do not regress these characteristics when refactoring.

---

## 3) Image processing rules
Processor: `frontend/src/lib/processor.ts`

Required behavior:
- Overlay assets are cached at module level (singleton pattern). Do not reload from disk per invocation.
- Foreground mask uses Otsu thresholding with 8-neighbor refinement.
- Overlay compositing must respect alpha channel (do not force transparent pixels to opaque).
- Overlay selection: surface → `northamerica_covergae.png` + `overlay.png`, upper 250/500/700 → `upper_overlay_scaled.png`, 850 → `850_overlay.png`.
- Overlay assets live in `frontend/src/assets/`. Do not duplicate them elsewhere.

---

## 4) Database change rules
- Keep schema updates backward-compatible (`ADD COLUMN IF NOT EXISTS`, non-breaking migrations).
- Preserve existing APIs (`/api/maps/latest`, `/api/maps/archive`) while extending responses safely.
- Log operational state in DB for incident debugging.

---

## 5) Archive UX rules
- Archive must support:
  - group/type filtering
  - date hierarchy (Year > Month > Day)
  - timeline jumps
  - metadata visibility (source/ingest times, sizes, processor version)
- Keep UI responsive and mobile-friendly.

---

## 6) Operations and reliability
- `/api/status` must expose enough data to diagnose stale ingestion quickly.
- Prefer deterministic failures over hidden fallback guesses.
- Keep processing within serverless memory/time constraints.
- Use sequential map processing unless a safe parallel strategy is proven.

---

## 7) Documentation protocol
After major changes, update:
- `CONTEXT.md` (architecture + decision log + version)
- `README.md` (operator-facing behavior)
- `MAINTENANCE.md` (runbook/incident response)
- `AI-PROMPT.md` and this file when workflow assumptions change

---

## 8) Style and scope discipline
- Make focused changes tied to user objective.
- Remove stale or contradictory legacy guidance.
- Prefer clear naming and explicit metadata contracts.
- Do not add unused files or dead code.

---

## 9) Open-source readiness
- Environment variables must be documented in `frontend/.env.example`.
- All maintenance routes should use optional `CRON_SECRET` auth consistently.
- `vercel.json` lives in `frontend/`. Vercel Root Directory must be set to `frontend`.
- Cron schedule must respect Hobby plan limits (daily max).
- GitHub Actions handles the 30-minute polling cadence.

---

**Last Updated:** 2026-05-16
