interface ErrorBannerProps {
  message: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function ErrorBanner({ message, showRetry = false, onRetry }: ErrorBannerProps) {
  return (
    <div className="mx-8 mt-10 p-7 glass-card rounded-2xl animate-scaleIn border-[rgba(255,255,255,0.05)]">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-soft flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h4 className="font-display font-semibold text-[18px] text-void mb-1.5">生成时遇到问题</h4>
        <p className="text-[15px] text-muted leading-relaxed max-w-xs">{message}</p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-7 py-3 bg-amber hover:bg-amber/90 rounded-xl text-[15px] font-semibold text-[#09090b] transition-all duration-200 cursor-pointer shadow-[0_2px_12px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.2)] active:scale-[0.98]"
          >
            重新生成
          </button>
        )}
      </div>
    </div>
  );
}
