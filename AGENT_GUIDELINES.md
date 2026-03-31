# AtmoLens - Agent Guidelines
**Status:** Production (Next.js full-stack) + optional Herbie sidecar pipeline

---

## 1) Critical guardrails
1. **No browser dependency for coding tasks**
   - Solve issues by reading/editing code and running tests/build commands.
2. **Runtime architecture is Next.js API routes**
   - Production backend logic belongs in `frontend/src/app/api/*`.
   - Do not re-introduce a separate Python web backend.
3. **About page scope**
   - Keep `frontend/src/app/about/page.tsx` layout stable.
   - Copy/content and light non-structural updates are allowed.
4. **Attribution requirement**
   - Weather-facing UI must include ECCC attribution and licensing text.

---

## 2) Approved data pipelines
### A) Core production ingestion (required)
- Route: `frontend/src/app/api/cron/fetch-maps/route.ts`
- Source: ECCC analysis GIF endpoints
- Storage: Vercel Blob + Neon metadata (`maps` table)

### B) Overlay system (required)
- RDPA generated overlay: `frontend/src/app/api/geomet/rdpa/route.ts`
- GeoMet WMS fallback proxy: `frontend/src/app/api/geomet/wms/route.ts`

### C) Herbie model-guidance pipeline (optional sidecar)
- Folder: `pipelines/herbie`
- Script: `pipelines/herbie/generate_gdps_t2m_overlay.py`
- Output artifacts:
  - `frontend/public/herbie/gdps_t2m_latest.png`
  - `frontend/public/herbie/gdps_t2m_latest.json`
- Runtime consumption:
  - `GET /api/herbie/gdps-t2m`
  - `GET /api/herbie/status`

---

## 3) Visual and UX standards
- Light mode: scrapbook feel (`#fdfbf0`) with tactile depth.
- Dark mode: obsidian analysis mode (`#121213`) with high contrast.
- Maintain smooth theme transitions and mobile-first behavior.
- Avoid large structural redesigns unless explicitly requested.

---

## 4) Documentation maintenance rules
- Before major edits, read:
  - `CONTEXT.md`
  - `AI-PROMPT.md`
  - `AGENT_GUIDELINES.md`
- After major edits, update:
  - `CONTEXT.md` (decision log + version)
  - `README.md` (operator-facing instructions)
- Keep docs synchronized with real code paths and endpoints.

---

## 5) Reliability principles
- Prefer deterministic logic over implicit defaults.
- Fail fast on invalid upstream payloads instead of silently guessing.
- Preserve backward compatibility for existing map/archive APIs.
- Keep legal text explicit (license + source + non-endorsement).

---

*Guideline owner: AtmoLens maintainers.*
