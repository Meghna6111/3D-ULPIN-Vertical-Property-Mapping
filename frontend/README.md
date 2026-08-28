# 3D ULPIN & Vertical Property Mapping System (SIH26011) — Frontend

[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-3D%20GIS-139FCB.svg?logo=cesium&logoColor=white)](https://cesium.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-11%2F11%20Passed-10B981.svg)](https://nodejs.org)

> **Smart India Hackathon 2026 — Problem Statement SIH26011**  
> **Ministry of Rural Development • Department of Land Resources (DoLR)**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run unit tests
npm test

# 4. Typecheck
npx tsc --noEmit -p tsconfig.app.json

# 5. Production build
npm run build
```

---

## 🎮 3D Navigation & Camera Controls

| Interaction | Mouse Input | Action Description |
|---|---|---|
| **360° Orbit / Rotate** | `Left Click + Drag` | Rotates the camera around the 3D building |
| **Tilt & Pitch Orbit** | `Right Click + Drag` or `Middle Click + Drag` | Tilts vertically and orbits at any angle |
| **Pan / Translate** | `Shift + Right Drag` or `Alt + Left Drag` | Pans across the geospatial scene |
| **Zoom In / Out** | `Scroll Wheel` or `Pinch` | Smoothly zooms toward the cursor target |
| **Select Floor / Strata** | `Left Click` | Selects floor slab, opens intelligence & syncs state |
| **Focus Camera** | Top Toolbar "Focus" | Animates camera to currently selected floor |
| **Home Camera** | Top Toolbar "Home" | Resets camera to standard hero overview |

See root [README.md](../README.md) for full architecture and verification specifications.
