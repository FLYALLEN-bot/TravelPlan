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
  afternoon: '#2dd4bf',
  dinner: '#f97316',
  evening: '#818cf8',
};

let _idCounter = 0;
function uniqueId() {
  return `wp-${++_idCounter}`;
}

function createStopIcon(color: string, num: number, highlighted: boolean): L.DivIcon {
  const size = highlighted ? 38 : 30;
  const fontSize = highlighted ? 13 : 11;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:2.5px solid #121217;
      box-shadow:0 2px 14px rgba(0,0,0,0.5), 0 0 0 ${highlighted ? 9 : 5}px ${color}24;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:${fontSize}px;font-weight:700;
      font-family:'Noto Sans SC','Inter',system-ui,sans-serif;
      text-shadow:0 1px 3px rgba(0,0,0,0.3);
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
      color: slotColorMap[s.timeSlot] || '#2dd4bf',
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
          color: '#f59e0b',
          weight: 7,
          opacity: 0.08,
          interactive: false,
        }}
      />
      {/* Route line */}
      <Polyline
        positions={routePath}
        pathOptions={{
          color: '#f59e0b',
          weight: 2.5,
          opacity: 0.45,
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
                <div className="font-body text-[13px] min-w-[150px]">
                  <h4 className="font-display font-semibold text-[15px] text-[#fafaf9] mb-1.5">{m.name}</h4>
                  {m.time && (
                    <p className="text-[#a1a1aa] text-[12px] mb-0.5">
                      <span className="font-semibold text-[#fafaf9]/70">时间</span> {m.time}
                    </p>
                  )}
                  {m.transport && (
                    <p className="text-[#a1a1aa] text-[12px]">
                      <span className="font-semibold text-[#fafaf9]/70">交通</span> {m.transport}
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
