export interface LatLon {
  lat: number;
  lon: number;
}

export interface SelectedLocation {
  lat: number;
  lon: number;
  displayName: string;
}

export interface Activity {
  name: string;
  lat?: number;
  lon?: number;
  transport?: string;
  notFound?: boolean;
}

export interface TimeSlotData {
  timeRange: string;
  title: string;
  activities: Activity[];
}

export interface PhotoSpot {
  name: string;
  description: string;
  tip: string;
  lat?: number;
  lon?: number;
}

export interface RouteStop {
  name: string;
  lat: number;
  lon: number;
  time: string;
  timeSlot: string;
  transport: string;
}

export interface ItineraryData {
  locationName: string;
  morning: TimeSlotData;
  lunch: TimeSlotData;
  afternoon: TimeSlotData;
  dinner: TimeSlotData;
  evening: TimeSlotData;
  transportationTips: string[];
  photoSpots: PhotoSpot[];
  trendingNotes: string[];
  routeStops: RouteStop[];
}

export type ItineraryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  /** Modified itinerary JSON extracted from assistant response, if any */
  proposedItinerary?: ItineraryData | null;
}

export interface AppState {
  selectedLocation: SelectedLocation | null;
  itineraryData: ItineraryData | null;
  status: ItineraryStatus;
  error: string | null;
  showConfirm: boolean;
  hoveredTimeSlot: string | null;
  focusedTimeSlot: string | null;
  showChat: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  routeVersion: number;
  routeLoading: boolean;
}

export type AppAction =
  | { type: 'SELECT_LOCATION'; payload: SelectedLocation }
  | { type: 'CANCEL_SELECTION' }
  | { type: 'CONFIRM_LOCATION' }
  | { type: 'SET_ITINERARY'; payload: ItineraryData }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'HOVER_TIME_SLOT'; payload: string | null }
  | { type: 'FOCUS_TIME_SLOT'; payload: string | null }
  | { type: 'TOGGLE_CHAT'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'SET_ROUTE_LOADING'; payload: boolean };

export function isValidItinerary(data: unknown): data is ItineraryData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const timeSlotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'];
  for (const key of timeSlotKeys) {
    const slot = d[key];
    if (!slot || typeof slot !== 'object') return false;
    const s = slot as Record<string, unknown>;
    if (typeof s.timeRange !== 'string' || typeof s.title !== 'string' || !Array.isArray(s.activities)) return false;
  }
  if (!Array.isArray(d.transportationTips)) return false;
  if (!Array.isArray(d.photoSpots)) return false;
  if (!Array.isArray(d.trendingNotes)) return false;
  return true;
}
