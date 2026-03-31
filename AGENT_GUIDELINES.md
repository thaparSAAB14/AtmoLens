# 🌌 AtmoLens: Master Directive for AI Assistants
**Status: Production Phase 3 — Next.js Full-Stack Pivot & GIS Ingestion**

---

### 🚨 CRITICAL CONSTRAINTS (Read First)
1. **NO BROWSER ACCESS**: Do **NOT** ask the user for "Browser Access" to verify moving parts. Analyzing the JSX/CSS and TS logic directly is the only way to work in this environment.
2. **BACKEND (100% NATIVE)**: The backend is now integrated into **Next.js API Routes** (`src/app/api/*`). Port 8001 is obsolete. All features must assume the data pipeline (Neon HTTP and Vercel Blob) is handled entirely within Node.js.
3. **NO-FLY ZONE**: **DO NOT MODIFY** or touch `frontend/src/app/about`. It is a finalized storytelling asset.
4. **LEGAL OBLIGATION**: Every page displaying weather data **MUST** include the following attribution in the footer: *"Contains information licensed under the Open Government Licence – Canada."*

---

### 🎨 Visual Standards: "Bit Depth"
AtmoLens uses a dual-reality system. Maintain these exact aesthetics:
- **Scrapbook Mode (Light)**: Use `#fdfbf0` (Antique White). Focus on tactile layering: jagged tape, elevated shadows (`.depth-lifted`), and paper binding.
- **Obsidian Mode (Dark)**: Use `#121213` (Deep Obsidian). Focus on high-contrast "Technical Analysis" aesthetics.
- **Visual Task**: Keep padding tight. Use 400ms smooth theme transitions (`globals.css`).

---

### 🗺️ GIS Data Framework
The system is capable of high-resolution vector ingestion.
- **API Target**: Use the `MSC GeoMet API` (WMS/WFS) for pulling real-time meteorological data.
- **Implementation**: Refer to `src/lib/api.ts` for the data-pulling architecture. 
- **Layering**: Ensure digital vector overlays (e.g., MSLP, Temperature) match the underlying "Analog" synoptic charts.

---

### 🏁 Implementation Roadmap
- [x] **Next.js Pivot**: Migration from Python/OpenCV to Node.js/Jimp is complete.
- [ ] **GIS Overlay Control**: Expand the `maps/` page to include WMS toggle layers introduced in the GIS-API.
- [ ] **Meteorologist's Notebook**: Continue refining the Server Action notes with rich formatting support.
- [ ] **Vercel Sync**: Monitor Cron status via `/api/status`. Ensure `/api/cron/fetch-maps` is verified in production.

---

*Mission Directive compiled by Antigravity — Google DeepMind.*
