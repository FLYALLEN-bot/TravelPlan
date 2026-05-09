import type { ItineraryData, ItineraryStatus, SelectedLocation } from '../types/itinerary';
import { TimeSlot } from './TimeSlot';
import { PhotoSpotBadge } from './PhotoSpotBadge';
import { ItinerarySkeleton } from './ItinerarySkeleton';
import { ErrorBanner } from './ErrorBanner';

interface ItineraryPanelProps {
  itineraryData: ItineraryData | null;
  status: ItineraryStatus;
  error: string | null;
  selectedLocation: SelectedLocation | null;
  hoveredTimeSlot: string | null;
  onRetry: () => void;
  onReset: () => void;
  onTimeSlotHover: (timeSlot: string | null) => void;
  onOpenChat: () => void;
}

const timeSlotIcons = {
  morning: (
    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  lunch: (
    <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  afternoon: (
    <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  dinner: (
    <svg className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  evening: (
    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
};

const slotColorMap = ['gold', 'terracotta', 'sage', 'rust', 'forest'] as const;
const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

export function ItineraryPanel({
  itineraryData, status, error, selectedLocation, hoveredTimeSlot, onRetry, onReset, onTimeSlotHover, onOpenChat,
}: ItineraryPanelProps) {
  const renderContent = () => {
    if (status === 'idle' && !itineraryData) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-teal-soft/80 flex items-center justify-center">
              <svg className="w-12 h-12 text-teal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="font-display font-semibold text-[28px] text-void mb-3 tracking-tight">探索世界</h3>
          <p className="text-[15px] text-muted leading-relaxed max-w-[280px]">
            在地图上<strong className="text-void font-semibold">点击任意位置</strong>，或搜索目的地，生成一日旅行攻略
          </p>
        </div>
      );
    }

    if (status === 'loading') return <ItinerarySkeleton />;
    if (status === 'error' && error) return <ErrorBanner message={error} showRetry onRetry={onRetry} />;

    if (itineraryData) {
      return (
        <div className="p-7 pb-8 overflow-y-auto h-full scrollbar-thin">
          {/* Header */}
          <div className="mb-7 animate-fadeInUp">
            <h3 className="font-display font-bold text-[28px] text-void tracking-tight leading-tight mb-1">
              {itineraryData.locationName}
            </h3>
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] text-muted font-body">一日攻略</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal/30" />
              <span className="text-[14px] text-muted font-body italic">AI 策划</span>
            </div>
          </div>

          {/* Time Slots */}
          <div>
            {slotKeys.map((key, i) => (
              <TimeSlot key={key} data={itineraryData[key]} color={slotColorMap[i]} icon={timeSlotIcons[key]} index={i}
                hovered={hoveredTimeSlot === key}
                onHover={(enter) => onTimeSlotHover(enter ? key : null)} />
            ))}
          </div>

          {/* Section divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-black/[0.04]" />
            <span className="text-[11px] text-soft tracking-[0.2em] uppercase font-semibold select-none">Tips</span>
            <div className="flex-1 h-px bg-black/[0.04]" />
          </div>

          {/* Transportation */}
          {itineraryData.transportationTips.length > 0 && (
            <div className="mb-5 animate-fadeInUp">
              <h4 className="font-display font-semibold text-[16px] text-void mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                出行贴士
              </h4>
              <div className="glass rounded-xl p-4">
                <ul className="space-y-2">
                  {itineraryData.transportationTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-muted leading-relaxed">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-teal/25 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Photo Spots */}
          {itineraryData.photoSpots.length > 0 && (
            <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
              <h4 className="font-display font-semibold text-[16px] text-void mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                打卡推荐
              </h4>
              <div className="space-y-3">
                {itineraryData.photoSpots.map((spot, i) => (
                  <PhotoSpotBadge key={i} spot={spot} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Trending Notes */}
          {itineraryData.trendingNotes.length > 0 && (
            <div className="animate-fadeInUp" style={{ animationDelay: '160ms' }}>
              <h4 className="font-display font-semibold text-[16px] text-void mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                热门笔记
              </h4>
              <div className="glass rounded-xl p-4">
                <ul className="space-y-2.5">
                  {itineraryData.trendingNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px] text-muted leading-relaxed">
                      <span className="mt-0.5 text-teal/70 text-[15px] shrink-0">✦</span>
                      <span className="italic">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="pb-2" />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-[520px] min-w-[520px] h-full glass-strong border-l border-white/40 shadow-[-8px_0_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="shrink-0 px-6 py-4 border-b border-black/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-teal flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className="font-display font-semibold text-[15px] text-void tracking-tight">TravelPlan</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedLocation && status === 'success' && (
            <>
              <button onClick={onOpenChat}
                className="flex items-center gap-1.5 text-[13px] text-teal hover:text-teal/80 transition-colors cursor-pointer font-body font-semibold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI 修改
              </button>
              <button onClick={onReset}
              className="flex items-center gap-1 text-[13px] text-muted hover:text-teal transition-colors cursor-pointer font-body">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新探索
            </button>
            </>
          )}
          {status === 'success' && (
            <span className="text-[11px] font-semibold text-teal bg-teal-50 px-2.5 py-0.5 rounded-full tracking-wider uppercase">Ready</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderContent()}
      </div>
    </div>
  );
}
