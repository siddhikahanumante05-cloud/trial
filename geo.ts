/**
 * Pure geographical utilities for coordinates, distances, and bounding boxes.
 */

// Earth radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates Haversine distance in meters between two lat/lon coordinates.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format lat/lon to friendly DMS or decimal representation
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

/**
 * Approximate meters to lat/lon offsets
 */
export function metersToLatLonOffset(lat: number, meters: number): { dLat: number; dLon: number } {
  const dLat = meters / 111139;
  const dLon = meters / (111139 * Math.cos(toRad(lat)));
  return { dLat, dLon };
}
