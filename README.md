# AtmoLens 🌤️
**Turning Grayscale Data into Colored Synoptic Intelligence**

AtmoLens is an autonomous GIS pipeline designed to solve a specific problem: the low readability of standard Environment Canada (ECCC) synoptic charts. By automating the ingestion and color-enhancement of meteorological data, AtmoLens provides a clear, interactive, and high-contrast view of weather patterns for the Canadian region and Northern Hemisphere.

---

## 📽️ The Problem & Solution

### The Problem
Traditional synoptic charts are often published in **grayscale**, where land blends into the sea, coastlines disappear under isobars, and meteorological symbols are difficult to isolate at a glance. For students and weather analysts, this leads to significant "visual noise" and slower interpretation times.

### The AtmoLens Solution
AtmoLens "paints" over the boring parts. It uses a deterministic server-side pipeline to:
1.  **Ingest**: Automatically fetch the latest charts from ECCC every 30 minutes.
2.  **Transform**: Apply a custom coloration engine to re-map land, water, and grid-lines while preserving the integrity of the synoptic ink.
3.  **Archive**: Catalog processed maps into a structured, searchable 7-day archive.
4.  **Visualize**: Present the data in a premium, interactive viewer with advanced zoom and pan capabilities.

---

## ✨ Key Features

### 🎨 Colored Synoptic Maps
AtmoLens transforms standard "grey noise" into vibrant, high-contrast maps.
*   **Canada Surface Maps**: Enhanced with custom overlays for maximum coastline clarity.
*   **Northern Hemispheric Coverage**: Optimized for wide-scale atmospheric analysis.
*   **Upper Air Analysis**: Precision-scaled overlays for 250, 500, 700, and 850 hPa levels.

### 🔍 Interactive Map Viewer
A professional-grade inspection tool built directly into the browser:
*   **Precision Zoom**: Inspect systems at up to 500% zoom without losing frame context.
*   **Fluid Panning**: Navigate across the map with clamped boundaries to ensure you never lose your place.
*   **Original vs. Enhanced**: Toggle between the raw ECCC gif and the AtmoLens colored version with a single click.
*   **Local & UTC Time**: Automated timestamp syncing for real-time analysis.

### ⚙️ Autonomous Pipeline
*   **Zero Intervention**: Runs 24/7 using GitHub Actions and Vercel Cron.
*   **Self-Healing**: Automated re-processing logic that can update the entire archive when logic is improved.
*   **Health Dashboard**: Real-time status monitoring (Connecting → Live → Stale).

---

## 🛠️ Technical Architecture

- **Core**: Next.js 16 (App Router) & React 19
- **Image Processing**: `jimp` (Deterministic coloration and masking)
- **Persistence**: Neon Postgres (Metadata) & Vercel Blob (Storage)
- **Automation**: GitHub Actions (30-min sync) & Vercel Cron (Daily maintenance)
- **Styling**: Vanilla CSS with a "Scrapbook" design aesthetic

---

## 🚀 Getting Started

### Local Development
```bash
cd frontend
npm install
npm run dev
```

### Deployment
AtmoLens is optimized for Vercel. Ensure the following Environment Variables are configured:
*   `POSTGRES_URL`: Connection string for Neon.
*   `BLOB_READ_WRITE_TOKEN`: Access for Vercel Blob storage.

---

## ⚖️ Legal & Attribution
*   **Data Source**: Environment and Climate Change Canada (ECCC).
*   **License**: This project is open-source and operates under the [Open Government Licence - Canada](https://open.canada.ca/en/open-government-licence-canada).
*   **Non-Endorsement**: This project is not affiliated with or endorsed by ECCC.

---

## 🤝 Contributors & Acknowledgments
AtmoLens was developed by **Priyanshu** with the assistance of:

- **Claude (Anthropic)**: Architecture design and initial pipeline development.
- **Antigravity (Google DeepMind)**: UI/UX engineering, Zoom/Pan implementation, and pipeline hardening.
- **Vercel**: Infrastructure and storage.

---
*Created with passion for Geospatial Science and Clean Code.*
