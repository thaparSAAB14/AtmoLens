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

---

## 2) Pipeline architecture expectations
Current ingest route: `frontend/src/app/api/cron/fetch-maps/route.ts`

Required characteristics:
- advisory lock to avoid overlapping runs
- explicit stage flow: fetch -> validate -> process -> store
- run/item telemetry persisted in DB
- per-map isolation (single map failure should not crash whole run)
- deterministic dedupe by source hash + processing version

Do not regress these characteristics when refactoring.

---

## 3) Database change rules
- Keep schema updates backward-compatible (`ADD COLUMN IF NOT EXISTS`, non-breaking migrations).
- Preserve existing APIs (`/api/maps/latest`, `/api/maps/archive`) while extending responses safely.
- Log operational state in DB for incident debugging.

---

## 4) Archive UX rules
- Archive must support:
  - group/type filtering
  - date hierarchy (Year > Month > Day)
  - timeline jumps
  - metadata visibility (source/ingest times, sizes, processor version)
- Keep UI responsive and mobile-friendly.

---

## 5) Operations and reliability
- `/api/status` must expose enough data to diagnose stale ingestion quickly.
- Prefer deterministic failures over hidden fallback guesses.
- Keep processing within serverless memory/time constraints.
- Use sequential map processing unless a safe parallel strategy is proven.

---

## 6) Documentation protocol
After major changes, update:
- `CONTEXT.md` (architecture + decision log + version)
- `README.md` (operator-facing behavior)
- `MAINTENANCE.md` (runbook/incident response)
- `AI-PROMPT.md` and this file when workflow assumptions change

---

## 7) Style and scope discipline
- Make focused changes tied to user objective.
- Remove stale or contradictory legacy guidance.
- Prefer clear naming and explicit metadata contracts.

---

**Last Updated:** 2026-04-04
