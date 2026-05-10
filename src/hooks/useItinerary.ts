import { useCallback } from 'react';
import type { MultiDayItinerary, SelectedLocation } from '../types/itinerary';
import { generateItinerarySafe, hasApiKey } from '../api/anthropic';

export function useItinerary() {
  const generate = useCallback(async (location: SelectedLocation, dayCount: number): Promise<MultiDayItinerary> => {
    if (!hasApiKey()) {
      throw new Error('NO_API_KEY');
    }
    return generateItinerarySafe(location.displayName, location.lat, location.lon, dayCount);
  }, []);

  return { generate };
}
