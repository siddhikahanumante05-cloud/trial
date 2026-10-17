# ChimneyLens — Hackathon Submission Docket

## 1. Quick Info for Judges
- **Project Name:** ChimneyLens
- **Tagline:** Turning Satellite-Based Brick-Kiln Detections into an Explainable Field Inspection Plan
- **Live Hosted Prototype:** https://ais-pre-7ckfau4fgqjnbspx7tjicc-85890292438.asia-southeast1.run.app
- **License:** Apache 2.0 (Code) / CC BY-NC 4.0 (SentinelKilnDB dataset reference)

---

## 2. The Problem & Target Persona
- **Persona:** Inspector Farida Khan, State Pollution Control Board.
- **Constraints:** 312 registered kilns, 1 patrol jeep, 2 field staff, 3,000 km² jurisdiction across rural alluvial plains.
- **Pain Point:** Raw satellite detections alone cannot be acted upon. High false positives cause wasted fuel, conversion claims cannot be validated from a desk, and inspectors cannot legally accuse owners based purely on pixels.
- **Core Ethos:** ChimneyLens is strictly a **Screening Tool**. It never labels a site "illegal"; it flags candidates for physical field verification with calibrated confidence.

---

## 3. Key Technical Innovations
1. **Calibrated Census & Honest Error Range:**
   $$\text{Lower} = \text{Detections} \times \text{Precision}, \quad \text{Upper} = \frac{\text{Detections}}{\text{Recall}}$$
   Allows regulators to know the true statistical bounds rather than blind point estimates.
2. **"Did It Convert?" 100-Meter Spatial Matching Engine:**
   Tracks conversions between 2023–24 baseline and 2025–26 current observations using a rigorous decision rule: *"Low confidence (<0.5) always stays Unclear"*.
3. **Transparent Top-20 Priority Visit Scoring:**
   Explainable multi-factor scoring (+40 for new unverified FCBK, +20 for model uncertainty requiring human ground truth, +15 for false conversion claims, up to +25 for proximity clustering).
4. **Google Earth Engine (GEE) Ingestion Pipeline:**
   Includes automated Earth Engine script for cloud-masked Sentinel-2 Surface Reflectance composites (True Color B4-B3-B2 and False Color NIR B8-B4-B3).
5. **K-Means Spatial Sector Planning:**
   Straight-line clustering into 3 day-patrol sectors with nearest-neighbour dispatch sequence.
6. **Field Verification Docket & CSV Export:**
   Instant 1-click GPS CSV download and official 2-page printable docket with sign-off blocks.

---

## 4. How to Clone & Run Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/chimneylens.git
cd chimneylens

# Install dependencies
npm install

# Start the local development server (runs on port 3000)
npm run dev

# Build for production
npm run build
```

---

## 5. Repository File Guide
- `src/App.tsx`: Responsive navigation shell, dark mode, top alert banner, and screen routing.
- `src/components/HomeScreen.tsx`: Executive dashboard with 4 metric cards, conversion bar, and dispatch preview.
- `src/components/DetectScreen.tsx`: Sentinel-2 tile viewer with rotated (oriented) bounding boxes and live confidence slider.
- `src/components/PlainLeafletMap.tsx`: Plain coordinate grid map + GEE satellite layer toggle.
- `src/components/MapScreen.tsx`: Filter drawer, numbered priority markers, and candidate detail cards.
- `src/components/CountsScreen.tsx`: Honest error range calculator and model score benchmark panel.
- `src/components/ConversionScreen.tsx`: 100 m temporal matching table with status filters.
- `src/components/VisitListScreen.tsx`: Top-20 ranked field visits with factor ledgers.
- `src/components/OneDayPlanScreen.tsx`: K-Means spatial clusters with route sequence and jeep odometer tracker.
- `src/components/ExportScreen.tsx`: Printable official inspection brief and CSV export.
- `src/utils/`: Pure, testable algorithms for geographic distances, scoring, clustering, and data parsing.
