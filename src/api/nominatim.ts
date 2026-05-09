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

  // 1. Strict 30km bias with context
  let results = await searchLocations(`${name}, ${context}`, { viewbox, bounded: true });
  if (results.length > 0) return { lat: results[0].lat, lon: results[0].lon };

  // 2. Viewbox bias without strict bound
  results = await searchLocations(`${name}, ${context}`, { viewbox, bounded: false });
  if (results.length > 0) return { lat: results[0].lat, lon: results[0].lon };

  // 3. Global with context
  results = await searchLocations(`${name}, ${context}`);
  if (results.length > 0) return { lat: results[0].lat, lon: results[0].lon };

  // 4. Global, name only
  results = await searchLocations(name);
  if (results.length > 0) return { lat: results[0].lat, lon: results[0].lon };

  // 5. For long compound names, try the trailing segment (e.g. "鹤鸣茶社" from "人民公园鹤鸣茶社")
  if (name.length > 6) {
    const suffix = name.slice(-4);
    results = await searchLocations(`${suffix}, ${context}`);
    if (results.length > 0) return { lat: results[0].lat, lon: results[0].lon };
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
