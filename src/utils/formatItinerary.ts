import type { ItineraryData, Activity, RouteStop } from '../types/itinerary';
import { isValidItinerary } from '../types/itinerary';
import { geocodePlace } from '../api/nominatim';

function normalizeActivities(activities: unknown[]): Activity[] {
  return activities.map((a) => {
    if (typeof a === 'string') {
      return { name: a };
    }
    if (typeof a === 'object' && a !== null) {
      const obj = a as Record<string, unknown>;
      return {
        name: String(obj.name || ''),
        lat: typeof obj.lat === 'number' ? obj.lat : undefined,
        lon: typeof obj.lon === 'number' ? obj.lon : undefined,
        transport: typeof obj.transport === 'string' ? obj.transport : undefined,
      };
    }
    return { name: String(a) };
  });
}

const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

function extractRouteStops(data: Record<string, unknown>, timeRanges: Record<string, string>): RouteStop[] {
  const stops: RouteStop[] = [];

  // Time-slot activities
  for (const key of slotKeys) {
    const slot = data[key] as Record<string, unknown> | undefined;
    if (!slot || !Array.isArray(slot.activities)) continue;
    const activities = slot.activities as unknown[];
    activities.forEach((a) => {
      if (typeof a === 'object' && a !== null) {
        const obj = a as Record<string, unknown>;
        if (typeof obj.lat === 'number' && typeof obj.lon === 'number') {
          stops.push({
            name: String(obj.name || ''),
            lat: obj.lat,
            lon: obj.lon,
            time: timeRanges[key] || '',
            timeSlot: key,
            transport: typeof obj.transport === 'string' ? obj.transport : '',
          });
        }
      }
    });
  }

  return stops;
}

export function parseItineraryResponse(text: string): ItineraryData {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI 返回的格式无法解析，请重试');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI 返回的数据结构不完整，请重试');
  }

  const data = parsed as Record<string, unknown>;

  // Normalize activities: accept both string[] and Activity[]
  for (const key of slotKeys) {
    const slot = data[key] as Record<string, unknown> | undefined;
    if (slot && Array.isArray(slot.activities)) {
      slot.activities = normalizeActivities(slot.activities as unknown[]);
    }
  }

  // Ensure routeStops exists (will be populated by geocoding)
  if (!Array.isArray(data.routeStops)) {
    data.routeStops = [];
  }

  if (!isValidItinerary(data)) {
    throw new Error('AI 返回的数据结构不完整，请重试');
  }

  return data as unknown as ItineraryData;
}

/**
 * Geocode each activity's name + photo spots to get real coordinates.
 * Runs with Nominatim's 1 req/s throttle.
 */
export async function enrichItineraryWithCoordinates(
  data: ItineraryData,
  centerLat: number,
  centerLon: number,
): Promise<ItineraryData> {
  const locationName = data.locationName;

  // Collect all activities + photo spots that need geocoding
  const queue: { slotKey: string; index: number; name: string }[] = [];

  for (const key of slotKeys) {
    const slot = data[key];
    if (!slot) continue;
    slot.activities.forEach((a, i) => {
      if (!a.lat || !a.lon) {
        queue.push({ slotKey: key, index: i, name: a.name });
      }
    });
  }

  // Also geocode photo spots so they appear on the map
  if (Array.isArray(data.photoSpots)) {
    data.photoSpots.forEach((spot: { name: string; lat?: number; lon?: number }, i: number) => {
      if (!spot.lat || !spot.lon) {
        queue.push({ slotKey: 'photo', index: i, name: spot.name });
      }
    });
  }

  // Geocode sequentially, biased to the selected center point
  console.log(`[Geocoding] starting ${queue.length} lookups around (${centerLat.toFixed(4)}, ${centerLon.toFixed(4)})`);
  let found = 0;
  for (const item of queue) {
    const coords = await geocodePlace(item.name, locationName, centerLat, centerLon);
    if (coords) {
      if (item.slotKey === 'photo') {
        data.photoSpots[item.index].lat = coords.lat;
        data.photoSpots[item.index].lon = coords.lon;
      } else {
        const key = item.slotKey as typeof slotKeys[number];
        data[key].activities[item.index].lat = coords.lat;
        data[key].activities[item.index].lon = coords.lon;
      }
      found++;
      console.log(`[Geocoding] ✓ ${item.name} → ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
    } else {
      if (item.slotKey !== 'photo') {
        const key = item.slotKey as typeof slotKeys[number];
        data[key].activities[item.index].notFound = true;
      }
      console.warn(`[Geocoding] ✗ ${item.name} — not found`);
    }
  }
  console.log(`[Geocoding] done: ${found}/${queue.length} found`);

  // Rebuild routeStops from activities + photo spots that have coordinates
  const timeRanges: Record<string, string> = {};
  for (const key of slotKeys) {
    timeRanges[key] = data[key]?.timeRange || '';
  }

  const newStops = extractRouteStops(data as unknown as Record<string, unknown>, timeRanges);

  if (newStops.length > 0) {
    data.routeStops = newStops;
  }

  return data;
}

export function generateFallbackItinerary(locationName: string): ItineraryData {
  const fallbackActivities = {
    morning: [
      { name: `${locationName}标志性景点`, transport: '地铁' },
      { name: '周边特色街区', transport: '步行' },
      { name: '当地人气咖啡馆', transport: '步行' },
    ],
    lunch: [
      { name: '本地人气餐厅', transport: '步行' },
      { name: '特色美食街', transport: '步行' },
    ],
    afternoon: [
      { name: '博物馆或文化场馆', transport: '地铁' },
      { name: '小红书热推打卡点', transport: '步行' },
      { name: '当地手工艺体验馆', transport: '步行' },
    ],
    dinner: [
      { name: '评价极佳的本地餐厅', transport: '打车' },
      { name: '夜市美食摊位', transport: '步行' },
    ],
    evening: [
      { name: '城市最佳夜景点', transport: '打车' },
      { name: '特色酒吧或茶馆', transport: '步行' },
      { name: '夜间特色店铺', transport: '步行' },
    ],
  };

  return {
    locationName,
    morning: { timeRange: '8:00 - 12:00', title: '上午探索', activities: fallbackActivities.morning },
    lunch: { timeRange: '12:00 - 13:30', title: '午餐时光', activities: fallbackActivities.lunch },
    afternoon: { timeRange: '13:30 - 17:00', title: '下午深度游', activities: fallbackActivities.afternoon },
    dinner: { timeRange: '17:30 - 19:00', title: '晚餐推荐', activities: fallbackActivities.dinner },
    evening: { timeRange: '19:00 - 22:00', title: '晚间休闲', activities: fallbackActivities.evening },
    transportationTips: [
      '建议使用地铁/公交等公共交通，方便快捷',
      '下载当地地图离线包，避免网络问题',
      '打车软件提前安装注册',
    ],
    photoSpots: [
      { name: '城市地标', description: '最具代表性的城市景观', tip: '建议清晨或黄昏时分前往，光线最佳' },
      { name: '隐藏街角', description: '充满当地生活气息的街道', tip: '使用人像模式拍摄，背景虚化效果极佳' },
    ],
    trendingNotes: [
      '这里是小红书用户热推的目的地，记得提前做好功课',
      '周末人流量较大，建议工作日前往体验更佳',
      '关注当地天气，做好防晒或防雨准备',
    ],
    routeStops: [],
  };
}
