# ⚓ AtmoLens (Atmospheric Lens)
**100% Vercel-Native | Bit-Depth Aesthetics | GIS Data Framework**

AtmoLens is a high-fidelity meteorological restoration and enhancement platform that transforms grayscale synoptic charts into premium, color-coded atmospheric visualizations.

## 🏗️ Architecture: Vercel Serverless Monorepo
AtmoLens has been fully migrated to a **"One Domain, One Port"** serverless architecture on Vercel.

- **Frontend**: Next.js 15 (React 19) located in `/frontend`.
- **Backend**: Python FastAPI Serverless Functions located in `/api`.
- **Storage**: Stateless ingestion using **Vercel Blob** (Images) and **Vercel Postgres** (Metadata).
- **Automation**: Automated ECCC synoptic pulls every 30 minutes via **Vercel Cron Jobs**.

## 🎨 Design System: "Bit Depth"
The interface utilizes the bespoke **Bit Depth** design system, switching seamlessly between:
- **🗂️ Scrapbook (Light)**: Focused on historical, tactile analysis with #fdfbf0 background and tape-like accents.
- **🌑 Obsidian (Dark)**: A high-contrast, modern synoptic mode using #121213 with glowing data overlays.

## 🗺️ GIS Data Framework
AtmoLens integrates the **MSC GeoMet WFS/WMS** framework for high-resolution vector pulling.
- **Data Pulling**: High-fidelity weather overlays (MSLP, TT, Precipitation).
- **Legal Compliance**: Mandatory ECCC attribution integrated into all data views.

## 🚀 Getting Started (Local Development)
To run both the frontend and the Python API on a single port (3000):
1.  Ensure the Vercel CLI is installed: `npm i -g vercel`.
2.  Run at the repository root: `vercel dev`.
3.  Ensure your `.env.local` is pulled: `vercel env pull`.

## 📜 Legal & Attribution
"Contains information licensed under the Open Government Licence – Canada."
Processed meteorological data provided by **Environment and Climate Change Canada (ECCC)**.

---
*Developed with 🖤 by Antigravity — Google DeepMind Advanced Agentic Coding.*
