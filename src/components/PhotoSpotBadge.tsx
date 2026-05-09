import type { PhotoSpot } from '../types/itinerary';

interface PhotoSpotBadgeProps { spot: PhotoSpot; index: number; }

export function PhotoSpotBadge({ spot, index }: PhotoSpotBadgeProps) {
  return (
    <div className="animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="glass rounded-xl overflow-hidden hover:shadow-[0_4px_16px_rgba(13,148,136,0.06)] transition-all duration-300">
        <div className="flex">
          <div className="w-1 bg-teal/40 shrink-0" />
          <div className="flex-1 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-teal-soft flex items-center justify-center shrink-0">
                <svg className="w-[18px] h-[18px] text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-teal bg-teal-50 px-1.5 py-0.5 rounded tracking-wider">NO.{index + 1}</span>
                  <h5 className="font-display font-semibold text-[16px] text-void tracking-tight">{spot.name}</h5>
                </div>
              </div>
            </div>
            <p className="text-[14px] text-muted leading-relaxed mb-3 ml-12">{spot.description}</p>
            <div className="ml-12 flex items-start gap-2 px-3 py-2 bg-teal-soft/60 rounded-lg">
              <svg className="w-4 h-4 mt-[2px] shrink-0 text-teal/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[13px] text-teal font-medium italic">{spot.tip}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
