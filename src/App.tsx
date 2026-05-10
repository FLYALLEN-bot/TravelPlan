import { useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { MapView } from './components/MapView';
import { ItineraryPanel } from './components/ItineraryPanel';
import { PlaceConfirmDialog } from './components/PlaceConfirmDialog';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InlineChatBar } from './components/InlineChatBar';
import type { AppState, AppAction, SelectedLocation, ItineraryData, ChatMessage } from './types/itinerary';
import { generateItinerarySafe, hasApiKey } from './api/anthropic';
import { enrichItineraryWithCoordinates } from './utils/formatItinerary';

const initialState: AppState = {
  selectedLocation: null,
  itineraryData: null,
  status: 'idle',
  error: null,
  showConfirm: false,
  hoveredTimeSlot: null,
  focusedTimeSlot: null,
  showChat: false,
  chatMessages: [],
  chatLoading: false,
  routeVersion: 0,
  routeLoading: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_LOCATION':
      return { ...state, selectedLocation: action.payload, showConfirm: true, error: null };
    case 'CANCEL_SELECTION':
      return { ...state, showConfirm: false };
    case 'CONFIRM_LOCATION':
      return { ...state, showConfirm: false, status: 'loading', error: null };
    case 'SET_ITINERARY':
      return { ...state, itineraryData: action.payload, status: 'success', error: null, routeVersion: state.routeVersion + 1, routeLoading: false };
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'RETRY':
      return { ...state, status: 'loading', error: null };
    case 'RESET':
      return { ...initialState, itineraryData: null };
    case 'HOVER_TIME_SLOT':
      return { ...state, hoveredTimeSlot: action.payload };
    case 'FOCUS_TIME_SLOT':
      return { ...state, focusedTimeSlot: action.payload };
    case 'TOGGLE_CHAT':
      return { ...state, showChat: action.payload, chatMessages: action.payload ? state.chatMessages : [] };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CHAT_LOADING':
      return { ...state, chatLoading: action.payload };
    case 'SET_ROUTE_LOADING':
      return { ...state, routeLoading: action.payload };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!hasApiKey()) setShowApiKeyModal(true);
  }, []);

  const handleLocationSelect = useCallback((location: SelectedLocation) => {
    dispatch({ type: 'SELECT_LOCATION', payload: location });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!state.selectedLocation) return;
    dispatch({ type: 'CONFIRM_LOCATION' });

    try {
      const data = await generateItinerarySafe(
        state.selectedLocation.displayName,
        state.selectedLocation.lat,
        state.selectedLocation.lon
      );
      dispatch({ type: 'SET_ITINERARY', payload: { ...data, routeStops: [...(data.routeStops || [])] } });
      dispatch({ type: 'SET_ROUTE_LOADING', payload: true });

      const { lat, lon } = state.selectedLocation;
      enrichItineraryWithCoordinates(data, lat, lon).then((enriched) => {
        if (mountedRef.current) {
          dispatch({ type: 'SET_ITINERARY', payload: { ...enriched, routeStops: [...enriched.routeStops] } });
        }
      }).catch((err) => {
        console.warn('[Geocoding] failed:', err);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NO_API_KEY') {
        setShowApiKeyModal(true);
        dispatch({ type: 'SET_ERROR', payload: '请先设置 DeepSeek API Key' });
      } else if (msg.includes('401') || msg.includes('invalid') || msg.includes('Authentication')) {
        setShowApiKeyModal(true);
        dispatch({ type: 'SET_ERROR', payload: 'API Key 无效或已过期，请重新设置' });
      } else {
        dispatch({ type: 'SET_ERROR', payload: msg || '生成失败，请重试' });
      }
    }
  }, [state.selectedLocation]);

  const handleCancel = useCallback(() => dispatch({ type: 'CANCEL_SELECTION' }), []);
  const handleRetry = useCallback(() => { dispatch({ type: 'RETRY' }); handleConfirm(); }, [handleConfirm]);
  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const handleApiKeySet = useCallback(() => setShowApiKeyModal(false), []);
  const handleTimeSlotHover = useCallback((timeSlot: string | null) => {
    dispatch({ type: 'HOVER_TIME_SLOT', payload: timeSlot });
  }, []);
  const handleTimeSlotFocus = useCallback((timeSlot: string | null) => {
    dispatch({ type: 'FOCUS_TIME_SLOT', payload: timeSlot });
  }, []);

  const handleToggleChat = useCallback((open: boolean) => {
    dispatch({ type: 'TOGGLE_CHAT', payload: open });
  }, []);

  const handleChatSend = useCallback((msg: ChatMessage) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg });
  }, []);

  const handleChatSetLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_CHAT_LOADING', payload: loading });
  }, []);

  const handleApplyChatItinerary = useCallback((data: ItineraryData) => {
    if (!state.selectedLocation) return;
    dispatch({ type: 'TOGGLE_CHAT', payload: false });
    dispatch({ type: 'RETRY' });
    dispatch({ type: 'SET_ROUTE_LOADING', payload: true });

    const { lat, lon } = state.selectedLocation;
    enrichItineraryWithCoordinates(data, lat, lon).then((enriched) => {
      if (mountedRef.current) {
        dispatch({ type: 'SET_ITINERARY', payload: { ...enriched, routeStops: [...enriched.routeStops] } });
      }
    }).catch((err) => {
      console.warn('[Geocoding] failed:', err);
      if (mountedRef.current) {
        dispatch({ type: 'SET_ITINERARY', payload: { ...data, routeStops: [] } });
      }
    });
  }, [state.selectedLocation]);

  return (
    <div className="flex h-full w-full bg-[#09090b]">
      {/* Map area with inline chat */}
      <div className="flex-1 min-w-0 relative flex flex-col">
        <div className="flex-1 relative">
          <MapView
            selectedLocation={state.selectedLocation}
            itineraryData={state.itineraryData}
            hoveredTimeSlot={state.hoveredTimeSlot}
            focusedTimeSlot={state.focusedTimeSlot}
            routeVersion={state.routeVersion}
            routeLoading={state.routeLoading}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {/* Inline AI chat bar at bottom of map */}
        {state.itineraryData && (
          <InlineChatBar
            itineraryData={state.itineraryData}
            messages={state.chatMessages}
            loading={state.chatLoading}
            expanded={state.showChat}
            onToggle={(open) => handleToggleChat(open)}
            onSend={handleChatSend}
            onSetLoading={handleChatSetLoading}
            onApplyItinerary={handleApplyChatItinerary}
          />
        )}
      </div>

      <ItineraryPanel
        itineraryData={state.itineraryData}
        status={state.status}
        error={state.error}
        selectedLocation={state.selectedLocation}
        hoveredTimeSlot={state.hoveredTimeSlot}
        onRetry={handleRetry}
        onReset={handleReset}
        onTimeSlotHover={handleTimeSlotHover}
        onTimeSlotFocus={handleTimeSlotFocus}
        onOpenChat={() => handleToggleChat(true)}
      />

      {state.showConfirm && state.selectedLocation && (
        <PlaceConfirmDialog
          location={state.selectedLocation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onKeySet={handleApiKeySet}
        />
      )}
    </div>
  );
}
