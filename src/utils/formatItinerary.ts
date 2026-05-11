import type { MultiDayItinerary, DayPlan, Activity, RouteStop } from '../types/itinerary';
import { isValidMultiDayItinerary } from '../types/itinerary';
import { geocodePlace } from '../api/amapGeocoder';

const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

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
        city: typeof obj.city === 'string' ? obj.city : undefined,
        address: typeof obj.address === 'string' ? obj.address : undefined,
        status: obj.status === 'verified' || obj.status === 'unverified' ? obj.status : undefined,
      };
    }
    return { name: String(a) };
  });
}

function extractRouteStops(data: Record<string, unknown>, timeRanges: Record<string, string>): RouteStop[] {
  const stops: RouteStop[] = [];

  for (const key of slotKeys) {
    const slot = data[key] as Record<string, unknown> | undefined;
    if (!slot || !Array.isArray(slot.activities)) continue;
    const activities = slot.activities as unknown[];
    activities.forEach((a, i) => {
      if (typeof a === 'object' && a !== null) {
        const obj = a as Record<string, unknown>;
        if (typeof obj.lat === 'number' && typeof obj.lon === 'number' && !isNaN(obj.lat) && !isNaN(obj.lon)) {
          stops.push({
            name: String(obj.name || ''),
            lat: obj.lat,
            lon: obj.lon,
            time: timeRanges[key] || '',
            timeSlot: key,
            transport: typeof obj.transport === 'string' ? obj.transport : '',
            activityIndex: i,
          });
        }
      }
    });
  }

  return stops;
}

function normalizeDay(day: Record<string, unknown>): void {
  for (const key of slotKeys) {
    const slot = day[key] as Record<string, unknown> | undefined;
    if (slot && Array.isArray(slot.activities)) {
      slot.activities = normalizeActivities(slot.activities as unknown[]);
    }
  }
  if (!Array.isArray(day.routeStops)) {
    day.routeStops = [];
  }
}

export function parseItineraryResponse(text: string): MultiDayItinerary {
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

  // Handle legacy single-day format (no "days" array)
  if (!Array.isArray(data.days)) {
    const legacyDay: Record<string, unknown> = {};
    for (const key of slotKeys) {
      legacyDay[key] = data[key];
      delete data[key];
    }
    if (Array.isArray(data.routeStops)) {
      legacyDay.routeStops = data.routeStops;
      delete data.routeStops;
    } else {
      legacyDay.routeStops = [];
    }
    legacyDay.dayTitle = '一日行程';
    normalizeDay(legacyDay);
    data.days = [legacyDay];
  } else {
    for (const day of data.days as Record<string, unknown>[]) {
      normalizeDay(day);
    }
  }

  if (!isValidMultiDayItinerary(data)) {
    throw new Error('AI 返回的数据结构不完整，请重试');
  }

  return data as unknown as MultiDayItinerary;
}

/**
 * Geocode each activity's name + photo spots across all days.
 */
export async function enrichItineraryWithCoordinates(
  data: MultiDayItinerary,
  centerLat: number,
  centerLon: number,
): Promise<MultiDayItinerary> {
  const locationName = data.locationName;

  const queue: { dayIndex: number; slotKey: string; index: number; name: string; city?: string; address?: string }[] = [];

  for (let di = 0; di < data.days.length; di++) {
    const day = data.days[di];
    for (const key of slotKeys) {
      const slot = day[key];
      if (!slot) continue;
      slot.activities.forEach((a, i) => {
        if (!a.lat || !a.lon) {
          queue.push({ dayIndex: di, slotKey: key, index: i, name: a.name, city: a.city, address: a.address });
        }
      });
    }
  }

  // Photo spots are shared, use dayIndex: -1
  if (Array.isArray(data.photoSpots)) {
    data.photoSpots.forEach((spot, i) => {
      if (!spot.lat || !spot.lon) {
        queue.push({ dayIndex: -1, slotKey: 'photo', index: i, name: spot.name, city: spot.city, address: spot.address });
      }
    });
  }

  console.log(`[Geocoding] starting ${queue.length} lookups across ${data.days.length} days`);
  let found = 0;
  for (const item of queue) {
    const coords = await geocodePlace(item.name, locationName, centerLat, centerLon, item.city, item.address);
    if (coords) {
      if (item.slotKey === 'photo') {
        data.photoSpots[item.index].lat = coords.lat;
        data.photoSpots[item.index].lon = coords.lon;
      } else {
        const key = item.slotKey as typeof slotKeys[number];
        data.days[item.dayIndex][key].activities[item.index].lat = coords.lat;
        data.days[item.dayIndex][key].activities[item.index].lon = coords.lon;
      }
      found++;
      console.log(`[Geocoding] ✓ ${item.name} → ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
    } else {
      if (item.slotKey !== 'photo') {
        const key = item.slotKey as typeof slotKeys[number];
        data.days[item.dayIndex][key].activities[item.index].notFound = true;
      }
      console.warn(`[Geocoding] ✗ ${item.name} — not found`);
    }
  }
  console.log(`[Geocoding] done: ${found}/${queue.length} found`);

  // Rebuild routeStops per day
  for (const day of data.days) {
    const timeRanges: Record<string, string> = {};
    for (const key of slotKeys) {
      timeRanges[key] = day[key]?.timeRange || '';
    }
    day.routeStops = extractRouteStops(day as unknown as Record<string, unknown>, timeRanges);
  }

  return data;
}

const dayThemes = ['经典路线', '深度探索', '小众体验', '自然风光', '人文历史', '美食之旅', '休闲漫游'];

export function generateFallbackItinerary(locationName: string, dayCount: number = 1): MultiDayItinerary {
  const fallbackActivities = {
    morning: [
      { name: `${locationName}标志性景点`, transport: '地铁', status: 'unverified' as const },
      { name: '周边特色街区', transport: '步行', status: 'unverified' as const },
      { name: '当地人气咖啡馆', transport: '步行', status: 'unverified' as const },
    ],
    lunch: [
      { name: '本地人气餐厅', transport: '步行', status: 'unverified' as const },
      { name: '特色美食街', transport: '步行', status: 'unverified' as const },
    ],
    afternoon: [
      { name: '博物馆或文化场馆', transport: '地铁', status: 'unverified' as const },
      { name: '小红书热推打卡点', transport: '步行', status: 'unverified' as const },
      { name: '当地手工艺体验馆', transport: '步行', status: 'unverified' as const },
    ],
    dinner: [
      { name: '评价极佳的本地餐厅', transport: '打车', status: 'unverified' as const },
      { name: '夜市美食摊位', transport: '步行', status: 'unverified' as const },
    ],
    evening: [
      { name: '城市最佳夜景点', transport: '打车', status: 'unverified' as const },
      { name: '特色酒吧或茶馆', transport: '步行', status: 'unverified' as const },
      { name: '夜间特色店铺', transport: '步行', status: 'unverified' as const },
    ],
  };

  const days: DayPlan[] = [];
  for (let d = 0; d < dayCount; d++) {
    days.push({
      dayTitle: dayThemes[d % dayThemes.length],
      morning: { timeRange: '8:00 - 12:00', title: '上午探索', activities: fallbackActivities.morning.map((a) => ({ ...a })) },
      lunch: { timeRange: '12:00 - 13:30', title: '午餐时光', activities: fallbackActivities.lunch.map((a) => ({ ...a })) },
      afternoon: { timeRange: '13:30 - 17:00', title: '下午深度游', activities: fallbackActivities.afternoon.map((a) => ({ ...a })) },
      dinner: { timeRange: '17:30 - 19:00', title: '晚餐推荐', activities: fallbackActivities.dinner.map((a) => ({ ...a })) },
      evening: { timeRange: '19:00 - 22:00', title: '晚间休闲', activities: fallbackActivities.evening.map((a) => ({ ...a })) },
      routeStops: [],
    });
  }

  return {
    locationName,
    days,
    transportationTips: [
      '建议使用地铁/公交等公共交通，方便快捷',
      '下载当地地图离线包，避免网络问题',
      '打车软件提前安装注册',
    ],
    photoSpots: [
      { name: '城市地标', description: '最具代表性的城市景观', tip: '建议清晨或黄昏时分前往，光线最佳', status: 'unverified' as const },
      { name: '隐藏街角', description: '充满当地生活气息的街道', tip: '使用人像模式拍摄，背景虚化效果极佳', status: 'unverified' as const },
    ],
    trendingNotes: [
      '这里是小红书用户热推的目的地，记得提前做好功课',
      '周末人流量较大，建议工作日前往体验更佳',
      '关注当地天气，做好防晒或防雨准备',
    ],
  };
}
