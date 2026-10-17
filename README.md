# ChimneyLens

> **From satellite pixel to field visit: finding and classifying every brick kiln, then turning it into an explainable plan of action.**

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Dataset: SentinelKilnDB](https://img.shields.io/badge/Dataset-SentinelKilnDB%20(NeurIPS%202025)-teal.svg)](https://sustainability-lab.github.io/)
[![Framework: React + Vite + TypeScript](https://img.shields.io/badge/Stack-React%2019%20%7C%20TailwindCSS%20%7C%20Leaflet-0f766e.svg)](https://vitejs.dev/)

---

## 1. Executive Summary

Brick kilns are a major, hard-to-monitor source of air pollution across South Asia. Environmental regulators have required old, smoky kilns to convert to cleaner designs (such as Zig-zag firing or cleaner CFCBKs), but official kiln registers are incomplete, conversion claims cannot be audited from a desk, and inspectors face severe resource constraints.

**ChimneyLens** bridges the gap between orbit and the ground for **Inspector Farida Khan** (312 registered kilns, 1 jeep, 2 staff, 3,000 km² jurisdiction):

1. **Layer 1: The Detector** — Identifies brick kilns in 10 m Sentinel-2 MSI satellite imagery, generating oriented bounding boxes (YOLO-OBB) with classification (`FCBK`, `CFCBK`, `Zigzag`) and calibrated confidence scores.
2. **Layer 2: The Decision Layer** — Converts raw detections into actionable field intelligence:
   - **Calibrated Census with Honest Error Range** ($\text{Lower} = \text{Detected} \times P$, $\text{Upper} = \text{Detected} / R$)
   - **"Did it convert?" 100 m Spatial Matching Engine** (identifying converted, unchanged, demolished, or unclear kilns)
   - **Explainable Top-20 Priority Visit Roster** with transparent factor-based scoring
   - **1-Day Patrol Clusters** (K-Means spatial grouping for single-day jeep loops)
   - **Official Field Verification Docket** exportable to CSV and print-ready format

> **Protocol Notice:** ChimneyLens is strictly a **screening tool**. It never declares a kiln illegal; every detection is framed as a **"candidate flagged for physical field verification"**.

---

## 2. Brick Kiln Design Taxonomy

| Class | Technology | Orbit Appearance (10 m Sentinel-2) | Regulatory Context |
| :--- | :--- | :--- | :--- |
| **FCBK** | Fixed Chimney Bull's Trench Kiln | Oval ring trench with central chimney shadow | Older, highly polluting design mandated to convert |
| **CFCBK** | Circular FCBK | Circular ring trench (~3% of training distribution) | Rare design; AP reported separately |
| **Zigzag** | Zig-zag draft kiln | Crisp rectangular trench with zig-zag airflow pattern | Cleaner design mandated under modern air quality rules |

---

## 3. Key Features & Screens

1. **Home Overview:** High-level executive dashboard showing 4 key metric cards (detected kilns with error range, unrecorded sites to verify, unchanged FCBKs, unclear matches), conversion distribution bar, and a "Start with these 3 visits" quick dispatch preview.
2. **Detection Viewer:** Framed viewer rendering rotated (oriented) bounding boxes over Sentinel-2 crops with a live minimum-confidence threshold slider and interactive box tooltips.
3. **District Map & GEE Basemap:** Leaflet map with plain lat/lon grid (competition protocol) or live **Google Earth Engine (GEE)** Sentinel-2 Surface Reflectance layers (True Color B4-B3-B2 and False Color B8-B4-B3), numbered Top-20 priority markers, dashed rings on uncertain candidates (0.4–0.6), collapsible filter drawer, and detail sheets with administrative village/tehsil data.
4. **Did It Convert? Tracker:** Automated 100 m radius spatial matching comparing 2023–24 baseline kilns to 2025–26 detections. Enforces the strict rule: *"Low confidence stays Unclear"*.
5. **Top-20 Field Visit List:** Prioritised ranking based on transparent factors:
   - New since 2023–24 & still FCBK: `+40 pts`
   - Within 1 km of other kilns: `+5 pts` per neighbour (capped at `+25 pts`)
   - Model uncertain (0.4–0.7 confidence): `+20 pts` (verify first)
   - Claimed conversion but still detected as FCBK: `+15 pts`
6. **1-Day Patrol Clusters:** Straight-line K-means spatial grouping partitioning the Top-20 sites into 3 compact sectors (~5–7 sites each) with nearest-neighbour sequence ordering.
7. **Export & Print Docket:** 1-click machine-readable CSV export for GPS loggers and a print-optimized 2-page Inspector's Verification Brief with official sign-off blocks.

---

## 4. Google Earth Engine (GEE) Ingestion Pipeline

ChimneyLens incorporates an automated Google Earth Engine script to extract cloud-free seasonal Sentinel-2 mosaics:

```javascript
// Google Earth Engine (GEE) - Sentinel-2 Brick Kiln Detection Pipeline
var district = ee.Geometry.Polygon([
  [[80.70, 26.65], [81.25, 26.65], [81.25, 27.15], [80.70, 27.15]]
]);

// 1. Query Sentinel-2 Level-2A Surface Reflectance (10 m GSD)
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(district)
  .filterDate('2025-10-01', '2026-03-31') // Dry winter operating season
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10));

// 2. Cloud mask using Scene Classification Layer (SCL)
function maskClouds(img) {
  var scl = img.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return img.updateMask(mask);
}

// 3. Dry-season median composite
var composite = s2.map(maskClouds).median().clip(district);

// 4. True Color Visualization
var rgbParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000, gamma: 1.2};
Map.centerObject(district, 11);
Map.addLayer(composite, rgbParams, 'Sentinel-2 True Color (10m)');
```

---

## 5. Quick Start (One-Command Reproduction)

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/chimneylens.git
cd chimneylens

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:3000` to interact with ChimneyLens.

### Production Build

```bash
# Type check and build bundle
npm run build

# Preview build locally
npm run preview
```

---

## 6. Project Structure

```
├── index.html                   # HTML entry point with Inter font & Leaflet CSS
├── package.json                 # Project dependencies and build scripts
├── vite.config.ts               # Vite build configuration with Tailwind v4 plugin
├── src/
│   ├── main.tsx                 # React application mounting
│   ├── App.tsx                  # Responsive layout, sidebar, bottom tabs & navigation
│   ├── types.ts                 # Kiln, ScoredKiln, Cluster, and Metric type definitions
│   ├── index.css                # Tailwind CSS v4 styling & dark mode rules
│   ├── components/
│   │   ├── HomeScreen.tsx       # Executive overview dashboard & Top 3 visit preview
│   │   ├── DetectScreen.tsx     # Oriented bounding box canvas & confidence slider
│   │   ├── PlainLeafletMap.tsx  # Leaflet map with GEE Sentinel-2 & grid layers
│   │   ├── MapScreen.tsx        # District map with collapsible filter drawer
│   │   ├── CountsScreen.tsx     # Census, honest error range math & model score panel
│   │   ├── ConversionScreen.tsx # 100 m spatial matching & conversion distribution
│   │   ├── VisitListScreen.tsx  # Top-20 ranked visit roster with factor ledgers
│   │   ├── OneDayPlanScreen.tsx # Geographic clusters & sequential visit stepper
│   │   ├── ExportScreen.tsx     # CSV export & print-ready Inspector's Brief
│   │   └── DataModal.tsx        # Custom detection file upload (CSV/JSON)
│   ├── data/
│   │   └── demoKilns.ts         # Realistic synthetic dataset of 124 kilns
│   └── utils/
│       ├── geo.ts               # Haversine distance, offsets, and coordinate formatting
│       ├── geoContext.ts        # Tehsil, village settlements, and jeep road access metadata
│       ├── conversionMatching.ts# Pure 100 m matching algorithm
│       ├── scoring.ts           # Pure priority visit ranking algorithm
│       ├── clustering.ts        # Pure K-Means clustering and tour generator
│       ├── fileParser.ts        # CSV/JSON validation, parser, and exporter
│       └── sampleTiles.ts       # Procedural Sentinel-2 satellite crops
```

---

## 7. Dataset Citation & Attribution

```bibtex
@inproceedings{mondal2025sentinelkilndb,
  title={SentinelKilnDB: A Multi-Temporal Dataset for Brick Kiln Detection from Sentinel-2 Satellite Imagery},
  author={Mondal, S. and others},
  booktitle={Thirty-ninth Conference on Neural Information Processing Systems (NeurIPS) Datasets and Benchmarks Track},
  year={2025},
  organization={Sustainability Lab, IIT Gandhinagar}
}
```

*Data and assets from SentinelKilnDB are licensed under **Creative Commons Attribution-NonCommercial (CC BY-NC 4.0)**.*

---

## 8. License

This project is licensed under the Apache License 2.0. Satellite training labels and SentinelKilnDB references follow CC BY-NC 4.0.
