export interface LatLon {
  lat: number;
  lon: number;
}

export interface SelectedLocation {
  lat: number;
  lon: number;
  displayName: string;
  dayCount?: number;
}

export interface Activity {
  name: string;
  lat?: number;
  lon?: number;
  transport?: string;
  notFound?: boolean;
  /** 城市名，用于提高地理编码精度 */
  city?: string;
  /** 详细地址，AI 产出时优先使用 address 做地理编码 */
  address?: string;
  /** verified=AI确认坐标正确 | unverified=AI不确定，前端展示警告 */
  status?: 'verified' | 'unverified';
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
  /** English keyword for Unsplash photo search (more accurate than Chinese name) */
  searchKeyword?: string;
  lat?: number;
  lon?: number;
  imageUrl?: string;
  city?: string;
  address?: string;
  status?: 'verified' | 'unverified';
}

export interface RouteStop {
  name: string;
  lat: number;
  lon: number;
  time: string;
  timeSlot: string;
  transport: string;
  activityIndex: number;
}

export interface FocusedActivity {
  slotKey: string;
  activityIndex: number;
}

export interface DayPlan {
  dayTitle: string;
  morning: TimeSlotData;
  lunch: TimeSlotData;
  afternoon: TimeSlotData;
  dinner: TimeSlotData;
  evening: TimeSlotData;
  routeStops: RouteStop[];
}

export interface MultiDayItinerary {
  locationName: string;
  days: DayPlan[];
  transportationTips: string[];
  photoSpots: PhotoSpot[];
  trendingNotes: string[];
}

/** Legacy single-day type — a MultiDayItinerary with exactly one day */
export interface ItineraryData extends MultiDayItinerary {
  morning: TimeSlotData;
  lunch: TimeSlotData;
  afternoon: TimeSlotData;
  dinner: TimeSlotData;
  evening: TimeSlotData;
  routeStops: RouteStop[];
}

export type ItineraryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  proposedItinerary?: MultiDayItinerary | null;
}

export interface AppState {
  selectedLocation: SelectedLocation | null;
  itineraryData: MultiDayItinerary | null;
  status: ItineraryStatus;
  error: string | null;
  showConfirm: boolean;
  focusedTimeSlot: string | null;
  focusedActivity: FocusedActivity | null;
  showChat: boolean;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  routeVersion: number;
  routeLoading: boolean;
  activeDayIndex: number;
  dayCount: number;
}

export type AppAction =
  | { type: 'SELECT_LOCATION'; payload: SelectedLocation }
  | { type: 'CANCEL_SELECTION' }
  | { type: 'CONFIRM_LOCATION' }
  | { type: 'SET_ITINERARY'; payload: MultiDayItinerary }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'FOCUS_TIME_SLOT'; payload: string | null }
  | { type: 'FOCUS_ACTIVITY'; payload: FocusedActivity | null }
  | { type: 'TOGGLE_CHAT'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'SET_ROUTE_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_DAY'; payload: number }
  | { type: 'UPDATE_PHOTO_IMAGE'; payload: { index: number; imageUrl: string } }
  | { type: 'SET_DAY_COUNT'; payload: number };

