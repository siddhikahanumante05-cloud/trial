import { Kiln, ScoredKiln, ScoreFactor } from '../types';
import { haversineDistanceMeters } from './geo';

/**
 * Pure scoring function for ranking kilns for inspector field verification.
 * 
 * Rules:
 * - New since 2023-24 and still FCBK: +40
 * - Within 1 km of other kilns: +5 per neighbour, capped at +25
 * - Model uncertain (confidence 0.4-0.7): +20
 * - Claimed conversion but still FCBK: +15
 * 
 * Note: The 1 km neighbour flag is only a reason to check, never evidence of wrongdoing.
 */
export function computePriorityScores(kilns: Kiln[]): ScoredKiln[] {
  const currentKilns = kilns.filter((k) => k.period === '2025-26');
  const pastKilns = kilns.filter((k) => k.period === '2023-24');

  const scored: ScoredKiln[] = currentKilns.map((k) => {
    const factors: ScoreFactor[] = [];
    let priorityScore = 0;

    // 1. Check if new since 2023-24 and still FCBK (+40)
    const nearestPast = pastKilns
      .map((p) => ({
        kiln: p,
        distance: haversineDistanceMeters(k.lat, k.lon, p.lat, p.lon),
      }))
      .filter((d) => d.distance <= 100)
      .sort((a, b) => a.distance - b.distance);

    const isNewSince2023 = nearestPast.length === 0;

    if (k.class === 'FCBK' && isNewSince2023) {
      priorityScore += 40;
      factors.push({ label: 'New FCBK candidate since 2023-24', points: 40 });
    }

    // 2. Kilns within 1 km of other kilns (+5 per neighbour, capped at +25)
    const neighbours1km = currentKilns.filter(
      (other) => other.id !== k.id && haversineDistanceMeters(k.lat, k.lon, other.lat, other.lon) <= 1000
    );
    const neighbourCount = neighbours1km.length;
    if (neighbourCount > 0) {
      const neighbourPoints = Math.min(25, neighbourCount * 5);
      priorityScore += neighbourPoints;
      factors.push({
        label: `${neighbourCount} ${neighbourCount === 1 ? 'neighbour' : 'neighbours'} within 1 km`,
        points: neighbourPoints,
      });
    }

    // 3. Model uncertain (confidence 0.4 - 0.7): +20
    if (k.confidence >= 0.4 && k.confidence <= 0.705) {
      priorityScore += 20;
      factors.push({
        label: `Model confidence uncertain (${(k.confidence * 100).toFixed(0)}%)`,
        points: 20,
      });
    }

    // 4. Claimed conversion but still FCBK (+15)
    const hasClaimedConversion =
      k.claimed_conversion ||
      (nearestPast.length > 0 && nearestPast[0].kiln.claimed_conversion);

    if (k.class === 'FCBK' && hasClaimedConversion) {
      priorityScore += 15;
      factors.push({ label: 'Claimed conversion but detected as FCBK', points: 15 });
    }

    // Build human-readable one-line reason from factors
    let oneLineReason = '';
    if (factors.length === 0) {
      oneLineReason = `Routine screening: ${k.class} detected with ${(k.confidence * 100).toFixed(0)}% confidence`;
    } else {
      oneLineReason = factors
        .map((f) => `${f.label} (+${f.points})`)
        .join(', ');
    }

    return {
      ...k,
      priorityScore,
      factors,
      oneLineReason,
      rank: 0,
      neighbourCount1km: neighbourCount,
    };
  });

  // Sort descending by priority score, breaking ties by lower confidence (uncertainty first) then ID
  scored.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (a.confidence !== b.confidence) {
      return a.confidence - b.confidence;
    }
    return a.id.localeCompare(b.id);
  });

  // Assign ranks
  scored.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return scored;
}

export function getTop20Kilns(scoredKilns: ScoredKiln[]): ScoredKiln[] {
  return scoredKilns.slice(0, 20);
}
