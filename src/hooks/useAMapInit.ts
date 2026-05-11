/**
 * Hook for initializing the AMap instance.
 * Returns the map container ref, map instance, and ready state.
 */

import { useEffect, useRef, useState } from 'react';
import { loadAMap } from '../api/amap';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _amapModule: any = null;
export function getAMap() { return _amapModule; }

export function useAMapInit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: AMapInstance | null = null;

    loadAMap().then((mod) => {
      if (cancelled || !containerRef.current) return;
      _amapModule = mod;
      console.log('[AMap] SDK loaded OK, initializing map...');

      map = new mod.Map(containerRef.current, {
        zoom: 4,
        center: [105, 35],
        mapStyle: 'amap://styles/dark',
        viewMode: '2D',
        resizeEnable: true,
      });

      console.log('[AMap] Map instance created');
      mapRef.current = map;
      setMapReady(true);
    }).catch((err: Error) => {
      console.error('[AMap] init failed:', err.message);
      if (!cancelled) setMapError(err.message || '地图加载失败');
    });

    return () => {
      cancelled = true;
      if (map) { map.destroy(); mapRef.current = null; }
    };
  }, []);

  return { containerRef, mapRef, mapReady, mapError };
}
