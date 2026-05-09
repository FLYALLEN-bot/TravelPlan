import type { TimeSlotData } from '../types/itinerary';

interface TimeSlotProps {
  data: TimeSlotData;
  color: 'gold' | 'terracotta' | 'sage' | 'rust' | 'forest';
  icon: React.ReactNode;
  index: number;
  hovered: boolean;
  onHover: (enter: boolean) => void;
}

const colorMap = {
  gold:        { dot: 'bg-amber-400',   line: 'border-amber-400/20', badge: 'bg-amber-50 text-amber-700' },
  terracotta:  { dot: 'bg-rose-400',    line: 'border-rose-400/20',  badge: 'bg-rose-50 text-rose-700' },
  sage:        { dot: 'bg-teal',         line: 'border-teal/20',       badge: 'bg-teal-50 text-teal-700' },
  rust:        { dot: 'bg-orange-500',   line: 'border-orange-500/20', badge: 'bg-orange-50 text-orange-700' },
  forest:      { dot: 'bg-indigo-500',   line: 'border-indigo-500/20', badge: 'bg-indigo-50 text-indigo-700' },
};

export function TimeSlot({ data, color, icon, index, hovered, onHover }: TimeSlotProps) {
  const c = colorMap[color];

  return (
    <div className="animate-fadeInUp" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex gap-0">
        {/* Timeline */}
        <div className="relative flex flex-col items-center mr-5 shrink-0">
          <div className={`w-[10px] h-[10px] rounded-full ${c.dot} ring-2 ring-white z-10 transition-transform duration-250 ${hovered ? 'scale-150' : ''}`} />
          <div className={`w-px flex-1 border-l ${c.line} -mt-0.5`} />
        </div>

        {/* Card */}
        <div
          className="flex-1 pb-5 min-w-0 cursor-pointer"
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
        >
          <div className={`glass rounded-xl p-5 transition-all duration-250 ${
            hovered
              ? 'shadow-[0_4px_20px_rgba(13,148,136,0.12)] scale-[1.02] border-teal/25'
              : 'shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-black/[0.02]">{icon}</div>
              <span className={`text-[12px] font-semibold tracking-[0.12em] uppercase px-3 py-1.5 rounded-full ${c.badge}`}>
                {data.timeRange}
              </span>
            </div>
            <h4 className="font-display font-semibold text-[18px] text-void mb-2.5 tracking-tight">{data.title}</h4>
            <ul className="space-y-2">
              {data.activities.map((activity, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] text-muted leading-relaxed">
                  <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-teal/40 shrink-0" />
                  <span>{activity.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
