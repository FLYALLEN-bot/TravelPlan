import { useMemo } from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { RouteStop } from '../types/itinerary';

interface RouteOverlayProps {
  routeStops: RouteStop[];
  hoveredTimeSlot: string | null;
}

const slotColorMap: Record<string, string> = {
  morning: '#f59e0b',
  lunch: '#f43f5e',
  afternoon: '#0d9488',
  dinner: '#f97316',
  evening: '#6366f1',
  photo: '#ec4899',
};

let _idCounter = 0;
function uniqueId() {
  return `wp-${++_idCounter}`;
}

function createStopIcon(color: string, num: number, highlighted: boolean): L.DivIcon {
  const size = highlighted ? 36 : 28;
  const fontSize = highlighted ? 13 : 11;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:2.5px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,0.2), 0 0 0 ${highlighted ? 8 : 4}px ${color}28;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:${fontSize}px;font-weight:700;
      font-family:'Inter',system-ui,sans-serif;
      text-shadow:0 1px 2px rgba(0,0,0,0.15);
      transition:all 0.25s ease;
    ">${num}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function RouteOverlay({ routeStops, hoveredTimeSlot }: RouteOverlayProps) {
  if (routeStops.length === 0) return null;

  const routePath: [number, number][] = useMemo(
    () => routeStops.map((s) => [s.lat, s.lon] as [number, number]),
    [routeStops]
  );

  const markers = useMemo(
    () => routeStops.map((s, i) => ({
      key: uniqueId(),
      lat: s.lat,
      lon: s.lon,
      num: i + 1,
      color: slotColorMap[s.timeSlot] || '#0d9488',
      name: s.name,
      time: s.time,
      transport: s.transport,
      timeSlot: s.timeSlot,
    })),
    [routeStops]
  );

  return (
    <>
      {/* Glow line */}
      <Polyline
        positions={routePath}
        pathOptions={{
          color: '#0d9488',
          weight: 6,
          opacity: 0.1,
          interactive: false,
        }}
      />
      {/* Route line */}
      <Polyline
        positions={routePath}
        pathOptions={{
          color: '#0d9488',
          weight: 2.5,
          opacity: 0.5,
          dashArray: '10 6',
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }}
      />
      {/* Markers */}
      {markers.map((m) => {
        const isHighlighted = hoveredTimeSlot !== null && m.timeSlot === hoveredTimeSlot;
        return (
          <Marker
            key={m.key}
            position={[m.lat, m.lon]}
            icon={createStopIcon(m.color, m.num, isHighlighted)}
          >
            {(m.time || m.transport) && (
              <Popup>
                <div className="font-body text-[13px] min-w-[140px]">
                  <h4 className="font-display font-semibold text-[15px] text-void mb-1">{m.name}</h4>
                  {m.time && (
                    <p className="text-muted text-[12px] mb-0.5">
                      <span className="font-semibold text-void/70">时间</span> {m.time}
                    </p>
                  )}
                  {m.transport && (
                    <p className="text-muted text-[12px]">
                      <span className="font-semibold text-void/70">交通</span> {m.transport}
                    </p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
    </>
  );
}
