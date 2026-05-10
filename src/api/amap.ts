/**
 * Singleton loader for AMap JS API 2.0 — map display only.
 * Search / geocoding / reverse geocoding all use the REST API (amapRest.ts).
 */

import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = import.meta.env.VITE_AMAP_JS_KEY as string;

let _promise: Promise<typeof AMap> | null = null;

export function loadAMap(): Promise<typeof AMap> {
  if (_promise) return _promise;

  _promise = AMapLoader.load({
    key: AMAP_KEY,
    version: '2.0',
    plugins: [], // 搜索/地理编码已改用服务端 REST API，无需插件
  }).catch((err: Error) => {
    _promise = null;
    console.error('[AMap] failed to load:', err);
    throw err;
  });

  return _promise;
}
