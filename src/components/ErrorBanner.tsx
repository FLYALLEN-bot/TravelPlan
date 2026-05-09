interface ErrorBannerProps {
  message: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function ErrorBanner({ message, showRetry = false, onRetry }: ErrorBannerProps) {
  return (
    <div className="mx-6 mt-8 p-6 glass rounded-2xl animate-scaleIn">
      <div className="flex flex-col items-center text-center">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h4 className="font-display font-semibold text-[17px] text-void mb-1">生成时遇到问题</h4>
        <p className="text-[14px] text-muted leading-relaxed max-w-xs">{message}</p>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 px-6 py-2.5 bg-teal hover:bg-teal/90 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(13,148,136,0.2)] hover:shadow-[0_4px_16px_rgba(13,148,136,0.25)] active:scale-[0.98]"
          >
            重新生成
          </button>
        )}
      </div>
    </div>
  );
}
