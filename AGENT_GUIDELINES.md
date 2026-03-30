# 🌌 AtmoLens: Master Directive for AI Assistants
**Status: Production Phase 2 — Visual Refinement & GIS Ingestion**

---

### 🚨 CRITICAL CONSTRAINTS (Read First)
1. **NO BROWSER ACCESS**: Do **NOT** ask the user for "Browser Access" to verify the UI. The environment is currently headless/stuck for automated visual testing. Work "Offline-First" by analyzing the JSX/CSS directly.
2. **BACKEND STATUS**: The standalone Python backend may appear broken or unreachable in this runtime. **Do NOT** attempt to debug the local process or fix connectivity. Build features assuming the API (Port 8001) will be resolved via Vercel Serverless in production.
3. **NO-FLY ZONE**: **DO NOT MODIFY** or touch `frontend/src/app/about`. It is a finalized storytelling asset.
4. **LEGAL OBLIGATION**: Every page displaying weather data **MUST** include the following attribution in the footer: *"Contains information licensed under the Open Government Licence – Canada."*

---

### 🎨 Visual Standards: "Bit Depth"
AtmoLens uses a dual-reality system. Maintain these exact aesthetics:
- **Scrapbook Mode (Light)**: Use `#fdfbf0` (Antique White). Focus on tactile layering: jagged tape, elevated shadows (`.depth-lifted`), and paper binding.
- **Obsidian Mode (Dark)**: Use `#121213` (Deep Obsidian). Focus on high-contrast "Technical Analysis" aesthetics.
- **Visual Task**: Remove redundant spacers. Tighten padding from large blocks (e.g., reduce `py-28` to `py-16`). Ensure 400ms smooth theme transitions (`globals.css`).

---

### 🗺️ GIS Data Framework
The system is now capable of high-resolution vector ingestion.
- **API Target**: Use the `MSC GeoMet API` (WMS/WFS) for pulling real-time meteorological data.
- **Shapefiles**: Support for `.shp` is planned. Refer to `frontend/src/lib/gis-api.ts` for the data-pulling architecture.
- **Layering**: Always layer digital vectors over the enhanced "Analog" synoptic charts.

---

### 🏁 Implementation Roadmap
- [ ] **Visual Tightening**: Continuously audit components for excessive whitespace.
- [ ] **GIS Dashboard**: Expand the `maps/` page to include WMS toggle layers introduced in the GIS-API.
- [ ] **Vercel Sync**: Always ensure `vercel.json` and `package.json` are synchronized for a Next.js 15 Monorepo build.

---

*Mission Directive compiled by Antigravity — Google DeepMind.*
