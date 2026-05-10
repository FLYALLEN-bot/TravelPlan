/**
 * AMap-based geocoding — uses AMap Web Service REST API.
 * All coordinates are [lng, lat] internally, but functions return { lat, lon }.
 */

import { regeo, geocode } from './amapRest';

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
 *   1. address directly (most precise — structured address from AI)
 *   2. address + name
 *   3. city + name (e.g. "北京 故宫博物院")
 *   4. name only
 */
export async function geocodePlace(
  name: string,
  context: string,
  _centerLat?: number,
  _centerLon?: number,
  city?: string,
  address?: string,
): Promise<{ lat: number; lon: number } | null> {
  // Strategy 1: AI-provided detailed address (highest accuracy)
  if (address) {
    let result = await geocode(address, city || context);
    if (result) return { lat: result.lat, lon: result.lon };
    result = await geocode(address);
    if (result) return { lat: result.lat, lon: result.lon };
  }

  // Strategy 2: city + name (e.g. "北京 故宫博物院")
  const c = city || context;
  let result = await geocode(`${c} ${name}`, c);
  if (result) return { lat: result.lat, lon: result.lon };

  // Strategy 3: context + name
  if (city && context !== city) {
    result = await geocode(`${context} ${name}`, context);
    if (result) return { lat: result.lat, lon: result.lon };
  }

  // Strategy 4: name only
  result = await geocode(name);
  if (result) return { lat: result.lat, lon: result.lon };

  return null;
}

export async function searchLocations(
  _query: string,
  _opts?: { viewbox?: string; bounded?: boolean },
): Promise<SearchResult[]> {
  return [];
}
