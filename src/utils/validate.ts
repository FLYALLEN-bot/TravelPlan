/**
 * Runtime validation functions for itinerary data structures.
 * Separated from type declarations to keep types/itinerary.ts as pure types.
 */

import type { MultiDayItinerary, TimeSlotData } from '../types/itinerary';

const timeSlotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

export function isValidMultiDayItinerary(data: unknown): data is MultiDayItinerary {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.locationName !== 'string') return false;
  if (!Array.isArray(d.days) || d.days.length === 0) return false;
  for (const day of d.days) {
    if (!day || typeof day !== 'object') return false;
    const dayObj = day as Record<string, unknown>;
    for (const key of timeSlotKeys) {
      const slot = dayObj[key];
      if (!slot || typeof slot !== 'object') return false;
      const s = slot as Record<string, unknown>;
      if (typeof s.timeRange !== 'string' || typeof s.title !== 'string' || !Array.isArray(s.activities)) return false;
    }
  }
  if (!Array.isArray(d.transportationTips)) return false;
  if (!Array.isArray(d.photoSpots)) return false;
  if (!Array.isArray(d.trendingNotes)) return false;
  return true;
}

export function singleDayItinerary(data: {
  locationName: string;
  morning: TimeSlotData;
  lunch: TimeSlotData;
  afternoon: TimeSlotData;
  dinner: TimeSlotData;
  evening: TimeSlotData;
  transportationTips: string[];
  photoSpots: { name: string; description: string; tip: string; searchKeyword?: string; lat?: number; lon?: number; imageUrl?: string; city?: string; address?: string; status?: 'verified' | 'unverified' }[];
  trendingNotes: string[];
  routeStops?: { name: string; lat: number; lon: number; time: string; timeSlot: string; transport: string; activityIndex: number }[];
}): MultiDayItinerary {
  const { morning, lunch, afternoon, dinner, evening, routeStops, ...shared } = data;
  return {
    ...shared,
    days: [{
      dayTitle: '一日行程',
      morning, lunch, afternoon, dinner, evening,
      routeStops: routeStops || [],
    }],
  };
}
