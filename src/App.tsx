import { useReducer, useCallback, useEffect, useState } from 'react';
import { AMapView } from './components/AMapView';
import { ItineraryPanel } from './components/ItineraryPanel';
import { PlaceConfirmDialog } from './components/PlaceConfirmDialog';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InlineChatBar } from './components/InlineChatBar';
import type { AppState, AppAction, SelectedLocation, MultiDayItinerary, ChatMessage, FocusedActivity } from './types/itinerary';
import { generateItinerarySafe, hasApiKey } from './api/anthropic';
import { useItineraryPipeline } from './hooks/useItineraryPipeline';

const initialState: AppState = {
  selectedLocation: null,
  itineraryData: null,
  status: 'idle',
  error: null,
  showConfirm: false,
  focusedTimeSlot: null,
  focusedActivity: null,
  showChat: false,
  chatMessages: [],
  chatLoading: false,
  routeVersion: 0,
  routeLoading: false,
  activeDayIndex: 0,
  dayCount: 1,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_LOCATION':
      return { ...state, selectedLocation: action.payload, showConfirm: true, error: null };
    case 'CANCEL_SELECTION':
      return { ...state, showConfirm: false };
    case 'CONFIRM_LOCATION':
      return { ...state, showConfirm: false, status: 'loading', error: null };
    case 'SET_ITINERARY': {
      const prevSpots = state.itineraryData?.photoSpots;
      const newData = action.payload;
      if (prevSpots && newData.photoSpots) {
        newData.photoSpots = newData.photoSpots.map((spot, i) => {
          const prev = prevSpots[i];
          const sameSpot = prev && prev.name === spot.name;
          return {
            ...spot,
            imageUrl: spot.imageUrl || (sameSpot ? prev.imageUrl : undefined),
          };
        });
      }
      return { ...state, itineraryData: newData, status: 'success', error: null, routeVersion: state.routeVersion + 1, routeLoading: false };
    }
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'RETRY':
      return { ...state, status: 'loading', error: null };
    case 'RESET':
      return { ...initialState, itineraryData: null };
    case 'FOCUS_TIME_SLOT':
      return { ...state, focusedTimeSlot: action.payload };
    case 'FOCUS_ACTIVITY':
      return { ...state, focusedActivity: action.payload };
    case 'TOGGLE_CHAT':
      return { ...state, showChat: action.payload, chatMessages: action.payload ? state.chatMessages : [] };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CHAT_LOADING':
      return { ...state, chatLoading: action.payload };
    case 'SET_ROUTE_LOADING':
      return { ...state, routeLoading: action.payload };
    case 'SET_ACTIVE_DAY': {
      const maxDay = state.itineraryData?.days.length ?? 1;
      const clamped = Math.max(0, Math.min(action.payload, maxDay - 1));
      return { ...state, activeDayIndex: clamped };
    }
    case 'UPDATE_PHOTO_IMAGE': {
      if (!state.itineraryData) return state;
      const newSpots = state.itineraryData.photoSpots.map((s, i) =>
        i === action.payload.index ? { ...s, imageUrl: action.payload.imageUrl } : s
      );
      return { ...state, itineraryData: { ...state.itineraryData, photoSpots: newSpots } };
    }
    case 'SET_DAY_COUNT':
      return { ...state, dayCount: action.payload };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { enrichAndFetch } = useItineraryPipeline(dispatch, state.selectedLocation);

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
        state.selectedLocation.lon,
        state.dayCount,
      );
      dispatch({ type: 'SET_ITINERARY', payload: data });
      enrichAndFetch(data);
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
  }, [state.selectedLocation, state.dayCount, enrichAndFetch]);

  const handleCancel = useCallback(() => dispatch({ type: 'CANCEL_SELECTION' }), []);
  const handleRetry = useCallback(() => { dispatch({ type: 'RETRY' }); handleConfirm(); }, [handleConfirm]);
  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const handleApiKeySet = useCallback(() => setShowApiKeyModal(false), []);
  const handleDayChange = useCallback((dayIndex: number) => dispatch({ type: 'SET_ACTIVE_DAY', payload: dayIndex }), []);
  const handleDayCountChange = useCallback((count: number) => dispatch({ type: 'SET_DAY_COUNT', payload: count }), []);
  const handleTimeSlotFocus = useCallback((timeSlot: string | null) => dispatch({ type: 'FOCUS_TIME_SLOT', payload: timeSlot }), []);
  const handleActivityFocus = useCallback((focus: FocusedActivity | null) => dispatch({ type: 'FOCUS_ACTIVITY', payload: focus }), []);
  const handleToggleChat = useCallback((open: boolean) => dispatch({ type: 'TOGGLE_CHAT', payload: open }), []);
  const handleChatSend = useCallback((msg: ChatMessage) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg }), []);
  const handleChatSetLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_CHAT_LOADING', payload: loading }), []);

  const handleApplyChatItinerary = useCallback((data: MultiDayItinerary) => {
    dispatch({ type: 'TOGGLE_CHAT', payload: false });
    dispatch({ type: 'RETRY' });
    enrichAndFetch(data);
  }, [enrichAndFetch]);

  const day = state.itineraryData?.days[state.activeDayIndex];
  const isMultiDay = (state.itineraryData?.days.length ?? 0) > 1;

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] overflow-hidden">
      {/* Top navigation bar */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{
          height: 52, padding: '0 20px',
          background: 'rgba(18,18,23,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 100,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-amber flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#09090b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className="font-display font-semibold text-[15px] text-void tracking-tight">TravelPlan</span>

          {state.itineraryData && (
            <>
              <span className="w-px h-5 bg-white/[0.06] mx-1" />
              <span className="text-[14px] text-void font-semibold font-body">{state.itineraryData.locationName}</span>
              {day && (
                <span className="text-[12px] text-muted/50 font-body">
                  {isMultiDay ? day.dayTitle : '一日攻略'}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Day tabs */}
          {state.itineraryData && isMultiDay && (
            <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 mr-2">
              {state.itineraryData.days.map((_d, i) => (
                <button key={i} onClick={() => handleDayChange(i)}
                  className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all duration-200 cursor-pointer font-body ${
                    state.activeDayIndex === i
                      ? 'bg-amber text-[#09090b]'
                      : 'text-muted/50 hover:text-void hover:bg-white/[0.04]'
                  }`}
                >
                  第{i + 1}天
                </button>
              ))}
            </div>
          )}

          {state.selectedLocation && state.status === 'success' && (
            <>
              <button onClick={() => handleToggleChat(true)}
                className="flex items-center gap-1.5 text-[12px] text-amber hover:text-amber/80 transition-colors cursor-pointer font-body font-semibold"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '5px 12px' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI
              </button>
              <button onClick={handleReset}
                className="flex items-center gap-1 text-[12px] text-muted/50 hover:text-amber transition-colors cursor-pointer font-body"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重置
              </button>
            </>
          )}
          {state.status === 'success' && (
            <span className="text-[11px] font-semibold text-amber bg-amber/10 px-2.5 py-1 rounded-full tracking-wider uppercase">Ready</span>
          )}
        </div>
      </div>

      {/* Main grid: map | panel */}
      <div className="flex-1 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '1fr 420px' }}>
        {/* Map area */}
        <div className="relative overflow-hidden">
          <AMapView
            selectedLocation={state.selectedLocation}
            itineraryData={state.itineraryData}
            focusedTimeSlot={state.focusedTimeSlot}
            focusedActivity={state.focusedActivity}
            routeVersion={state.routeVersion}
            routeLoading={state.routeLoading}
            activeDayIndex={state.activeDayIndex}
            onLocationSelect={handleLocationSelect}
            onActivityFocus={handleActivityFocus}
          />
        </div>

        {/* Right panel */}
        <div className="flex flex-col overflow-hidden" style={{
          background: 'rgba(14,14,18,0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          isolation: 'isolate',
        }}>
          <div className="flex-1 overflow-y-auto">
            <ItineraryPanel
              itineraryData={state.itineraryData}
              status={state.status}
              error={state.error}
              selectedLocation={state.selectedLocation}
              focusedTimeSlot={state.focusedTimeSlot}
              focusedActivity={state.focusedActivity}
              activeDayIndex={state.activeDayIndex}
              onRetry={handleRetry}
              onReset={handleReset}
              onDayChange={handleDayChange}
              onTimeSlotFocus={handleTimeSlotFocus}
              onActivityFocus={handleActivityFocus}
              onOpenChat={() => handleToggleChat(true)}
            />
          </div>

          {/* Chat bar at bottom of right panel */}
          {state.itineraryData && (
            <div className="shrink-0">
              <InlineChatBar
                itineraryData={state.itineraryData}
                messages={state.chatMessages}
                loading={state.chatLoading}
                expanded={state.showChat}
                onToggle={handleToggleChat}
                onSend={handleChatSend}
                onSetLoading={handleChatSetLoading}
                onApplyItinerary={handleApplyChatItinerary}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {state.showConfirm && state.selectedLocation && (
        <PlaceConfirmDialog
          location={state.selectedLocation}
          dayCount={state.dayCount}
          onDayCountChange={handleDayCountChange}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} onKeySet={handleApiKeySet} />
      )}
    </div>
  );
}
