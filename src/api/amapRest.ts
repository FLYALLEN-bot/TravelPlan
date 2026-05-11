/**
 * AMap Web Service REST API (服务端 API)。
 * 相比 JS API 2.0 插件更稳定可靠，直接 HTTP GET 返回 JSON。
 *
 * 要求：高德 Key 必须同时开通 "Web服务端" 服务。
 * 控制台：https://console.amap.com/dev/key/app
 */

const KEY = import.meta.env.VITE_AMAP_WS_KEY as string;
const BASE = 'https://restapi.amap.com/v3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputTip {
  id: string;
  name: string;
  district: string;
  adcode: string;
  /** "lng,lat" */
  location: string;
  address: string;
}

export interface PoiItem {
  id: string;
  name: string;
  type: string;
  typecode: string;
  /** "lng,lat" */
  location: string;
  address: string;
  cityname: string;
  adname: string;
  pname: string;
}

interface GeocodeItem {
  formatted_address: string;
  location: string;
  level: string;
}

interface RegeoResult {
  formatted_address: string;
  addressComponent: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseLoc(loc: string): { lat: number; lon: number } | null {
  if (!loc || !loc.includes(',')) return null;
  const [lng, lat] = loc.split(',').map(Number);
  if (isNaN(lng) || isNaN(lat)) return null;
  return { lat, lon: lng };
}

let _wsKeyWarning = false;

async function get<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const qs = new URLSearchParams({ key: KEY, ...params }).toString();
  const url = `${BASE}${path}?${qs}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== '1') {
      if (data.infocode === '10001' && !_wsKeyWarning) {
        _wsKeyWarning = true;
        console.warn(
          '[AMap REST] 请确保高德 Key 已开通 "Web服务端" 服务。\n' +
          '控制台：https://console.amap.com/dev/key/app',
        );
      }
      return null;
    }
    return data as T;
  } catch (err) {
    console.warn('[AMap REST] fetch failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** 输入提示（搜索自动补全） */
export async function inputTips(keyword: string, city?: string): Promise<InputTip[]> {
  const params: Record<string, string> = { keywords: keyword, datatype: 'all' };
  if (city) params.city = city;
  const data = await get<{ tips: InputTip[] }>('/assistant/inputtips', params);
  if (!data?.tips) return [];
  return data.tips.filter((t) => t.location && t.location.includes(','));
}

/** POI 文本搜索 */
export async function textSearch(
  keyword: string,
  city?: string,
  pageSize = 10,
): Promise<PoiItem[]> {
  const params: Record<string, string> = { keywords: keyword, offset: String(pageSize) };
  if (city) {
    params.city = city;
    params.citylimit = 'true';
  }
  const data = await get<{ pois: PoiItem[] }>('/place/text', params);
  return data?.pois || [];
}

/** 正向地理编码：地址 → 坐标 */
export async function geocode(
  address: string,
  city?: string,
): Promise<{ lat: number; lon: number; formattedAddress: string } | null> {
  const params: Record<string, string> = { address };
  if (city) params.city = city;
  const data = await get<{ geocodes: GeocodeItem[] }>('/geocode/geo', params);
  if (!data?.geocodes?.length) return null;
  const g = data.geocodes[0];
  const loc = parseLoc(g.location);
  if (!loc) return null;
  return { ...loc, formattedAddress: g.formatted_address };
}

/** 逆向地理编码：坐标 → 地址 */
export async function regeo(lat: number, lon: number): Promise<string> {
  const data = await get<{ regeocode: RegeoResult }>(
    '/geocode/regeo',
    { location: `${lon},${lat}`, extensions: 'base' },
  );
  return data?.regeocode?.formatted_address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// ---------------------------------------------------------------------------
// POI Photos
// ---------------------------------------------------------------------------

interface PoiPhoto {
  url: string;
  title: string;
}

interface PoiDetail {
  id: string;
  name: string;
  photos?: PoiPhoto[];
}

/**
 * 搜索景点/地标的 POI 图片。
 * 先用 textSearch 找到 POI ID，再用 detail API 拿图片列表。
 * 返回第一张图片 URL，失败返回 null。
 */
export async function searchPoiPhoto(
  spotName: string,
  city?: string,
): Promise<string | null> {
  // Step 1: text search to get POI ID
  const pois = await textSearch(spotName, city, 3);
  if (pois.length === 0) return null;

  // Step 2: get detail for first POI
  const data = await get<{ pois: PoiDetail[] }>(
    '/place/detail',
    { id: pois[0].id, extensions: 'all' },
  );
  if (!data?.pois?.length) return null;

  const photos = data.pois[0].photos;
  if (!photos || photos.length === 0) return null;

  return photos[0].url;
}
