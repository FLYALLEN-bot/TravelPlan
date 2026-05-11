import { useState } from 'react';
import type { MultiDayItinerary, ItineraryStatus, SelectedLocation, FocusedActivity } from '../types/itinerary';
import { PhotoSpotBadge } from './PhotoSpotBadge';
import { ItinerarySkeleton } from './ItinerarySkeleton';
import { ErrorBanner } from './ErrorBanner';

interface ItineraryPanelProps {
  itineraryData: MultiDayItinerary | null;
  status: ItineraryStatus;
  error: string | null;
  selectedLocation: SelectedLocation | null;
  focusedTimeSlot: string | null;
  focusedActivity: FocusedActivity | null;
  activeDayIndex: number;
  onRetry: () => void;
  onReset: () => void;
  onDayChange: (dayIndex: number) => void;
  onTimeSlotFocus: (timeSlot: string | null) => void;
  onActivityFocus: (focus: FocusedActivity | null) => void;
  onOpenChat: () => void;
}

const slotKeys = ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const;
const slotLabels: Record<string, string> = { morning: '上午', lunch: '午餐', afternoon: '下午', dinner: '晚餐', evening: '晚间' };
const slotColors: Record<string, string> = { morning: '#f59e0b', lunch: '#f43f5e', afternoon: '#2dd4bf', dinner: '#f97316', evening: '#818cf8' };
const slotIcons: Record<string, string> = { morning: '☀️', lunch: '🍜', afternoon: '🏛️', dinner: '🔥', evening: '🌙' };

export function ItineraryPanel({
  itineraryData, status, error, focusedTimeSlot, focusedActivity, activeDayIndex,
  onRetry, onTimeSlotFocus, onActivityFocus,
}: ItineraryPanelProps) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>('morning');
  const day = itineraryData?.days[activeDayIndex];

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: 'rgba(14,14,18,0.98)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        isolation: 'isolate',
      }}
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: 16 }}>
        {status === 'loading' && <ItinerarySkeleton />}
        {status === 'error' && error && <ErrorBanner message={error} showRetry onRetry={onRetry} />}

        {status === 'idle' && !itineraryData && (
          <div className="flex flex-col items-center justify-center h-full text-center" style={{ padding: 20 }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="rgba(245,158,11,0.3)" strokeWidth={1} style={{ marginBottom: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-display font-semibold text-[18px] text-void mb-1">探索世界</p>
            <p className="text-[13px] text-muted">点击地图或搜索目的地</p>
          </div>
        )}

        {status === 'success' && day && (
          <>
            {/* Accordion time slots */}
            {slotKeys.map((key) => {
              const slot = day[key];
              const color = slotColors[key];
              const isExpanded = expandedSlot === key;
              const isFocused = focusedTimeSlot === key || focusedActivity?.slotKey === key;

              return (
                <div key={key} className="mb-0.5" style={{
                  borderRadius: 10, overflow: 'hidden',
                  background: isFocused ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: `1px solid ${isFocused ? color + '20' : 'transparent'}`,
                  transition: 'all 0.2s',
                }}>
                  {/* Header */}
                  <button
                    onClick={() => {
                      setExpandedSlot(isExpanded ? null : key);
                      onTimeSlotFocus(isFocused ? null : key);
                    }}
                    className="w-full flex items-center gap-2.5 cursor-pointer text-left"
                    style={{ padding: '10px 12px', background: 'transparent', border: 'none' }}
                  >
                    <span className="text-[16px]">{slotIcons[key]}</span>
                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase font-body" style={{ color }}>
                      {slotLabels[key]}
                    </span>
                    <span className="text-[11px] text-muted/40 font-body">{slot.timeRange}</span>
                    <span className="text-[13px] text-void font-semibold font-display ml-auto">{slot.title}</span>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#52525b" strokeWidth={2}
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Body */}
                  {isExpanded && (
                    <div style={{ padding: '0 12px 10px' }}>
                      {slot.activities.map((activity, ai) => {
                        const hasCoords = activity.lat != null && activity.lon != null && !activity.notFound;
                        const isActFocused = focusedActivity?.slotKey === key && focusedActivity?.activityIndex === ai;
                        return (
                          <div key={ai}
                            onClick={hasCoords ? () => {
                              const isSame = focusedActivity?.slotKey === key && focusedActivity?.activityIndex === ai;
                              onActivityFocus(isSame ? null : { slotKey: key, activityIndex: ai });
                            } : undefined}
                            className="flex items-center gap-2 rounded-lg transition-colors"
                            style={{
                              padding: '7px 8px',
                              cursor: hasCoords ? 'pointer' : 'default',
                              background: isActFocused ? 'rgba(245,158,11,0.08)' : 'transparent',
                            }}
                          >
                            {hasCoords ? (
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2} className="shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                            ) : (
                              <span className="shrink-0" style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: activity.notFound ? 'rgba(251,113,133,0.3)' : activity.status === 'unverified' ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.2)',
                              }} />
                            )}
                            <span className="text-[13px] font-body" style={{
                              color: activity.notFound ? '#52525b' : activity.status === 'unverified' ? 'rgba(245,158,11,0.8)' : '#d4d4d8',
                              textDecoration: activity.notFound ? 'line-through' : 'none',
                            }}>
                              {activity.name}
                            </span>
                            {activity.transport && (
                              <span className="text-[11px] text-muted/30 ml-auto font-body">{activity.transport}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 mt-4" style={{
              padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div>
                <p className="text-[11px] text-muted/40 mb-0.5 font-body">打卡点</p>
                <p className="text-[18px] font-bold text-void font-display">{itineraryData?.photoSpots.length ?? 0}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted/40 mb-0.5 font-body">行程天数</p>
                <p className="text-[18px] font-bold text-void font-display">{itineraryData?.days.length ?? 0}</p>
              </div>
            </div>

            {/* Photo spots */}
            {itineraryData?.photoSpots && itineraryData.photoSpots.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[12px] font-semibold text-muted/50 mb-2 font-body tracking-wider uppercase">打卡推荐</h4>
                {itineraryData.photoSpots.map((spot, i) => (
                  <PhotoSpotBadge key={i} spot={spot} index={i} />
                ))}
              </div>
            )}

            {/* Tips */}
            {itineraryData?.transportationTips && itineraryData.transportationTips.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[12px] font-semibold text-muted/50 mb-2 font-body tracking-wider uppercase">出行贴士</h4>
                {itineraryData.transportationTips.map((tip, i) => (
                  <p key={i} className="text-[12px] text-muted/40 leading-relaxed mb-1.5 flex gap-1.5">
                    <span className="text-amber/30 shrink-0">•</span>{tip}
                  </p>
                ))}
              </div>
            )}

            {/* Trending notes */}
            {itineraryData?.trendingNotes && itineraryData.trendingNotes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[12px] font-semibold text-muted/50 mb-2 font-body tracking-wider uppercase">热门笔记</h4>
                {itineraryData.trendingNotes.map((note, i) => (
                  <p key={i} className="text-[12px] text-muted/40 leading-relaxed mb-1.5 italic">
                    <span className="text-amber/40 mr-1.5">✦</span>{note}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
