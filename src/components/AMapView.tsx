import { useEffect, useRef, useCallback } from 'react';
import { regeo } from '../api/amapRest';
import type { SelectedLocation, MultiDayItinerary, RouteStop, FocusedActivity } from '../types/itinerary';
import { SearchBar } from './SearchBar';
import { useAMapInit, getAMap } from '../hooks/useAMapInit';
import { createStopMarkerSvg, createPinIconSvg, createInfoWindowHtml } from '../utils/mapContent';

interface AMapViewProps {
  selectedLocation: SelectedLocation | null;
  itineraryData: MultiDayItinerary | null;
  focusedTimeSlot: string | null;
  focusedActivity: FocusedActivity | null;
  routeVersion: number;
  routeLoading: boolean;
  activeDayIndex: number;
  onLocationSelect: (location: SelectedLocation) => void;
  onActivityFocus: (focus: FocusedActivity | null) => void;
}

export function AMapView({
  selectedLocation, itineraryData, focusedTimeSlot, focusedActivity,
  routeVersion, routeLoading, activeDayIndex, onLocationSelect, onActivityFocus,
}: AMapViewProps) {
  const { containerRef, mapRef, mapReady, mapError } = useAMapInit();
  const pinMarkerRef = useRef<AMapMarker | null>(null);
  const routePolyRef = useRef<AMapPolyline | null>(null);
  const glowPolyRef = useRef<AMapPolyline | null>(null);
  const stopMarkersRef = useRef<AMapMarker[]>([]);
  const validStopsRef = useRef<RouteStop[]>([]);
  const infoWindowRef = useRef<AMapInfoWindow | null>(null);
  const activeMarkerIdx = useRef(-1);
  const closeHandlerRef = useRef<AbortController | null>(null);

  // Refs for callbacks to avoid closure traps in useEffect with empty deps
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;
  const onActivityFocusRef = useRef(onActivityFocus);
  onActivityFocusRef.current = onActivityFocus;

  // ---- FOCUS STOP MARKER (shared by click handler and sidebar focus) ----
  const focusStopMarker = useCallback((stopIdx: number) => {
    const map = mapRef.current;
    const iw = infoWindowRef.current;
    const marker = stopMarkersRef.current[stopIdx];
    const stop = validStopsRef.current[stopIdx];
    if (!map || !iw || !marker || !stop) return;

    // Cleanup previous close button listener
    closeHandlerRef.current?.abort();

    // zIndex management
    if (activeMarkerIdx.current >= 0 && activeMarkerIdx.current !== stopIdx) {
      const prev = stopMarkersRef.current[activeMarkerIdx.current];
      if (prev) prev.setzIndex(10 + activeMarkerIdx.current);
    }
    marker.setzIndex(999);
    activeMarkerIdx.current = stopIdx;

    // Open InfoWindow
    const uid = `iw-${Date.now()}-${stopIdx}`;
    iw.setContent(createInfoWindowHtml(stop.name, stop.time, stop.transport, uid));
    iw.open(map, [stop.lon, stop.lat]);

    // Center AFTER InfoWindow opens (iw.open triggers map adjustments that override prior centering)
    setTimeout(() => {
      const center: [number, number] = [stop.lon, stop.lat];
      try { map.panTo(center); } catch { /* ignore */ }

      const el = document.getElementById(uid);
      if (!el) return;

      // Bind close button with AbortController for cleanup
      const closeBtn = el.querySelector(`[data-iw-close="${uid}"]`);
      if (closeBtn) {
        const ac = new AbortController();
        closeHandlerRef.current = ac;
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          iw.close();
          if (activeMarkerIdx.current >= 0) {
            const prev = stopMarkersRef.current[activeMarkerIdx.current];
            if (prev) prev.setzIndex(10 + activeMarkerIdx.current);
            activeMarkerIdx.current = -1;
          }
          onActivityFocusRef.current(null);
        }, { signal: ac.signal });
      }
      let p: HTMLElement | null = el as HTMLElement;
      for (let depth = 0; depth < 3 && p; depth++) {
        p.style.zIndex = '9999';
        p = p.parentElement;
        if (!p || p === document.body || p === document.documentElement) break;
        const rect = p.getBoundingClientRect();
        if (rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9) break;
      }
    }, 50);
  }, [mapRef]);

  // ---- MAP CLICK HANDLER ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const handleClick = (e: unknown) => {
      const evt = e as { lnglat: AMapLngLat };
      const lng = evt.lnglat.getLng();
      const lat = evt.lnglat.getLat();

      // Close InfoWindow and reset marker zIndex
      closeHandlerRef.current?.abort();
      if (infoWindowRef.current) { infoWindowRef.current.close(); }
      if (activeMarkerIdx.current >= 0) {
        const prev = stopMarkersRef.current[activeMarkerIdx.current];
        if (prev) prev.setzIndex(10 + activeMarkerIdx.current);
        activeMarkerIdx.current = -1;
      }

      onActivityFocusRef.current(null);
      onLocationSelectRef.current({ lat, lon: lng, displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      regeo(lat, lng).then((addr) => {
        if (addr) onLocationSelectRef.current({ lat, lon: lng, displayName: addr });
      });
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [mapReady, mapRef]);

  // ---- PIN MARKER ----
  useEffect(() => {
    const map = mapRef.current;
    const AM = getAMap();
    if (!map || !mapReady || !AM) return;

    if (pinMarkerRef.current) {
      map.remove(pinMarkerRef.current);
      pinMarkerRef.current = null;
    }

    if (selectedLocation) {
      const icon = new AM.Icon({
        image: 'data:image/svg+xml,' + encodeURIComponent(createPinIconSvg()),
        imageSize: new AM.Size(36, 48),
        size: new AM.Size(36, 48),
      });
      const marker = new AM.Marker({
        position: [selectedLocation.lon, selectedLocation.lat],
        icon,
        anchor: 'bottom-center',
        offset: new AM.Pixel(0, 0),
      });
      marker.setMap(map);
      if (isFinite(selectedLocation.lon) && isFinite(selectedLocation.lat)) {
        try {
          map.setZoomAndCenter(14, [selectedLocation.lon, selectedLocation.lat]);
        } catch (err) {
          console.warn('[AMap] setZoomAndCenter failed:', err);
        }
      }
      pinMarkerRef.current = marker;
    }
  }, [selectedLocation, mapReady, mapRef]);

  // ---- ROUTE STOPS ----
  const drawRoute = useCallback(() => {
    const map = mapRef.current;
    const AM = getAMap();
    if (!map || !mapReady || !AM) return;

    // Clear old
    if (glowPolyRef.current) { map.remove(glowPolyRef.current); glowPolyRef.current = null; }
    if (routePolyRef.current) { map.remove(routePolyRef.current); routePolyRef.current = null; }
    stopMarkersRef.current.forEach((m) => map.remove(m));
    stopMarkersRef.current = [];
    if (infoWindowRef.current) { infoWindowRef.current.close(); infoWindowRef.current = null; }

    const rawStops: RouteStop[] = itineraryData?.days[activeDayIndex]?.routeStops || [];
    const stops = rawStops.filter((s) => isFinite(s.lon) && isFinite(s.lat));
    validStopsRef.current = stops;
    if (stops.length === 0) return;

    const path = stops.map((s) => [s.lon, s.lat] as [number, number]);

    // Glow polyline
    const glow = new AM.Polyline({
      path,
      strokeColor: '#f59e0b',
      strokeWeight: 8,
      strokeOpacity: 0.08,
      lineJoin: 'round',
      lineCap: 'round',
    });
    glow.setMap(map);
    glowPolyRef.current = glow;

    // Dashed route line
    const route = new AM.Polyline({
      path,
      strokeColor: '#f59e0b',
      strokeWeight: 2.5,
      strokeOpacity: 0.5,
      strokeStyle: 'dashed',
      lineJoin: 'round',
      lineCap: 'round',
    });
    route.setMap(map);
    routePolyRef.current = route;

    // Info window
    const iw = new AM.InfoWindow({ offset: new AM.Pixel(0, -8), isCustom: true, zIndex: 9999 });
    infoWindowRef.current = iw;

    // Stop markers
    activeMarkerIdx.current = -1;
    stops.forEach((s, i) => {
      const marker = new AM.Marker({
        position: [s.lon, s.lat],
        content: createStopMarkerSvg(i, s.timeSlot),
        anchor: 'center',
        offset: new AM.Pixel(0, 0),
      });

      marker.on('click', () => focusStopMarker(i));
      marker.setMap(map);
      marker.setzIndex(10 + i);
      stopMarkersRef.current.push(marker);
    });

    if (path.length > 0) {
      try {
        map.setFitView([glow, route, ...stopMarkersRef.current], false, [60, 60, 60, 540], 15);
      } catch (err) {
        console.warn('[AMap] setFitView failed:', err);
      }
    }
  }, [itineraryData, activeDayIndex, mapReady, focusStopMarker, mapRef]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute, routeVersion]);

  // ---- FOCUS TIME SLOT ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !focusedTimeSlot) return;

    const stops: RouteStop[] = itineraryData?.days[activeDayIndex]?.routeStops || [];
    const slotStops = stops.filter(
      (s) => s.timeSlot === focusedTimeSlot && isFinite(s.lon) && isFinite(s.lat),
    );
    if (slotStops.length === 0) return;

    try {
      let cx: number, cy: number;
      if (slotStops.length === 1) {
        cx = slotStops[0].lon;
        cy = slotStops[0].lat;
      } else {
        const lngs = slotStops.map((s) => s.lon);
        const lats = slotStops.map((s) => s.lat);
        cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        cy = (Math.min(...lats) + Math.max(...lats)) / 2;
      }
      if (isFinite(cx!) && isFinite(cy!)) {
        map.setCenter([cx!, cy!]);
      }
    } catch (err) {
      console.warn('[AMap] setCenter failed:', err);
    }
  }, [focusedTimeSlot, itineraryData, activeDayIndex, mapReady, mapRef]);

  // ---- FOCUS ACTIVITY (per-activity from sidebar) ----
  useEffect(() => {
    if (!focusedActivity) return;
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const stops = validStopsRef.current;
    const stopIdx = stops.findIndex(
      (s) => s.timeSlot === focusedActivity.slotKey && s.activityIndex === focusedActivity.activityIndex,
    );
    if (stopIdx < 0) return;

    focusStopMarker(stopIdx);
  }, [focusedActivity, mapReady, focusStopMarker, mapRef]);

  const handleSearchSelect = useCallback(
    (location: SelectedLocation) => { onLocationSelect(location); },
    [onLocationSelect]
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container */}
      <div ref={containerRef} data-map-root style={{ width: '100%', height: '100%', overflow: 'hidden', isolation: 'isolate' }} />

      {/* SDK loading */}
      {!mapReady && !mapError && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#121217', color: '#fafaf9',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
            <svg style={{ width: 48, height: 48, color: '#f59e0b', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            <div>
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fafaf9' }}>地图加载中...</p>
              <p style={{ fontSize: 14, color: '#a1a1aa', marginTop: 6 }}>正在连接高德地图</p>
            </div>
          </div>
        </div>
      )}

      {/* SDK error */}
      {mapError && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#121217',
        }}>
          <div style={{
            background: 'rgba(26,26,36,0.8)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
            padding: '32px 40px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 20, textAlign: 'center', maxWidth: 400,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(251,113,133,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg style={{ width: 28, height: 28, color: '#fb7185' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fafaf9', marginBottom: 8 }}>地图加载失败</p>
              <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>请检查高德 JS API Key 是否正确配置，以及是否已开通"Web端(JS API)"服务</p>
              <p style={{ fontSize: 13, color: '#3f3f4b', marginTop: 8, wordBreak: 'break-all', fontFamily: 'monospace' }}>{mapError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Route loading overlay */}
      {routeLoading && mapReady && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(18,18,23,0.92)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
            padding: '32px 40px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 20,
          }}>
            <svg style={{ width: 48, height: 48, color: '#f59e0b', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fafaf9' }}>路线加载中...</p>
              <p style={{ fontSize: 14, color: '#a1a1aa', marginTop: 6 }}>正在查询地点坐标</p>
            </div>
          </div>
        </div>
      )}

      <SearchBar onLocationSelect={handleSearchSelect} />
    </div>
  );
}
