/**
 * Photo fetching for itinerary spots.
 * Strategy: AMap POI photos → Unsplash → null (triggers gradient placeholder in UI).
 */

import { searchPoiPhoto } from './amapRest';
import { extractCity } from '../utils/geo';

function getUnsplashKey(): string | null {
  const envKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (envKey) return envKey;
  return null;
}

export function hasUnsplashKey(): boolean {
  return getUnsplashKey() !== null;
}

async function tryUnsplash(accessKey: string, query: string): Promise<string | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.total === 0 || !data.results?.length) return null;
  const idx = Math.floor(Math.random() * Math.min(data.results.length, 5));
  return data.results[idx]?.urls?.regular || null;
}

/**
 * Search for a photo with multi-source fallback:
 * 1. AMap POI photos (best for Chinese locations)
 * 2. Unsplash (as fallback for generic spots)
 * Returns null if no photo found → UI shows gradient placeholder.
 */
export async function searchPhoto(
  locationName: string,
  spotName: string,
  searchKeyword?: string,
): Promise<string | null> {
  const city = extractCity(locationName);

  // ---- Strategy 1: AMap POI photos (native Chinese location data) ----
  // Use city name only (not full locationName) for AMap textSearch city param
  console.log(`[Photo] AMap search: "${spotName}" in "${city}"`);
  const amapUrl = await searchPoiPhoto(spotName, city);
  if (amapUrl) {
    console.log(`[Photo] ✓ AMap found for "${spotName}"`);
    return amapUrl;
  }

  // ---- Strategy 2: Unsplash (English-indexed, needs searchKeyword) ----
  const accessKey = getUnsplashKey();
  if (!accessKey) {
    console.warn(`[Photo] No Unsplash key — no photo for "${spotName}"`);
    return null;
  }

  try {
    let result: string | null = null;

    // searchKeyword is the most specific (e.g., "Hongyadong Chongqing")
    if (searchKeyword) {
      result = await tryUnsplash(accessKey, searchKeyword);
      if (result) return result;
    }

    // Combine spot name with city for better relevance
    result = await tryUnsplash(accessKey, `${spotName} ${city}`);
    if (result) return result;

    // Spot name alone
    result = await tryUnsplash(accessKey, spotName);
    if (result) return result;

    return null;
  } catch (err) {
    console.warn(`[Photo] Unsplash error for "${spotName}":`, err);
    return null;
  }
}

export async function fetchAllPhotoImages(
  locationName: string,
  spots: { name: string; searchKeyword?: string }[],
): Promise<(string | null)[]> {
  const city = extractCity(locationName);
  console.log(`[Photo] fetching ${spots.length} photos for "${city}" (from "${locationName}")`);
  return Promise.all(
    spots.map((spot) => searchPhoto(locationName, spot.name, spot.searchKeyword)),
  );
}
