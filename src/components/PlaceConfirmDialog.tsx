import type { SelectedLocation } from '../types/itinerary';

interface PlaceConfirmDialogProps {
  location: SelectedLocation;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlaceConfirmDialog({ location, onConfirm, onCancel }: PlaceConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-strong rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-sm overflow-hidden animate-scaleIn">

        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-soft flex items-center justify-center">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-[17px] text-void tracking-tight">确认目的地</h3>
              <p className="text-[12px] text-muted mt-0.5">已在地图上选中此位置</p>
            </div>
          </div>

          <p className="text-[13px] text-void leading-relaxed line-clamp-3 font-medium ml-[52px]">
            {location.displayName}
          </p>
          <p className="text-[11px] text-soft mt-2 ml-[52px] font-mono tracking-tight">
            {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 glass rounded-2xl text-[13px] font-medium text-muted hover:text-void hover:bg-white/70 transition-all duration-200 cursor-pointer font-body active:scale-[0.98]"
          >
            重新选择
          </button>
          <button
            onClick={onConfirm}
            className="flex-[1.3] px-4 py-3 bg-teal hover:bg-teal/90 rounded-2xl text-[13px] font-semibold text-white transition-all duration-200 cursor-pointer font-body flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(13,148,136,0.25)] hover:shadow-[0_4px_16px_rgba(13,148,136,0.3)] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            生成一日攻略
          </button>
        </div>
      </div>
    </div>
  );
}
