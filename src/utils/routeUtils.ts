export interface RouteWaypoint {
  lat: number;
  lon: number;
  label: string;
  color: string;
  index: number;
}

const slotColors = ['#f59e0b', '#f43f5e', '#0d9488', '#f97316', '#6366f1'];

/**
 * Generate waypoints in a fan pattern around the center point.
 * Creates a plausible "tour route" visual on the map for the 5 time slots.
 */
export function generateWaypoints(center: [number, number]): RouteWaypoint[] {
  const labels = ['上午', '午餐', '下午', '晚餐', '晚间'];

  // Fan pattern: spread waypoints in different directions and distances
  const offsets: [number, number][] = [
    [ 0.007,  0.005],  // morning — NE
    [-0.004,  0.007],  // lunch — SE
    [-0.008, -0.004],  // afternoon — SW
    [ 0.003, -0.008],  // dinner — NW
    [ 0.010,  0.002],  // evening — far E
  ];

  return offsets.map(([dlat, dlon], i) => ({
    lat: center[0] + dlat,
    lon: center[1] + dlon,
    label: labels[i],
    color: slotColors[i],
    index: i + 1,
  }));
}
