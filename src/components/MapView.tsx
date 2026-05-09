import { useEffect, useCallback, useMemo, useRef } from 'react';
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

function RouteFocusController({ routeStops, hoveredTimeSlot }: {
  routeStops: RouteStop[];
  hoveredTimeSlot: string | null;
}) {
  const map = useMap();
  const prevHovered = useRef<string | null>(null);

  // All-stops bounds for returning on mouse leave
  const allBounds = useMemo(() => {
    if (routeStops.length === 0) return null;
    return L.latLngBounds(routeStops.map((s) => [s.lat, s.lon] as [number, number])).pad(0.15);
  }, [routeStops]);

  useEffect(() => {
    if (hoveredTimeSlot === prevHovered.current || routeStops.length === 0) return;
    prevHovered.current = hoveredTimeSlot;

    if (hoveredTimeSlot) {
      const stops = routeStops.filter((s) => s.timeSlot === hoveredTimeSlot);
      if (stops.length === 0) return;
      if (stops.length === 1) {
        map.flyTo([stops[0].lat, stops[0].lon], 15, { duration: 0.7 });
      } else {
        const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lon] as [number, number]));
        map.flyToBounds(bounds.pad(0.2), { duration: 0.7 });
      }
    } else if (prevHovered.current && allBounds) {
      // Mouse left — return to overview
      map.flyToBounds(allBounds, { duration: 0.8 });
    }
  }, [hoveredTimeSlot, routeStops, map, allBounds]);

  return null;
}

export function MapView({ selectedLocation, itineraryData, hoveredTimeSlot, routeVersion, routeLoading, onLocationSelect }: MapViewProps) {
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
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
              hoveredTimeSlot={hoveredTimeSlot}
            />
          </>
        )}
        {/* Route loading indicator */}
        {routeLoading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] glass-strong rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 animate-fadeInUp">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-teal/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[13px] text-muted font-body">路线加载中...</span>
          </div>
        )}
      </MapContainer>
      <SearchBar onLocationSelect={handleSearchSelect} />
    </div>
  );
}
