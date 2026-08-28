# 3D ULPIN & Vertical Property Mapping System (SIH26011)

[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-3D%20GIS-139FCB.svg?logo=cesium&logoColor=white)](https://cesium.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-11%2F11%20Passed-10B981.svg)](https://nodejs.org)

> **Smart India Hackathon 2026 — Problem Statement SIH26011**  
> **Ministry of Rural Development • Department of Land Resources (DoLR)**  
> *Next-generation 3D Cadastral Digital Twin & Volumetric Property Stratification Command Center integrating client-side 2D floorplan footprint extraction, parametric vertical building generation, 3D Geometry Verification, Cadastral Adapter Architecture, and Emergency Disaster Command.*

---

## 🏛️ System Architecture & Workflow

```
 Architectural Blueprint (PNG / JPG / SVG)
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Computer-Vision Structural Perimeter Extraction     │
│    • Morphological structural wall boundary detection   │
│    • Connected architectural core tracing               │
│    • Dimension line, compass & title block exclusion   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Interactive Calibration & Dimension Review          │
│    • Real-time SVG vector overlay on blueprint          │
│    • Verified physical bounds: 18.00m × 14.50m (261 m²) │
│    • Metric area calculation: 2,809 sq.ft per floor     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Parametric Vertical Stacking Engine                  │
│    • Ground level anchor at 0m elevation                │
│    • Above-ground strata (F01..F04) + Basements (B01)   │
│    • Deterministic 3D ULPIN spatial encoding            │
│      (e.g., 12A34B56C78D90-A003, 12A34B56C78D90-B001)  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 4. CesiumJS 3D Geospatial Command Center               │
│    • 360° Unrestricted camera orbit & basement tilt     │
│    • Spatially anchored dynamic 3D badge labels         │
│    • Translucent strata slabs with vertical air-gaps    │
│    • Unified multi-panel state synchronizer             │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ 5. 3D Geometry Verification  │ │ 6. Disaster Response Engine  │
│    & Ground-Truth Evidence   │ │    & Emergency Command       │
│ • Cadastral Adapter registry │ │ • Concentric risk zones      │
│ • Shoelace / polygon overlap │ │ • Real-time rescue units     │
│ • Strict provenance labels   │ │ • Dynamic evacuation routes  │
│ • Deterministic discrepancy  │ │ • Rescue priority algorithm  │
│   classification (F03 alert) │ │ • Live incident event feed   │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🎯 Key Capabilities

### 1. 📐 Blueprint-to-3D Digital Twin Ingestion
- Ingests 2D architectural floorplans (PNG, JPG, SVG).
- Automatically isolates the building perimeter using morphological thresholding.
- Calibrates metric dimensions ($18.00\text{ m} \times 14.50\text{ m} \to 261\text{ m}^2 / 2,809\text{ sq.ft}$).
- Instant parametric generation of multi-story buildings and subterranean basements with custom floor heights.

### 2. 🌐 High-Performance CesiumJS 3D Command Center
- Spatially indexed 3D floor strata rendered with high-contrast tactical styling.
- **360° Free Camera Orbit**: Seamless horizontal rotation, vertical tilt, zoom, and pan around the structure.
- **Subterranean Inspection**: Collision-free camera navigation below ground level for basement ($B01$) inspection.
- Spatially anchored billboard labels displaying floor ID, occupancy status, and disaster priority.

### 3. ⚖️ 3D Geometry Verification & Ground-Truth Evidence
- **Strict Provenance Separation**: Explicit distinction between `REGISTERED CADASTRAL DATA` (government records), `3D MODEL-DERIVED DATA` (digital twin measurements), and `GROUND-TRUTH SENSOR DATA` (LiDAR/drone).
- **Automated Geometry Analysis**: Calculates 2D footprint area (Shoelace formula), perimeter, bounding dimensions, polygon overlap percentage, and boundary deviations.
- **Deterministic Discrepancy Classification**: Identifies `MATCH`, `MINOR_DEVIATION`, `BOUNDARY_MISMATCH`, `AREA_MISMATCH`, `MAJOR_SPATIAL_MISMATCH`, and `INSUFFICIENT_GEOMETRY`.
- Accurately flags anomalies such as **Floor 03** ($+2,349\text{ sq.ft} / +510.65\%$ variance against registered $460\text{ sq.ft}$ cadastral entry).

### 4. 🔌 Pluggable Cadastral Adapter Architecture
- **Provider Interface**: Standardized cadastral record schema including ULPIN, parcel ID, floor/strata ID, registered area, use type, and ownership metadata.
- **Mock Cadastral Provider**: High-fidelity benchmark data with provenance tags.
- **External Cadastral Provider**: Future-ready adapter interface returning graceful `NOT_CONNECTED` states without mock data contamination.

### 5. 🚨 Disaster Response & Rescue Priority Engine
- **Concentric Geodetic Risk Zones**: Zone A (Critical, $50\text{m}$), Zone B (Moderate, $100\text{m}$), Zone C (Advisory, $150\text{m}$).
- **Rescue Unit Telemetry**: Live status tracking for search & rescue teams, drone reconnaissance, and paramedic squads.
- **Dynamic Evacuation Routing**: 3D corridor visualization to designated emergency assembly points.
- **Automated Rescue Priority Queue**: Multi-factor scoring ($P1 \dots P4$) computing floor vulnerability based on occupancy, mobility constraints, structural damage, and fire hazards.
- **Live Incident Stream**: Interactive dispatcher activity feed for real-time field event logging.

---

## 📁 Repository Structure

```
SIH-Hackathon/
├── .gitignore
├── README.md
└── frontend/
    ├── src/
    │   ├── cesium/                     # CesiumJS 3D viewer, layers, camera & disaster rendering
    │   │   ├── disaster/               # Risk zones, rescue units, evacuation routes
    │   │   ├── interaction/            # Raycasting & entity click handler
    │   │   ├── BuildingLayer.ts        # Building shell & bounding volume
    │   │   ├── CameraController.ts     # FlyTo, framing, and mode transitions
    │   │   ├── CesiumViewer.ts         # Main Cesium adapter & screen controller
    │   │   ├── FloorLayer.ts           # Floor strata slabs & 3D badge labels
    │   │   └── ParcelLayer.ts          # Cadastral parcel boundary polygon
    │   ├── components/
    │   │   ├── command-center/         # TopBar, Command Center view & layout
    │   │   ├── disaster/               # Disaster View (Priority Queue, Units, Routes, Feed)
    │   │   ├── floor/                  # Vertical Floor Explorer & strata breakdown
    │   │   ├── floorplan/              # Blueprint upload, CV detection & calibration modal
    │   │   ├── property/               # Property Explorer, Intelligence & Evidence Panel
    │   │   ├── ui/                     # CesiumMount, search fields, status badges, map controls
    │   │   └── ulpin/                  # 3D ULPIN Card & copy utilities
    │   ├── data/                       # Benchmark cadastral dataset (KA-BLR-DEMO-001)
    │   ├── hooks/                      # State management & Cesium adapter lifecycle hooks
    │   ├── services/
    │   │   ├── cadastral/              # Cadastral registry & provider adapters
    │   │   ├── disaster/               # Rescue priority engine & evacuation services
    │   │   ├── footprint/              # Morphological floorplan detector
    │   │   ├── generator/              # Parametric 3D property generator
    │   │   └── verification/           # Geometry verification engine & evidence service
    │   │       └── __tests__/          # Deterministic geometry verification unit tests
    │   ├── types/                      # TypeScript definitions (ULPIN, disaster, cadastral, etc.)
    │   └── utils/                      # Coordinate math, status helpers, color palettes
    ├── public/
    │   └── cesium/                     # CesiumJS static assets & Web Workers
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── eslint.config.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation & Running
```bash
# Clone the repository
git clone https://github.com/akashgamerz6575-spec/SIH-Hackathon.git
cd SIH-Hackathon/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### 3. Running Unit Tests
```bash
cd frontend
npm test
```
*Executes all 11 deterministic geometry verification and cadastral calculation test suites.*

### 4. TypeScript Type Checking
```bash
cd frontend
npx tsc --noEmit -p tsconfig.app.json
```

### 5. Production Build
```bash
cd frontend
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

---

## 📄 License
Developed for Smart India Hackathon (SIH26011) — Ministry of Rural Development, Department of Land Resources (DoLR).
