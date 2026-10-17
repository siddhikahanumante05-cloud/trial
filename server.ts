import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { DEMO_KILNS } from './src/data/demoKilns';
import { matchConversions } from './src/utils/conversionMatching';
import { computePriorityScores } from './src/utils/scoring';
import { clusterTopKilns } from './src/utils/clustering';
import { Kiln } from './src/types';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  // In-memory kiln store initialized with seasonal baseline
  let kilnsDatabase: Kiln[] = [...DEMO_KILNS];

  // ==========================================
  // BACKEND REST API ENDPOINTS
  // ==========================================

  // 1. Health & Pipeline Status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      environment: process.env.NODE_ENV || 'production',
      geospatial_pipeline: 'Sentinel-2 MSI (10m) + Google Earth Engine',
      detection_model: 'YOLO-OBB (SentinelKilnDB NeurIPS 2025)',
      active_records: kilnsDatabase.length,
      timestamp: new Date().toISOString()
    });
  });

  // 2. Kilns Data Ingestion & Retrieval
  app.get('/api/kilns', (req: Request, res: Response) => {
    const { period, kilnClass } = req.query;
    let results = [...kilnsDatabase];
    if (period && typeof period === 'string') {
      results = results.filter(k => k.period === period);
    }
    if (kilnClass && typeof kilnClass === 'string') {
      results = results.filter(k => k.class === kilnClass);
    }
    res.json({
      success: true,
      total: results.length,
      data: results
    });
  });

  app.post('/api/kilns', (req: Request, res: Response) => {
    const newKilns = req.body.kilns;
    if (Array.isArray(newKilns)) {
      kilnsDatabase = newKilns;
      res.json({
        success: true,
        message: `Successfully ingested ${newKilns.length} detections from satellite pipeline`,
        count: kilnsDatabase.length
      });
    } else {
      res.status(400).json({ success: false, error: 'Expected { kilns: Kiln[] } array' });
    }
  });

  // 3. Temporal Conversion Matching (2023-24 vs 2025-26)
  app.get('/api/conversion-matching', (req: Request, res: Response) => {
    const matches = matchConversions(kilnsDatabase);
    res.json({
      success: true,
      baseline_count: kilnsDatabase.filter(k => k.period === '2023-24' && k.class === 'FCBK').length,
      matches
    });
  });

  // 4. Priority Field Visit Scoring (Top-20)
  app.get('/api/priority-visits', (req: Request, res: Response) => {
    const scored = computePriorityScores(kilnsDatabase);
    res.json({
      success: true,
      total_active_candidates: scored.length,
      top20: scored.slice(0, 20)
    });
  });

  // 5. K-Means Geographic Patrol Sectors
  app.get('/api/patrol-clusters', (req: Request, res: Response) => {
    const scored = computePriorityScores(kilnsDatabase);
    const top20 = scored.slice(0, 20);
    const clusters = clusterTopKilns(top20, 3);
    res.json({
      success: true,
      algorithm: 'K-Means Spatial Partitioning (Haversine)',
      cluster_count: clusters.length,
      clusters
    });
  });

  // ==========================================
  // VITE DEV SERVER / STATIC SERVING
  // ==========================================
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChimneyLens Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
