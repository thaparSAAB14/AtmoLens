<div align="center">

# 🌌 ATMOLENS
### **Advanced ECCC Synoptic Map Enhancement & Automation**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![License: ECCC](https://img.shields.io/badge/License-ECCC-blue?style=for-the-badge)](https://eccc-msc.github.io/open-data/licence/readme_en/)

**AtmoLens** transforms static, grayscale Environment Canada synoptic charts into high-contrast, color-enhanced meteorological narrations — automatically, every 30 min.

---

## 🌓 The Realities

| **Scrapbook Mode (Light)** | **Obsidian Mode (Dark)** |
| :---: | :---: |
| ![Light Mode](frontend/public/assets/docs/screenshots/about-light.png) | ![Dark Mode](frontend/public/assets/docs/screenshots/about-dark.png) |
| *Antique White & Paper* | *Deep Obsidian & Glow* |

---

## ⚙️ The Pipeline

```mermaid
graph LR
    A[ECCC Data Server] -->|Raw Grayscale| B(Normalization)
    B --> C{Bit Depth Processor}
    C -->|Light| D[Tactile Journal]
    C -->|Dark| E[Obsidian Dashboard]
    D & E --> F[Live Deployment]
```

---

## ✨ Features
- **🖌️ Auto-Normalization**: OpenCV-driven layer extraction.
- **📔 Storytelling UI**: Unique "Notebook" narrative aesthetic.
- **⚡ Obsidian Engine**: Ultra-low latency weather data rendering.
- **🕵️ QA Dashboard**: Built-in metadata verification.

---

## 🛠️ Tech Stack
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

---

## 🚀 Quick Start
```bash
git clone https://github.com/thaparSAAB14/AtmoLens.git
cd frontend
npm install
npm run dev
```

---

Built with 🖤 for the meteorological community.
</div>
