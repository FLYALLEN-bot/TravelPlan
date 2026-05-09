export function ItinerarySkeleton() {
  return (
    <div className="p-7">
      {/* Title */}
      <div className="mb-7 animate-pulse">
        <div className="h-8 w-52 bg-black/[0.04] rounded-md mb-2" />
        <div className="h-4 w-32 bg-black/[0.03] rounded-md" />
      </div>

      {/* Timeline slots */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-fadeInUp" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex gap-0">
            <div className="relative flex flex-col items-center mr-5 shrink-0">
              <div className="w-[10px] h-[10px] rounded-full bg-black/[0.06] animate-pulse z-10" />
              <div className="w-px flex-1 border-l border-black/[0.04] -mt-0.5" />
            </div>
            <div className="flex-1 pb-5 min-w-0">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-black/[0.03] animate-pulse" />
                  <div className="h-5 w-24 rounded-full bg-black/[0.04] animate-pulse" />
                </div>
                <div className="h-5 w-36 bg-black/[0.04] rounded-md animate-pulse mb-3" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-3.5 bg-black/[0.03] rounded-md animate-pulse" style={{ width: `${90 - j * 10}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-center py-6 gap-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal/40 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal/40 animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal/40 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[13px] text-muted font-body italic">AI 正在规划...</span>
      </div>
    </div>
  );
}
