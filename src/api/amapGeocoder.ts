/**
 * AMap-based geocoding — uses AMap Web Service REST API.
 * All coordinates are [lng, lat] internally, but functions return { lat, lon }.
 */

import { regeo, geocode, textSearch } from './amapRest';
import type { PoiItem } from './amapRest';
import { haversineKm, cityMatches, parseLocation } from '../utils/geo';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const API_DELAY = 150; // ms between AMap API calls to respect QPS limits
const MAX_DISTANCE_KM = 50; // reject geocoding results farther than this from the center

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
 * Pick the best POI from search results: prefer city match, then distance.
 * Returns null if all results are too far from center.
 */
function pickBestPoi(
  pois: PoiItem[],
  expectedCity: string | undefined,
  centerLat: number,
  centerLon: number,
): { lat: number; lon: number } | null {
  const candidates: { lat: number; lon: number; cityHit: boolean; dist: number }[] = [];

  for (const poi of pois) {
    const parsed = parseLocation(poi.location);
    if (!parsed) continue;
    const dist = haversineKm(centerLat, centerLon, parsed.lat, parsed.lon);
    const cityHit = expectedCity ? cityMatches(expectedCity, poi.cityname || poi.pname) : false;
    candidates.push({ ...parsed, cityHit, dist });
  }

  if (candidates.length === 0) return null;

  // Prefer: city match + within range > city match (any distance) > closest within range > closest overall
  candidates.sort((a, b) => {
    // First: city match beats non-match
    if (a.cityHit !== b.cityHit) return a.cityHit ? -1 : 1;
    // Second: prefer within range
    const aInRange = a.dist <= MAX_DISTANCE_KM;
    const bInRange = b.dist <= MAX_DISTANCE_KM;
    if (aInRange !== bInRange) return aInRange ? -1 : 1;
    // Third: closer is better
    return a.dist - b.dist;
  });

  const best = candidates[0];
  // Reject if too far and no city match
  if (best.dist > MAX_DISTANCE_KM && !best.cityHit) {
    console.warn(`[Geocoding] rejected: ${best.lat.toFixed(4)},${best.lon.toFixed(4)} — ${best.dist.toFixed(0)}km from center, no city match`);
    return null;
  }

  return { lat: best.lat, lon: best.lon };
}

/**
 * Geocode a place name with optional city/address hints.
 * Strategies (tried in order):
 *   1. AI-provided structured address via /geocode/geo (most accurate for street addresses)
 *   2. POI text search with city constraint via /place/text (citylimit=true)
 *   3. POI text search without city via /place/text (broader, validates by distance)
 */
export async function geocodePlace(
  name: string,
  context: string,
  centerLat: number,
  centerLon: number,
  city?: string,
  address?: string,
): Promise<{ lat: number; lon: number } | null> {
  const c = city || context;

  // Strategy 1: AI-provided structured address (street address → /geocode/geo)
  if (address) {
    let result = await geocode(address, c);
    if (result && haversineKm(centerLat, centerLon, result.lat, result.lon) <= MAX_DISTANCE_KM) {
      return { lat: result.lat, lon: result.lon };
    }
    await delay(API_DELAY);

    result = await geocode(address);
    if (result && haversineKm(centerLat, centerLon, result.lat, result.lon) <= MAX_DISTANCE_KM) {
      return { lat: result.lat, lon: result.lon };
    }
    await delay(API_DELAY);
  }

  // Strategy 2: POI text search with city constraint (citylimit=true)
  let pois = await textSearch(name, c);
  if (pois.length > 0) {
    const best = pickBestPoi(pois, c, centerLat, centerLon);
    if (best) return best;
  }
  await delay(API_DELAY);

  // Strategy 3: POI text search without city (broader search)
  pois = await textSearch(name);
  if (pois.length > 0) {
    const best = pickBestPoi(pois, c, centerLat, centerLon);
    if (best) return best;
  }

  return null;
}

export async function searchLocations(
  _query: string,
  _opts?: { viewbox?: string; bounded?: boolean },
): Promise<SearchResult[]> {
  return [];
}
