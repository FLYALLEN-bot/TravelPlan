/**
 * Encapsulates the shared async pipeline: geocode activities + fetch photos.
 * Used by both handleConfirm (new itinerary) and handleApplyChatItinerary (chat edit).
 */

import { useCallback, useRef, useEffect } from 'react';
import type { MultiDayItinerary, SelectedLocation, AppAction } from '../types/itinerary';
import { enrichItineraryWithCoordinates } from '../utils/enrichItinerary';
import { fetchAllPhotoImages } from '../api/unsplash';

type Dispatch = (action: AppAction) => void;

export function useItineraryPipeline(dispatch: Dispatch, selectedLocation: SelectedLocation | null) {
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /**
   * Enrich itinerary with coordinates and fetch photos in parallel.
   * Race-safe: stale responses are discarded.
   */
  const enrichAndFetch = useCallback(
    (data: MultiDayItinerary) => {
      if (!selectedLocation) return;
      const reqId = ++requestIdRef.current;
      const { lat, lon } = selectedLocation;

      dispatch({ type: 'SET_ROUTE_LOADING', payload: true });

      // Geocoding pipeline
      enrichItineraryWithCoordinates(data, lat, lon)
        .then((enriched) => {
          if (reqId === requestIdRef.current && mountedRef.current) {
            dispatch({ type: 'SET_ITINERARY', payload: enriched });
          }
        })
        .catch((err) => {
          console.warn('[Geocoding] failed:', err);
          // On geocoding failure, still show the un-geocoded data
          if (reqId === requestIdRef.current && mountedRef.current) {
            dispatch({ type: 'SET_ITINERARY', payload: data });
          }
        });

      // Photo fetching pipeline (parallel, independent of geocoding)
      if (data.photoSpots?.length > 0) {
        fetchAllPhotoImages(data.locationName, data.photoSpots)
          .then((imageUrls) => {
            if (reqId === requestIdRef.current && mountedRef.current) {
              imageUrls.forEach((url, i) => {
                if (url) {
                  dispatch({ type: 'UPDATE_PHOTO_IMAGE', payload: { index: i, imageUrl: url } });
                }
              });
            }
          })
          .catch((err) => {
            console.warn('[Unsplash] photo fetch failed:', err);
          });
      }
    },
    [dispatch, selectedLocation],
  );

  return { enrichAndFetch };
}
