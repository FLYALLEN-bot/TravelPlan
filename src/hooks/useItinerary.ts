import { useCallback } from 'react';
import type { ItineraryData, SelectedLocation } from '../types/itinerary';
import { generateItinerarySafe, hasApiKey } from '../api/anthropic';

export function useItinerary() {
  const generate = useCallback(async (location: SelectedLocation): Promise<ItineraryData> => {
    if (!hasApiKey()) {
      throw new Error('NO_API_KEY');
    }
    return generateItinerarySafe(location.displayName, location.lat, location.lon);
  }, []);

  return { generate };
}
