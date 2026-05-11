/**
 * Enrich itinerary data with coordinates via geocoding.
 * Operates on a shallow copy to avoid mutating the input.
 */

import type { MultiDayItinerary, RouteStop } from '../types/itinerary';
import { extractCity } from './geo';
import { geocodePlace } from '../api/amapGeocoder';

const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

function extractRouteStops(day: MultiDayItinerary['days'][number]): RouteStop[] {
  const stops: RouteStop[] = [];
  for (const key of slotKeys) {
    const slot = day[key];
    if (!slot) continue;
    slot.activities.forEach((a, i) => {
      if (typeof a.lat === 'number' && typeof a.lon === 'number' && isFinite(a.lat) && isFinite(a.lon)) {
        stops.push({
          name: a.name,
          lat: a.lat,
          lon: a.lon,
          time: slot.timeRange || '',
          timeSlot: key,
          transport: a.transport || '',
          activityIndex: i,
        });
      }
    });
  }
  return stops;
}

export async function enrichItineraryWithCoordinates(
  data: MultiDayItinerary,
  centerLat: number,
  centerLon: number,
): Promise<MultiDayItinerary> {
  // Shallow copy so we don't mutate the caller's reference
  const result = {
    ...data,
    days: data.days.map((d) => ({
      ...d,
      morning: { ...d.morning, activities: [...d.morning.activities] },
      lunch: { ...d.lunch, activities: [...d.lunch.activities] },
      afternoon: { ...d.afternoon, activities: [...d.afternoon.activities] },
      dinner: { ...d.dinner, activities: [...d.dinner.activities] },
      evening: { ...d.evening, activities: [...d.evening.activities] },
    })),
    photoSpots: [...data.photoSpots],
  };

  const cityName = extractCity(result.locationName);

  const queue: { dayIndex: number; slotKey: string; index: number; name: string; city?: string; address?: string }[] = [];

  for (let di = 0; di < result.days.length; di++) {
    const day = result.days[di];
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

  if (Array.isArray(result.photoSpots)) {
    result.photoSpots.forEach((spot, i) => {
      if (!spot.lat || !spot.lon) {
        queue.push({ dayIndex: -1, slotKey: 'photo', index: i, name: spot.name, city: spot.city, address: spot.address });
      }
    });
  }

  console.log(`[Geocoding] starting ${queue.length} lookups, city context: "${cityName}"`);
  let found = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      const coords = await geocodePlace(item.name, cityName, centerLat, centerLon, item.city || cityName, item.address);
      if (coords) {
        if (item.slotKey === 'photo') {
          result.photoSpots[item.index].lat = coords.lat;
          result.photoSpots[item.index].lon = coords.lon;
        } else {
          const key = item.slotKey as typeof slotKeys[number];
          result.days[item.dayIndex][key].activities[item.index].lat = coords.lat;
          result.days[item.dayIndex][key].activities[item.index].lon = coords.lon;
        }
        found++;
        console.log(`[Geocoding] ✓ ${item.name} → ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      } else {
        if (item.slotKey !== 'photo') {
          const key = item.slotKey as typeof slotKeys[number];
          result.days[item.dayIndex][key].activities[item.index].notFound = true;
        }
        failed++;
        console.warn(`[Geocoding] ✗ ${item.name} — not found`);
      }
    } catch (err) {
      failed++;
      if (item.slotKey !== 'photo') {
        const key = item.slotKey as typeof slotKeys[number];
        result.days[item.dayIndex][key].activities[item.index].notFound = true;
      }
      console.warn(`[Geocoding] ✗ ${item.name} — error:`, err);
    }
  }
  console.log(`[Geocoding] done: ${found}/${queue.length} found, ${failed} failed`);

  // Rebuild routeStops per day
  for (const day of result.days) {
    day.routeStops = extractRouteStops(day);
  }

  return result;
}
