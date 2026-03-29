<div align="center">

![AtmoLens Banner](public/assets/docs/screenshots/banner.png)

# 🌌 ATMOLENS
### **Advanced ECCC Synoptic Map Enhancement & Automation**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![License: ECCC](https://img.shields.io/badge/License-ECCC-blue?style=for-the-badge)](https://eccc-msc.github.io/open-data/licence/readme_en/)

**AtmoLens** transforms static, grayscale Environment Canada synoptic charts into high-contrast, color-enhanced meteorological narrations — automatically, every 30 minutes.

[Explore the Docs](#-the-dna) • [Installation](#-getting-started) • [Architecture](#-the-pipeline)

</div>

---

## 🎨 The DNA: "Bit Depth"
AtmoLens is defined by its **Bit Depth** aesthetic — a fusion of tactile, analog "Scrapbook" journaling and deep, nocturnal "Atmospheric Obsidian" interfaces.

<div align="center">

### 🌓 The Two Realities

| **Scrapbook Mode (Light)** | **Obsidian Mode (Dark)** |
| :---: | :---: |
| ![Light Mode](public/assets/docs/screenshots/about-light.png) | ![Dark Mode](public/assets/docs/screenshots/about-dark.png) |
| *Antique White (#fdfbf0), Jagged Tape, Hardened Zinc-900.* | *Deep Obsidian (#121213), Cyan Glow, Hardened Zinc-200.* |

</div>

---

## ⚙️ The Pipeline
How AtmoLens bridges the gap between raw data and visual clarity.

```mermaid
graph LR
    A[ECCC Data Server] -->|Raw Grayscale| B(Normalization Engine)
    B --> C{Bit Depth Processor}
    C -->|Light Mode| D[Tactile Journal]
    C -->|Dark Mode| E[Obsidian Dashboard]
    D & E --> F[Live Deployment]
```

---

## ✨ Key Features
- **🖌️ Automated Normalization**: Real-time OpenCV-driven extraction of meteorological layers.
- **📔 Storytelling UI**: A unique "Notebook" narrative with skeuomorphic binding and realistic depth.
- **⚡ Obsidian Performance**: Optimized for ultra-low latency weather data retrieval.
- **🕵️ Data Guardian**: Built-in QA/QC dashboard for metadata verification.

---

## 🛠️ Tech Stack
<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=threedotjs&logoColor=white)

</div>

---

## 🚀 Getting Started

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/thaparSAAB14/AtmoLens.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Production Monitoring
Equipped with **Vercel Analytics** and **Speed Insights** for real-time performance tracking and deployment health.

---

<div align="center">
Built with 🖤 for the meteorological community.
</div>
