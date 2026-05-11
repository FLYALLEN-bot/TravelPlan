/**
 * Shared geographic utility functions used across geocoding, photo, and formatting modules.
 */

/** Extract city name from locationName (e.g., "重庆市渝中区解放碑" → "重庆市"). */
export function extractCity(locationName: string): string {
  const m = locationName.match(/^(.*?(?:市|省|自治区|特别行政区))/);
  return m ? m[1] : locationName;
}

/** Normalize city name by removing suffix for comparison (e.g., "重庆市" → "重庆"). */
export function normalizeCity(city: string): string {
  return city.replace(/市$/, '').replace(/省$/, '').replace(/区$/, '').trim();
}

/** Check if two city names refer to the same city. */
export function cityMatches(expected: string, actual: string): boolean {
  if (!expected || !actual) return false;
  return normalizeCity(expected) === normalizeCity(actual);
}

/** Parse "lng,lat" string into { lat, lon }. Returns null if invalid. */
export function parseLocation(loc: string): { lat: number; lon: number } | null {
  if (!loc || !loc.includes(',')) return null;
  const [lng, lat] = loc.split(',').map(Number);
  if (!isFinite(lng) || !isFinite(lat)) return null;
  return { lat, lon: lng };
}

/** Haversine distance in km between two lat/lon points. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
