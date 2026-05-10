export function ItinerarySkeleton() {
  return (
    <div className="p-8">
      {/* Title */}
      <div className="mb-8 animate-pulse">
        <div className="h-9 w-56 bg-white/[0.04] rounded-md mb-2.5" />
        <div className="h-4.5 w-36 bg-white/[0.03] rounded-md" />
      </div>

      {/* Timeline slots */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-fadeInUp" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex gap-0">
            <div className="relative flex flex-col items-center mr-5 shrink-0">
              <div className="w-[11px] h-[11px] rounded-full bg-white/[0.06] animate-pulse z-10" />
              <div className="w-px flex-1 border-l border-border -mt-0.5" />
            </div>
            <div className="flex-1 pb-5 min-w-0">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] animate-pulse" />
                  <div className="h-5.5 w-28 rounded-full bg-white/[0.04] animate-pulse" />
                </div>
                <div className="h-5.5 w-40 bg-white/[0.04] rounded-md animate-pulse mb-3.5" />
                <div className="space-y-2.5">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-4 bg-white/[0.03] rounded-md animate-pulse" style={{ width: `${90 - j * 10}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-center py-8 gap-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber/40 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-amber/40 animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-amber/40 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[14px] text-muted font-body italic">AI 正在规划...</span>
      </div>
    </div>
  );
}
