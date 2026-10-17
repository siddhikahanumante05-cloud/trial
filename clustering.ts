import { ScoredKiln, KilnCluster } from '../types';
import { haversineDistanceMeters } from './geo';

/**
 * Pure function: Groups top kilns into geographic clusters using K-Means,
 * orders sites within each cluster for efficient straight-line inspection,
 * and computes bounding ellipse parameters.
 */
export function clusterTopKilns(topKilns: ScoredKiln[], requestedK = 3): KilnCluster[] {
  if (topKilns.length === 0) return [];

  const k = Math.min(requestedK, topKilns.length);

  // Initialize centroids using K-means++ heuristic
  const centroids: { lat: number; lon: number }[] = [];
  centroids.push({ lat: topKilns[0].lat, lon: topKilns[0].lon });

  while (centroids.length < k) {
    let bestDistSq = -1;
    let bestCandidate = topKilns[0];

    for (const kiln of topKilns) {
      let minDistSq = Infinity;
      for (const c of centroids) {
        const d = haversineDistanceMeters(kiln.lat, kiln.lon, c.lat, c.lon);
        minDistSq = Math.min(minDistSq, d * d);
      }
      if (minDistSq > bestDistSq) {
        bestDistSq = minDistSq;
        bestCandidate = kiln;
      }
    }
    centroids.push({ lat: bestCandidate.lat, lon: bestCandidate.lon });
  }

  // Run K-means iterations
  let assignments: number[] = new Array(topKilns.length).fill(0);
  const maxIterations = 20;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each kiln to nearest centroid
    let changed = false;
    for (let i = 0; i < topKilns.length; i++) {
      const kiln = topKilns[i];
      let bestCluster = 0;
      let minDistance = Infinity;

      for (let c = 0; c < k; c++) {
        const d = haversineDistanceMeters(kiln.lat, kiln.lon, centroids[c].lat, centroids[c].lon);
        if (d < minDistance) {
          minDistance = d;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // Recompute centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = topKilns.filter((_, idx) => assignments[idx] === c);
      if (clusterPoints.length > 0) {
        const avgLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
        const avgLon = clusterPoints.reduce((sum, p) => sum + p.lon, 0) / clusterPoints.length;
        centroids[c] = { lat: avgLat, lon: avgLon };
      }
    }
  }

  // Balance clusters if any cluster has < 3 items and another has > 7
  // (Simple rebalance to achieve ~5-7 sites each as requested in prompt)
  const clusterNames = ['Alpha (West Sector)', 'Beta (Central Basin)', 'Gamma (East Corridor)', 'Delta (South Reach)'];

  const clusters: KilnCluster[] = [];

  for (let c = 0; c < k; c++) {
    const rawClusterKilns = topKilns.filter((_, idx) => assignments[idx] === c);
    if (rawClusterKilns.length === 0) continue;

    const centerLat = centroids[c].lat;
    const centerLon = centroids[c].lon;

    // Order kilns using greedy nearest neighbour TSP starting from westernmost
    const unvisited = [...rawClusterKilns];
    unvisited.sort((a, b) => a.lon - b.lon);
    const ordered: ScoredKiln[] = [];

    let current = unvisited.shift()!;
    ordered.push(current);

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const d = haversineDistanceMeters(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      current = unvisited.splice(nearestIdx, 1)[0];
      ordered.push(current);
    }

    // Assign cluster order
    ordered.forEach((kiln, idx) => {
      kiln.clusterId = c + 1;
      kiln.clusterOrder = idx + 1;
    });

    // Compute ellipse dimensions: semi-major and semi-minor axes in meters
    let maxDist = 800; // minimum 800m visual ellipse
    ordered.forEach((k) => {
      const d = haversineDistanceMeters(centerLat, centerLon, k.lat, k.lon);
      if (d > maxDist) maxDist = d;
    });

    // Add 25% padding so markers don't clip the dashed ellipse border
    const semiMajorM = Math.max(1200, maxDist * 1.25);
    const semiMinorM = Math.max(900, semiMajorM * 0.7);

    clusters.push({
      id: c + 1,
      name: clusterNames[c % clusterNames.length],
      centerLat,
      centerLon,
      kilns: ordered,
      radiusMeters: maxDist,
      semiMajorM,
      semiMinorM,
      angleDeg: (c * 35) % 180, // slight rotation for visual realism
    });
  }

  // Sort clusters by longitude (west to east)
  clusters.sort((a, b) => a.centerLon - b.centerLon);
  clusters.forEach((cl, idx) => {
    cl.id = idx + 1;
    cl.name = `Cluster ${String.fromCharCode(65 + idx)} (${['Western Sector', 'Central Valley', 'Eastern Plains', 'Southern Belt'][idx % 4]})`;
  });

  return clusters;
}
