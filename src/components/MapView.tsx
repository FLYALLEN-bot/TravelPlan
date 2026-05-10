import { useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { SelectedLocation, ItineraryData, RouteStop } from '../types/itinerary';
import { reverseGeocode } from '../api/nominatim';
import { createPinIcon } from '../utils/iconFactory';
import { SearchBar } from './SearchBar';
import { RouteOverlay } from './RouteOverlay';

interface MapViewProps {
  selectedLocation: SelectedLocation | null;
  itineraryData: ItineraryData | null;
  hoveredTimeSlot: string | null;
  focusedTimeSlot: string | null;
  routeVersion: number;
  routeLoading: boolean;
  onLocationSelect: (location: SelectedLocation) => void;
}

function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const prevCenter = useRef<string | null>(null);

  useEffect(() => {
    if (center) {
      const key = `${center[0]},${center[1]}`;
      if (key !== prevCenter.current) {
        prevCenter.current = key;
        map.flyTo(center, 14, { duration: 1.6 });
      }
    }
  }, [center, map]);
  return null;
}

function RouteFocusController({ routeStops, focusedTimeSlot }: {
  routeStops: RouteStop[];
  focusedTimeSlot: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusedTimeSlot || routeStops.length === 0) return;

    const stops = routeStops.filter((s) => s.timeSlot === focusedTimeSlot);
    if (stops.length === 0) return;
    if (stops.length === 1) {
      map.flyTo([stops[0].lat, stops[0].lon], 15, { duration: 0.7 });
    } else {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lon] as [number, number]));
      map.flyToBounds(bounds.pad(0.2), { duration: 0.7 });
    }
  }, [focusedTimeSlot, routeStops, map]);

  return null;
}

export function MapView({ selectedLocation, itineraryData, hoveredTimeSlot, focusedTimeSlot, routeVersion, routeLoading, onLocationSelect }: MapViewProps) {
  const handleMapClick = useCallback(
    (latlng: L.LatLng) => {
      const { lat, lng: lon } = latlng;
      // Show dialog instantly with coordinates — resolve the name in background
      onLocationSelect({ lat, lon, displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
      reverseGeocode(lat, lon).then((displayName) => {
        onLocationSelect({ lat, lon, displayName });
      });
    },
    [onLocationSelect]
  );

  const handleSearchSelect = useCallback(
    (location: SelectedLocation) => { onLocationSelect(location); },
    [onLocationSelect]
  );

  const center: [number, number] | null = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lon] : null;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[35, 105]}
        zoom={4}
        className="w-full h-full z-0"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <MapClickHandler onClick={handleMapClick} />
        <MapController center={center} />
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lon]}
            icon={createPinIcon()}
          />
        )}
        {itineraryData && selectedLocation && (
          <>
            <RouteOverlay
              key={`route-v${routeVersion}`}
              routeStops={itineraryData.routeStops || []}
              hoveredTimeSlot={hoveredTimeSlot}
            />
            <RouteFocusController
              routeStops={itineraryData.routeStops || []}
              focusedTimeSlot={focusedTimeSlot}
            />
          </>
        )}
        {/* Route loading indicator — centered on map */}
        {routeLoading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
            <div className="glass-panel rounded-2xl px-10 py-8 shadow-2xl flex flex-col items-center gap-5 animate-scaleIn border-[rgba(255,255,255,0.08)]">
              <svg className="w-12 h-12 text-amber animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              <div className="text-center">
                <p className="text-[18px] font-display font-semibold text-void">路线加载中...</p>
                <p className="text-[14px] text-muted mt-1.5">正在查询地点坐标</p>
              </div>
            </div>
          </div>
        )}
      </MapContainer>
      <SearchBar onLocationSelect={handleSearchSelect} />
    </div>
  );
}
