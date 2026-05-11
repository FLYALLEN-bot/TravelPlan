/**
 * AMap-based geocoding — uses AMap Web Service REST API.
 * All coordinates are [lng, lat] internally, but functions return { lat, lon }.
 */

import { regeo, geocode, textSearch } from './amapRest';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const API_DELAY = 150; // ms between AMap API calls to respect QPS limits

export interface SearchResult {
  lat: number;
  lon: number;
  displayName: string;
}

/**
 * Reverse geocode: [lat, lon] → human-readable address.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  return regeo(lat, lon);
}

/**
 * Geocode a place name with optional city/address hints.
 * Strategies (tried in order):
 *   1. AI-provided structured address via /geocode/geo (most accurate for street addresses)
 *   2. POI text search with city constraint via /place/text
 *   3. POI text search without city via /place/text (broader)
 */
export async function geocodePlace(
  name: string,
  context: string,
  _centerLat?: number,
  _centerLon?: number,
  city?: string,
  address?: string,
): Promise<{ lat: number; lon: number } | null> {
  const c = city || context;

  // Strategy 1: AI-provided structured address (street address → /geocode/geo)
  if (address) {
    let result = await geocode(address, c);
    if (result) return { lat: result.lat, lon: result.lon };
    await delay(API_DELAY);

    result = await geocode(address);
    if (result) return { lat: result.lat, lon: result.lon };
    await delay(API_DELAY);
  }

  // Strategy 2: POI text search with city constraint
  // (/place/text is designed for POI names, unlike /geocode/geo which expects addresses)
  let pois = await textSearch(name, c);
  if (pois.length > 0) {
    const loc = pois[0].location;
    if (loc && loc.includes(',')) {
      const [lng, lat] = loc.split(',').map(Number);
      if (isFinite(lng) && isFinite(lat)) return { lat, lon: lng };
    }
  }
  await delay(API_DELAY);

  // Strategy 3: POI text search without city (broader search)
  pois = await textSearch(name);
  if (pois.length > 0) {
    const loc = pois[0].location;
    if (loc && loc.includes(',')) {
      const [lng, lat] = loc.split(',').map(Number);
      if (isFinite(lng) && isFinite(lat)) return { lat, lon: lng };
    }
  }

  return null;
}

export async function searchLocations(
  _query: string,
  _opts?: { viewbox?: string; bounded?: boolean },
): Promise<SearchResult[]> {
  return [];
}
