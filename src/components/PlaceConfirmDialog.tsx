import type { SelectedLocation } from '../types/itinerary';

interface PlaceConfirmDialogProps {
  location: SelectedLocation;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlaceConfirmDialog({ location, onConfirm, onCancel }: PlaceConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] w-full max-w-sm overflow-hidden animate-scaleIn border-[rgba(255,255,255,0.08)]">

        <div className="p-7 pb-4">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-xl bg-amber-soft flex items-center justify-center">
              <svg className="w-5.5 h-5.5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-[18px] text-void tracking-tight">确认目的地</h3>
              <p className="text-[13px] text-muted mt-0.5">已在地图上选中此位置</p>
            </div>
          </div>

          <p className="text-[14px] text-void leading-relaxed line-clamp-3 font-medium ml-[55px]">
            {location.displayName}
          </p>
          <p className="text-[12px] text-soft mt-2.5 ml-[55px] font-mono tracking-tight">
            {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          </p>
        </div>

        <div className="px-7 pb-7 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3.5 glass-card rounded-2xl text-[14px] font-medium text-muted hover:text-void hover:bg-white/[0.06] transition-all duration-200 cursor-pointer font-body active:scale-[0.98]"
          >
            重新选择
          </button>
          <button
            onClick={onConfirm}
            className="flex-[1.3] px-5 py-3.5 bg-amber hover:bg-amber/90 rounded-2xl text-[14px] font-semibold text-[#09090b] transition-all duration-200 cursor-pointer font-body flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-[0.98]"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            生成一日攻略
          </button>
        </div>
      </div>
    </div>
  );
}
