// Global AMap type declarations for the AMap JS API 2.0 runtime.
// AMap is injected as window.AMap after the SDK loads.

interface AMapInstance {
  destroy(): void;
  setCenter(center: [number, number]): void;
  setZoomAndCenter(zoom: number, center: [number, number]): void;
  panTo(center: [number, number]): void;
  flyTo(center: [number, number], zoom?: number): void;
  setFitView(overlays?: AMapOverlay[], immediately?: boolean, avoid?: number[], maxZoom?: number): void;
  add(overlay: AMapOverlay | AMapOverlay[]): void;
  remove(overlay: AMapOverlay | AMapOverlay[]): void;
  clearMap(): void;
  on(event: string, handler: (e: unknown) => void): void;
  off(event: string, handler: (e: unknown) => void): void;
  getCenter(): AMapLngLat;
  getZoom(): number;
}

interface AMapLngLat {
  getLng(): number;
  getLat(): number;
  lng: number;
  lat: number;
}

interface AMapOverlay {
  setMap(map: AMapInstance | null): void;
  getMap(): AMapInstance | null;
  on(event: string, handler: (e: unknown) => void): void;
  setExtData(data: unknown): void;
  getExtData(): unknown;
}

interface AMapMarker extends AMapOverlay {
  setLabel(label: { content: string; offset?: AMapPixel; direction?: string }): void;
  setContent(content: string | HTMLElement): void;
  setPosition(pos: AMapLngLat | [number, number]): void;
  getPosition(): AMapLngLat;
  setIcon(icon: AMapIcon): void;
  setzIndex(zIndex: number): void;
  getzIndex(): number;
}

interface AMapPolyline extends AMapOverlay {
  setPath(path: [number, number][]): void;
  getPath(): [number, number][];
}

interface AMapPixel {
  x: number;
  y: number;
}

interface AMapSize {
  width: number;
  height: number;
}

interface AMapIcon {
  getImageSize(): AMapSize;
}

interface AMapInfoWindow {
  open(map: AMapInstance, pos: AMapLngLat | [number, number]): void;
  close(): void;
  setContent(content: string | HTMLElement): void;
}

interface AMapGeocoder {
  getLocation(
    address: string,
    callback?: (status: string, result: { geocodes: { location: AMapLngLat; address: string }[]; info?: string }) => void,
  ): void | Promise<{ geocodes: { location: AMapLngLat; address: string }[] }>;
  getAddress(
    location: [number, number],
    callback?: (status: string, result: { regeocode: { formattedAddress: string }; info?: string }) => void,
  ): void | Promise<{ regeocode: { formattedAddress: string } }>;
}

interface AMapAutoComplete {
  search(
    keyword: string,
    callback: (status: string, result: { tips: AMapTip[] }) => void,
  ): void;
}

interface AMapTip {
  name: string;
  district: string;
  adcode: string;
  location: AMapLngLat;
  id: string;
}

interface AMapPlaceSearch {
  search(
    keyword: string,
    callback: (status: string, result: { poiList: { pois: AMapPoi[] }; info?: string }) => void,
  ): void;
  setCity(city: string): void;
}

interface AMapPoi {
  name: string;
  pname: string;
  cityname: string;
  adname: string;
  address: string;
  location: AMapLngLat;
}

declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, opts?: Record<string, unknown>);
    destroy(): void;
    setCenter(center: [number, number]): void;
    setZoomAndCenter(zoom: number, center: [number, number]): void;
    panTo(center: [number, number]): void;
    flyTo(center: [number, number], zoom?: number): void;
    setFitView(overlays?: AMapOverlay[], immediately?: boolean, avoid?: number[], maxZoom?: number): void;
    add(overlay: AMapOverlay | AMapOverlay[]): void;
    remove(overlay: AMapOverlay | AMapOverlay[]): void;
    clearMap(): void;
    on(event: string, handler: (e: unknown) => void): void;
    off(event: string, handler: (e: unknown) => void): void;
    getCenter(): AMapLngLat;
    getZoom(): number;
  }

  class Geocoder {
    constructor(opts?: Record<string, unknown>);
    getLocation(
      address: string,
      callback?: (status: string, result: { geocodes: { location: AMapLngLat; address: string }[]; info?: string }) => void,
    ): void | Promise<{ geocodes: { location: AMapLngLat; address: string }[] }>;
    getAddress(
      location: [number, number],
      callback?: (status: string, result: { regeocode: { formattedAddress: string }; info?: string }) => void,
    ): void | Promise<{ regeocode: { formattedAddress: string } }>;
  }

  class AutoComplete {
    constructor(opts?: Record<string, unknown>);
    search(
      keyword: string,
      callback: (status: string, result: { tips: AMapTip[] }) => void,
    ): void;
  }

  class PlaceSearch {
    constructor(opts?: Record<string, unknown>);
    search(
      keyword: string,
      callback: (status: string, result: { poiList: { pois: AMapPoi[] }; info?: string }) => void,
    ): void;
    setCity(city: string): void;
  }

  class LngLat {
    constructor(lng: number, lat: number);
    getLng(): number;
    getLat(): number;
    lng: number;
    lat: number;
  }

  class Marker {
    constructor(opts?: Record<string, unknown>);
    setMap(map: AMapInstance | null): void;
    setContent(content: string | HTMLElement): void;
    setPosition(pos: AMapLngLat | [number, number]): void;
    getPosition(): AMapLngLat;
    setzIndex(zIndex: number): void;
    getzIndex(): number;
    on(event: string, handler: (e: unknown) => void): void;
  }

  class Polyline {
    constructor(opts?: Record<string, unknown>);
    setMap(map: AMapInstance | null): void;
    setPath(path: [number, number][]): void;
    getPath(): [number, number][];
  }

  class Pixel {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class Size {
    constructor(w: number, h: number);
    width: number;
    height: number;
  }

  class Icon {
    constructor(opts?: Record<string, unknown>);
    getImageSize(): AMapSize;
  }

  class InfoWindow {
    constructor(opts?: Record<string, unknown>);
    open(map: AMapInstance, pos: AMapLngLat | [number, number]): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }
}
