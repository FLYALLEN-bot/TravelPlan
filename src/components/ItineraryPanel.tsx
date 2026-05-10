import type { MultiDayItinerary, ItineraryStatus, SelectedLocation } from '../types/itinerary';
import { TimeSlot } from './TimeSlot';
import { PhotoSpotBadge } from './PhotoSpotBadge';
import { ItinerarySkeleton } from './ItinerarySkeleton';
import { ErrorBanner } from './ErrorBanner';

interface ItineraryPanelProps {
  itineraryData: MultiDayItinerary | null;
  status: ItineraryStatus;
  error: string | null;
  selectedLocation: SelectedLocation | null;
  focusedTimeSlot: string | null;
  activeDayIndex: number;
  onRetry: () => void;
  onReset: () => void;
  onDayChange: (dayIndex: number) => void;
  onTimeSlotFocus: (timeSlot: string | null) => void;
  onOpenChat: () => void;
}

const slotColorMap = ['gold', 'terracotta', 'sage', 'rust', 'forest'] as const;
const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;

const timeSlotIcons = {
  morning: (
    <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  lunch: (
    <svg className="w-4 h-4 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  afternoon: (
    <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  dinner: (
    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  evening: (
    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
};

export function ItineraryPanel({
  itineraryData, status, error, selectedLocation, focusedTimeSlot, activeDayIndex,
  onRetry, onReset, onDayChange, onTimeSlotFocus, onOpenChat,
}: ItineraryPanelProps) {
  const renderContent = () => {
    if (status === 'idle' && !itineraryData) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-10">
          <div className="relative mb-10">
            <div className="w-28 h-28 rounded-full bg-amber-soft flex items-center justify-center">
              <svg className="w-14 h-14 text-amber/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="font-display font-semibold text-[30px] text-void mb-4 tracking-tight">探索世界</h3>
          <p className="text-[16px] text-muted leading-relaxed max-w-[300px]">
            在地图上<strong className="text-void font-semibold">点击任意位置</strong>，或搜索目的地，生成旅行攻略
          </p>
        </div>
      );
    }

    if (status === 'loading') return <ItinerarySkeleton />;
    if (status === 'error' && error) return <ErrorBanner message={error} showRetry onRetry={onRetry} />;

    if (itineraryData) {
      const day = itineraryData.days[activeDayIndex];
      const isMultiDay = itineraryData.days.length > 1;

      return (
        <div className="p-8 pb-10 overflow-y-auto h-full scrollbar-thin">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <h3 className="font-display font-bold text-[30px] text-void tracking-tight leading-tight mb-1.5">
              {itineraryData.locationName}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[15px] text-muted font-body">
                {isMultiDay
                  ? `第${activeDayIndex + 1}天 · ${day.dayTitle}`
                  : '一日攻略'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber/25" />
              <span className="text-[15px] text-muted font-body italic">AI 策划</span>
            </div>
          </div>

          {/* Time Slots for active day */}
          <div>
            {slotKeys.map((key, i) => (
              <TimeSlot key={key} data={day[key]} color={slotColorMap[i]} icon={timeSlotIcons[key]} index={i}
                focused={focusedTimeSlot === key}
                onClick={() => onTimeSlotFocus(focusedTimeSlot === key ? null : key)} />
            ))}
          </div>

          {/* Section divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-soft tracking-[0.2em] uppercase font-semibold select-none">Tips</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Transportation */}
          {itineraryData.transportationTips.length > 0 && (
            <div className="mb-6 animate-fadeInUp">
              <h4 className="font-display font-semibold text-[17px] text-void mb-4 flex items-center gap-2.5">
                <svg className="w-5 h-5 text-amber/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                出行贴士
              </h4>
              <div className="glass-card rounded-xl p-5">
                <ul className="space-y-2.5">
                  {itineraryData.transportationTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-muted leading-relaxed">
                      <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-amber/25 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Photo Spots */}
          {itineraryData.photoSpots.length > 0 && (
            <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
              <h4 className="font-display font-semibold text-[17px] text-void mb-4 flex items-center gap-2.5">
                <svg className="w-5 h-5 text-amber/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                打卡推荐
              </h4>
              <div className="space-y-3.5">
                {itineraryData.photoSpots.map((spot, i) => (
                  <PhotoSpotBadge key={i} spot={spot} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Trending Notes */}
          {itineraryData.trendingNotes.length > 0 && (
            <div className="animate-fadeInUp" style={{ animationDelay: '160ms' }}>
              <h4 className="font-display font-semibold text-[17px] text-void mb-4 flex items-center gap-2.5">
                <svg className="w-5 h-5 text-amber/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                热门笔记
              </h4>
              <div className="glass-card rounded-xl p-5">
                <ul className="space-y-3">
                  {itineraryData.trendingNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-muted leading-relaxed">
                      <span className="mt-0.5 text-amber/60 text-[16px] shrink-0">✦</span>
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
    <div className="w-[540px] min-w-[540px] h-full glass-panel border-l border-border shadow-[-8px_0_40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="shrink-0 px-7 py-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-[#09090b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className="font-display font-semibold text-[16px] text-void tracking-tight">TravelPlan</span>
        </div>

        {/* Day tabs */}
        {itineraryData && itineraryData.days.length > 1 && (
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1">
            {itineraryData.days.map((_day, i) => (
              <button
                key={i}
                onClick={() => onDayChange(i)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer font-body whitespace-nowrap ${
                  activeDayIndex === i
                    ? 'bg-amber text-[#09090b] shadow-[0_1px_4px_rgba(245,158,11,0.2)]'
                    : 'text-muted hover:text-void hover:bg-white/[0.04]'
                }`}
              >
                第{i + 1}天
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {selectedLocation && status === 'success' && (
            <>
              <button onClick={onOpenChat}
                className="flex items-center gap-1.5 text-[14px] text-amber hover:text-amber/80 transition-colors cursor-pointer font-body font-semibold">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                AI 修改
              </button>
              <button onClick={onReset}
              className="flex items-center gap-1 text-[14px] text-muted hover:text-amber transition-colors cursor-pointer font-body">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新探索
            </button>
            </>
          )}
          {status === 'success' && (
            <span className="text-[12px] font-semibold text-amber bg-amber-soft px-2.5 py-1 rounded-full tracking-wider uppercase">Ready</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderContent()}
      </div>
    </div>
  );
}
