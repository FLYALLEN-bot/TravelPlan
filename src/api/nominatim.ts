export interface SearchResult {
  lat: number;
  lon: number;
  displayName: string;
}

let lastCallTime = 0;

function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 1100) {
    return new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  return Promise.resolve();
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  await throttle();
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`;
    lastCallTime = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TravelPlanApp/1.0' },
    });
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    return data.display_name || `位置 (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  } catch {
    return `位置 (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  }
}

/**
 * Build a viewbox string ~30km around a center point to bias Nominatim results.
 */
function viewboxAround(lat: number, lon: number): string {
  const d = 0.3; // ~30km
  return `${lon - d},${lat - d},${lon + d},${lat + d}`;
}

/**
 * Haversine distance in km between two lat/lon points.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MAX_GEOCODE_DISTANCE_KM = 80;

/** Pick the first result within MAX_GEOCODE_DISTANCE_KM of center. */
function pickNearby(results: SearchResult[], centerLat: number, centerLon: number): SearchResult | null {
  for (const r of results) {
    if (haversineKm(centerLat, centerLon, r.lat, r.lon) <= MAX_GEOCODE_DISTANCE_KM) {
      return r;
    }
  }
  return null;
}

/**
 * Geocode a place name, biased toward a center coordinate.
 * First tries with city context, then without — but always with viewbox bias.
 */
export async function geocodePlace(
  name: string,
  context: string,
  centerLat: number,
  centerLon: number,
): Promise<{ lat: number; lon: number } | null> {
  const viewbox = viewboxAround(centerLat, centerLon);
  let nearby: SearchResult | null = null;

  // 1. Strict 30km bias with context
  let results = await searchLocations(`${name}, ${context}`, { viewbox, bounded: true });
  nearby = pickNearby(results, centerLat, centerLon);
  if (nearby) return { lat: nearby.lat, lon: nearby.lon };

  // 2. Viewbox bias without strict bound
  results = await searchLocations(`${name}, ${context}`, { viewbox, bounded: false });
  nearby = pickNearby(results, centerLat, centerLon);
  if (nearby) return { lat: nearby.lat, lon: nearby.lon };

  // 3. Global with context
  results = await searchLocations(`${name}, ${context}`);
  nearby = pickNearby(results, centerLat, centerLon);
  if (nearby) return { lat: nearby.lat, lon: nearby.lon };

  // 4. Global, name only
  results = await searchLocations(name);
  nearby = pickNearby(results, centerLat, centerLon);
  if (nearby) return { lat: nearby.lat, lon: nearby.lon };

  // 5. For long compound names, try the trailing segment
  if (name.length > 6) {
    const suffix = name.slice(-4);
    results = await searchLocations(`${suffix}, ${context}`);
    nearby = pickNearby(results, centerLat, centerLon);
    if (nearby) return { lat: nearby.lat, lon: nearby.lon };
  }

  return null;
}

export async function searchLocations(
  query: string,
  opts?: { viewbox?: string; bounded?: boolean },
): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  await throttle();
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=zh`;
    if (opts?.viewbox) {
      url += `&viewbox=${opts.viewbox}`;
      if (opts.bounded) url += '&bounded=1';
    }
    lastCallTime = Date.now();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TravelPlanApp/1.0' },
    });
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.map((item: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  } catch {
    return [];
  }
}
