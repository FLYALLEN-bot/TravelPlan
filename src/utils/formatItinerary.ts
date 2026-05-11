/**
 * Parse and normalize AI-generated itinerary JSON into the app's data model.
 */

import type { MultiDayItinerary, Activity } from '../types/itinerary';
import { isValidMultiDayItinerary } from './validate';

const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

function normalizeActivities(activities: unknown[]): Activity[] {
  return activities
    .map((a): Activity => {
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
    })
    .filter((a) => a.name.trim().length > 0);
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
