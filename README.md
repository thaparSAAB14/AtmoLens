# ⚓ AtmoLens (Atmospheric Lens)
**100% Vercel-Native | Bit-Depth Aesthetics | GIS Data Framework**

AtmoLens is a high-fidelity meteorological restoration and enhancement platform that transforms grayscale synoptic charts into premium, color-coded atmospheric visualizations.

## 🏗️ Architecture: Vercel Serverless Monorepo
AtmoLens has been fully migrated to a **"One Domain, One Port"** serverless architecture on Vercel.

- **Frontend**: Next.js 16 (React 19) located in `/frontend`.
- **Backend**: Next.js Route Handlers under `/frontend/src/app/api` (same domain).
- **Storage**: **Vercel Blob** (Images) + Postgres metadata (Neon Serverless via `@neondatabase/serverless`).
- **Automation**: Automated ECCC synoptic pulls every 30 minutes via **Vercel Cron Jobs**.
- **Deduplication**: Per-map SHA-256; unchanged maps are skipped to keep cron fast.
- **Formats**: Enhanced maps stored as PNG; originals stored as GIF.

## 🎨 Design System: "Bit Depth"
The interface utilizes the bespoke **Bit Depth** design system, switching seamlessly between:
- **🗂️ Scrapbook (Light)**: Focused on historical, tactile analysis with #fdfbf0 background and tape-like accents.
- **🌑 Obsidian (Dark)**: A high-contrast, modern synoptic mode using #121213 with glowing data overlays.

## 🗺️ GIS Data Framework
AtmoLens integrates the **MSC GeoMet WFS/WMS** framework for high-resolution vector pulling.
- **Data Pulling**: High-fidelity weather overlays (MSLP, TT, Precipitation).
- **Legal Compliance**: Mandatory ECCC attribution integrated into all data views.

## 🚀 Getting Started (Local Development)
To run the full-stack Next.js app locally:
1.  Install deps: `cd frontend && npm install`
2.  Start dev server: `npm run dev`
3.  If you rely on Vercel resources/env vars: `vercel env pull`

**Optional (Vercel-style local routing):**
- From the repository root: `vercel dev`

## 📜 Legal & Attribution
"Contains information licensed under the Open Government Licence – Canada."
Processed meteorological data provided by **Environment and Climate Change Canada (ECCC)**.

---
*Developed by Antigravity.*
