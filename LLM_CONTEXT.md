# 🌌 AtmoLens: Project Dossier & LLM Context
**Automated ECCC Synoptic Map Enhancement & Atmospheric Restoration**

---

## 📽️ The Vision: "Restoring Depth"
AtmoLens transforms static, grayscale Environment and Climate Change Canada (ECCC) synoptic charts into a cinematic, high-fidelity meteorological narrative. Every 30 minutes, it automatically normalizes and enhances these charts, bridging the gap between paper-era archival recording and professional, high-octane analysis.

### 🎭 Design Philosophy: "Bit Depth"
The project uses the **Bit Depth** design system—a tactical fusion of two distinct realities:
- **Scrapbook Mode (Analog)**: A tactile, "Antique White" (#fdfbf0) journal experience with jagged tape, realistic shadows, and skeuomorphic paper binding. It represents the human record of weather history.
- **Obsidian Mode (Digital)**: A deep, nocturnal "Atmospheric Obsidian" (#121213) interface for high-frequency data extraction.

---

## 🏗️ Technical Architecture

### **Current Stack**
- **Frontend**: Next.js 15 (Turbopack), React 19, Tailwind CSS 4, Framer Motion, Styled Components.
- **Backend**: Python FastAPI, OpenCV for image normalization, APScheduler for automated fetching.
- **Infrastructure**: Vercel Deployment (Analytics & Speed Insights integrated).

### **Repository Map**
- `/frontend`: The "Bit Depth" dashboard and storytelling UI.
- `/backend`: The ECCC ingestion and processing engine.
- `/README.md`: Root-level visionary manifesto (Text-only minimalist).
- `/LLM_CONTEXT.md`: This dossier for AI session continuity.

---

## ✅ Accomplishments (What's Done)

### **Aesthetics & Branding**
- **Hardened Contrast**: Zinc-200 (Dark) and Zinc-900 (Light) body text for 100% accessibility.
- **Tactile Scrapbook**: Implemented realistic jagged tape, elevated shadow layers (`.depth-lifted`), and paper-edge curling effects.
- **Themed Footer**: Fully theme-aware high-contrast footer.

### **Technical Infrastructure**
- **Vercel Readiness**: Integrated `@vercel/analytics` and `@vercel/speed-insights`.
- **Schema & Dependency Fixes**:
    - Fixed illegal `rootDirectory` property in `vercel.json`.
    - Resolved `@vercel/toolbar` "Module Not Found" build error by stabilizing the `layout.tsx` imports.
- **Port Migration**: Backend relocated to **Port 8001** (Frontend updated in `api.ts`) to resolve OS-level socket hangs.

---

## ⚠️ Current Status & Blockers

### **Connectivity Status**
- **Local Progress**: Frontend looks "sexy" but requires the backend to be running on **Port 8001**.
- **Issue**: Backend startup was previously blocking on the fetch cycle. **FIXED**: Injected as a non-blocking `asyncio.create_task`.

### **Deployment Status**
- **GitHub Push Pending**: local `main` branch is ahead of `origin/main` by final build/schema fixes. The user must push manually to trigger the GitHub-login modal.

---

## 🕵️ Remaining Backlog (What's Missing)

### **Home Page Hero**
- **Missing**: The "Sexy" 3D or particle-driven Hero section for the landing page. We need a high-fidelity visual anchor that screams "Atmospheric Restoration."
- **Action**: Utilize Three.js or Framer Motion for a particle-based wind/climate visual.

### **Dashboard Refinement**
- **Refinement**: Audit the GIS dashboard for premium readability and asymmetric bento-grid consistency.

---

## 🚀 Technical Instructions for Next LLM Session

### **To Start Local Environment**
1. **Frontend**: `cd frontend && npm run dev` (Port 3000).
2. **Backend**: `Stop-Process -Name python -Force ; cd backend ; & ".venv/Scripts\python.exe" main.py` (Port 8001).

### **To Fix Cloud Build**
- Push the latest commits from the root to `origin main`.
- Ensure Vercel Dashboard -> Settings -> General -> **Root Directory is set to `frontend`**.

---

## 💡 Strategic Recommendations

### **1. ☁️ Cloud-Native Backend Migration**
- **Recommendation**: Transition the Python ingestion logic into **Vercel Serverless Functions** (using the Python runtime) or a dedicated **GitHub Action** to process maps.
- **Goal**: Remove the requirement for a "Local Backend" (Port 8001), making AtmoLens 100% cloud-autonomous.

### **2. ⚡ The "Instant" GIS Experience**
- **Recommendation**: Implement **Next.js 15 Data Caching** with tag-based revalidation (`revalidateTag('weather-maps')`).
- **Goal**: Ensure that once maps are processed, the dashboard loads in under 150ms globally, rather than re-fetching from the backend API on every visit.

### **3. 🧪 Sensorial Design Refinement**
- **Recommendation**: Add **Haptic/Micro-Animation Physics** to the Scrapbook items. When a user "drags" a taped map, it should feel weighted and slightly resist, using `framer-motion` layout animations.
- **Goal**: Elevate the skeuomorphic "Atmospheric Restoration" vision into a true premium digital experience.

### **4. 🌍 Multi-Source Synchronization**
- **Recommendation**: Parallelize the ECCC synoptic extraction with real-time **OpenWeather/GeoMet** data overlays. 
- **Goal**: Display high-res digital vectors over the enhanced "Analog" charts for a "Met-Analysis" master view.

---

*Compiled with 🖤 by Antigravity—Google DeepMind Advanced Agentic Coding.*
