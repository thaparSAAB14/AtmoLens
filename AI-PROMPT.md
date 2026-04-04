# AtmoLens AI Prompt Contract

You are assisting with **AtmoLens**, an autonomous Next.js weather-map platform.

---

## 1) Mission
Deliver production-safe improvements that strengthen:
- ingestion reliability,
- archive discoverability,
- data integrity,
- operational observability,
- legal attribution compliance.

---

## 2) Architecture contract
### Runtime (required)
- Next.js 16 App Router
- Route handlers in `frontend/src/app/api/*`
- Neon Postgres + Vercel Blob
- No separate Python runtime inside production API surface

### Optional sidecars (allowed)
- Python pipelines may generate static artifacts outside runtime.
- Current optional sidecar: `pipelines/herbie/generate_gdps_t2m_overlay.py`.

---

## 3) Core system areas
- Ingestion route: `frontend/src/app/api/cron/fetch-maps/route.ts`
- Storage layer: `frontend/src/lib/storage.ts`
- Serialization layer: `frontend/src/lib/mapSerializers.ts`
- Archive API: `frontend/src/app/api/maps/archive/route.ts`
- Archive UI: `frontend/src/components/ArchiveGallery.tsx`
- Health route: `frontend/src/app/api/status/route.ts`

---

## 4) Reliability requirements
- Guard cron runs with DB advisory lock.
- Retry transient upstream failures.
- Validate source payloads before processing.
- Keep deterministic dedupe semantics.
- Persist run-level and item-level telemetry.
- Expose stale/degraded health states in status responses.

---

## 5) Archive requirements
- Organize data by Group -> Type -> Year -> Month -> Day.
- Provide timeline/date-jump affordances.
- Display metadata:
  - map/source time
  - ingest time
  - source/processed file size
  - processing version

---

## 6) Product constraints
- Keep `frontend/src/app/about/page.tsx` structurally stable.
- Maintain premium visual quality and smooth interactions.
- Preserve compatibility for existing API consumers.

---

## 7) Documentation protocol
When major behavior changes:
1. Update `CONTEXT.md` with architecture and decision-log entries.
2. Update `README.md` with operator-facing usage.
3. Update `MAINTENANCE.md` with runbook details.
4. Sync this file + `AGENT_GUIDELINES.md` if workflow assumptions changed.

---

## 8) Deployment validation
```bash
cd frontend
npm run lint
npm run build
```

Then verify:
- `/api/status`
- `/api/maps/latest`
- `/api/maps/archive?days=30`
- `/archive`

---

## 9) Quality standards
- Prefer explicit logic over hidden magic.
- Keep schema migrations additive and safe.
- Fail clearly when assumptions are violated.
- Remove stale contradictions from prior iterations.

---

**Last Updated:** 2026-04-04
