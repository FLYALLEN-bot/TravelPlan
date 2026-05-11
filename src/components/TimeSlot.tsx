import type { TimeSlotData } from '../types/itinerary';

interface TimeSlotProps {
  data: TimeSlotData;
  color: 'gold' | 'terracotta' | 'sage' | 'rust' | 'forest';
  icon: React.ReactNode;
  index: number;
  focused: boolean;
  focusedActivityIndex?: number | null;
  onClick: () => void;
  onActivityFocus?: (activityIndex: number) => void;
}

const colorMap = {
  gold:        { dot: 'bg-amber',        line: 'border-amber/15',   badge: 'bg-amber-soft text-amber' },
  terracotta:  { dot: 'bg-rose',         line: 'border-rose/15',    badge: 'bg-rose-soft text-rose' },
  sage:        { dot: 'bg-teal',         line: 'border-teal/15',    badge: 'bg-teal-soft text-teal' },
  rust:        { dot: 'bg-orange-500',   line: 'border-orange-500/15', badge: 'bg-orange-500/10 text-orange-400' },
  forest:      { dot: 'bg-indigo-400',   line: 'border-indigo-400/15', badge: 'bg-indigo-400/10 text-indigo-400' },
};

export function TimeSlot({ data, color, icon, index, focused, focusedActivityIndex, onClick, onActivityFocus }: TimeSlotProps) {
  const c = colorMap[color];

  return (
    <div className="animate-fadeInUp" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex gap-0">
        {/* Timeline */}
        <div className="relative flex flex-col items-center mr-5 shrink-0">
          <div className={`w-[11px] h-[11px] rounded-full ${c.dot} ring-2 ring-surface z-10 transition-transform duration-250 ${focused ? 'scale-150' : ''}`} />
          <div className={`w-px flex-1 border-l ${c.line} -mt-0.5`} />
        </div>

        {/* Card */}
        <div className="flex-1 pb-5 min-w-0 cursor-pointer" onClick={onClick}>
          <div className={`glass-card rounded-xl p-5 transition-all duration-250 ${
            focused
              ? 'shadow-[0_4px_24px_rgba(245,158,11,0.15)] border-amber/30 bg-white/[0.04]'
              : 'hover:border-border-glow'
          }`}>
            <div className="flex items-center gap-3 mb-3.5">
              <div className="p-2.5 rounded-lg bg-white/[0.03]">{icon}</div>
              <span className={`text-[13px] font-semibold tracking-[0.12em] uppercase px-3.5 py-1.5 rounded-full ${c.badge}`}>
                {data.timeRange}
              </span>
            </div>
            <h4 className="font-display font-semibold text-[19px] text-void mb-3 tracking-tight">{data.title}</h4>
            <ul className="space-y-2.5">
              {data.activities.map((activity, i) => (
                <li key={i} className={`flex items-start gap-3 text-[16px] leading-relaxed ${
                  activity.notFound ? 'text-ghost' : activity.status === 'unverified' ? 'text-amber/80' : 'text-muted'
                }`}>
                  {/* Activity icon or dot */}
                  {!activity.notFound && activity.lat != null && activity.lon != null ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onActivityFocus?.(i); }}
                      className={`mt-[5px] shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer ${
                        focusedActivityIndex === i
                          ? 'bg-amber/20 text-amber scale-110'
                          : 'text-amber/40 hover:text-amber hover:bg-amber/10'
                      }`}
                      title="在地图上定位"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </button>
                  ) : (
                    <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${
                      activity.notFound ? 'bg-rose/20' : activity.status === 'unverified' ? 'bg-amber/40' : 'bg-amber/25'
                    }`} />
                  )}
                  <span>
                    {activity.name}
                    {activity.notFound && (
                      <span className="text-[13px] text-ghost/70 ml-1.5">（未匹配到该地址）</span>
                    )}
                    {!activity.notFound && activity.status === 'unverified' && (
                      <span className="text-[13px] text-amber/60 ml-1.5" title="AI 对此地址不太确定">（待确认）</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
