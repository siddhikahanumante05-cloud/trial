import { Kiln, ConversionMatch, ConversionStatus } from '../types';
import { haversineDistanceMeters } from './geo';

/**
 * Pure function: matches each 2023-24 FCBK against 2025-26 detections within 100 meters.
 * Assigns exactly one status:
 * - Converted: matched as CFCBK or Zigzag with confidence >= 0.5
 * - Still FCBK: matched as FCBK with confidence >= 0.5
 * - Demolished: no match and no low-confidence candidate within 100m
 * - Unclear: any match/candidate with confidence < 0.5, or more than one possible match
 */
export function matchConversions(kilns: Kiln[]): ConversionMatch[] {
  const fcbk2023 = kilns.filter((k) => k.period === '2023-24' && k.class === 'FCBK');
  const detections2025 = kilns.filter((k) => k.period === '2025-26');

  return fcbk2023.map((k23) => {
    // Find all 2025 detections within 100m
    const candidates = detections2025
      .map((k25) => ({
        kiln: k25,
        distance: haversineDistanceMeters(k23.lat, k23.lon, k25.lat, k25.lon),
      }))
      .filter((c) => c.distance <= 100)
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length === 0) {
      return {
        id_2023: k23.id,
        kiln_2023: k23,
        status: 'Demolished' as ConversionStatus,
        reason: 'No detection candidate located within 100 m radius',
      };
    }

    if (candidates.length > 1) {
      const distStrings = candidates.map((c) => `${c.distance.toFixed(0)}m (${c.kiln.class})`).join(', ');
      return {
        id_2023: k23.id,
        kiln_2023: k23,
        candidate_matches: candidates.map((c) => c.kiln),
        distance_m: candidates[0].distance,
        status: 'Unclear' as ConversionStatus,
        reason: `Multiple detections within 100 m (${candidates.length} candidates: ${distStrings})`,
      };
    }

    // Exactly one candidate
    const single = candidates[0];
    const candidateKiln = single.kiln;

    if (candidateKiln.confidence < 0.5) {
      return {
        id_2023: k23.id,
        kiln_2023: k23,
        match_2025: candidateKiln,
        distance_m: single.distance,
        status: 'Unclear' as ConversionStatus,
        reason: `Single detection nearby (${single.distance.toFixed(0)}m, ${candidateKiln.class}) but confidence is low (${(candidateKiln.confidence * 100).toFixed(0)}% < 50%)`,
      };
    }

    if (candidateKiln.class === 'FCBK') {
      return {
        id_2023: k23.id,
        kiln_2023: k23,
        match_2025: candidateKiln,
        distance_m: single.distance,
        status: 'Still FCBK' as ConversionStatus,
        reason: `Matched at ${single.distance.toFixed(0)} m as FCBK with high confidence (${(candidateKiln.confidence * 100).toFixed(0)}%)`,
      };
    }

    // CFCBK or Zigzag with confidence >= 0.5
    return {
      id_2023: k23.id,
      kiln_2023: k23,
      match_2025: candidateKiln,
      distance_m: single.distance,
      status: 'Converted' as ConversionStatus,
      reason: `Matched at ${single.distance.toFixed(0)} m as clean ${candidateKiln.class} design (${(candidateKiln.confidence * 100).toFixed(0)}% conf)`,
    };
  });
}
