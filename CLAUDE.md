# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**重要：所有回复必须使用中文。**

## Commands

```bash
npm run dev       # Start dev server (Vite HMR on localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
```

Use `cmd /c "npm run dev"` in PowerShell if execution policy blocks npm.

## Architecture

TravelPlan is a React 19 + TypeScript + Vite single-page app that generates one-day travel itineraries. User clicks a map → DeepSeek AI generates a Xiaohongshu-style itinerary → right panel shows time slots, photo spots, and tips → map renders the route with numbered markers.

**Stack**: React 19, Leaflet (react-leaflet v5), Tailwind CSS 4 (CSS-based config via `@theme`), DeepSeek API (OpenAI-compatible fetch), Nominatim (free geocoding).

### Data flow

```
Map click / Search select
  → reverseGeocode (Nominatim) to get display name
  → PlaceConfirmDialog asks user to confirm
  → DeepSeek API call (system prompt: Xiaohongshu travel expert)
  → parse JSON response → validate structure
  → dispatch SET_ITINERARY (panel shown immediately, no coords yet)
  → enrichItineraryWithCoordinates (Nominatim geocode each activity name)
  → dispatch SET_ITINERARY again (map updates with real route stops)
```

All shared state lives in `App.tsx` via `useReducer`. The reducer handles location selection, confirmation, API loading/error/success, time slot hover, and reset.

### Key TypeScript requirement

`tsconfig.app.json` has `verbatimModuleSyntax: true` — **all type-only imports must use `import type`** or they will fail the build. Write `import type { Foo } from './bar'` not `import { Foo } from './bar'` for types.

### API layer

- `src/api/anthropic.ts` — despite the filename, calls DeepSeek API (`api.deepseek.com/chat/completions`) with `response_format: { type: "json_object" }`. API key from `VITE_DEEPSEEK_API_KEY` env var or `localStorage('deepseek_api_key')`. If API fails with auth error, throws `NO_API_KEY` to trigger the setup modal; all other errors fall back to `generateFallbackItinerary`.
- `src/api/nominatim.ts` — free OpenStreetMap geocoding (reverse + forward search + single-place geocode). **Rate limit: 1 req/s enforced by throttle**. All functions catch errors silently and return empty/fallback results.

### The geocoding pipeline

The AI does NOT produce coordinates (LLMs hallucinate lat/lon). Instead:
1. AI returns place names only (e.g., "故宫博物院", "四季民福烤鸭店")
2. `enrichItineraryWithCoordinates` in `formatItinerary.ts` geocodes each name via Nominatim, sequentially
3. Activities that resolve get real `lat`/`lon`; those that don't are skipped
4. `routeStops` are rebuilt from activities that have coordinates

If no routeStops are found, `RouteOverlay` returns null (no synthetic fallback waypoints).

### Map components

- `MapView.tsx` — Leaflet container with CartoDB light tiles. Contains three sub-controllers:
  - `MapClickHandler` — captures click events for reverse geocoding
  - `MapController` — flies to selected location on selection change
  - `RouteFocusController` — flies to time-slot-specific stops on sidebar hover
- `RouteOverlay.tsx` — renders Polyline (teal dashed + glow) and numbered Marker circles with Popup info windows. Markers scale up when their time slot is hovered in the sidebar.
- `SearchBar.tsx` — floating search bar with autocomplete dropdown, debounced at 400ms

### Sidebar panel

`ItineraryPanel.tsx` renders five `TimeSlot` cards (morning, lunch, afternoon, dinner, evening) in a vertical timeline layout, plus transportation tips, photo spots, and trending notes sections. Each `TimeSlot` has `onMouseEnter`/`onMouseLeave` that dispatch `HOVER_TIME_SLOT` to highlight the corresponding map markers.

### Design system (Tailwind CSS 4)

Defined in `src/index.css` via `@theme`:
- Colors: `void` (#18181b), `muted` (#71717a), `teal` (#0d9488), `teal-soft` (#f0fdfa), `ice` (#f8f9fa)
- Fonts: `font-display` (Playfair Display), `font-body` (Inter)
- Three glass utilities: `.glass` (62% opacity, blur-20), `.glass-strong` (78%, blur-28), `.glass-subtle` (40%, blur-14)
- Custom animations: `fadeInUp`, `fadeIn`, `scaleIn`
- Waypoint marker pulse animation in CSS

Leaflet zoom controls are restyled in CSS to match the glass aesthetic.
