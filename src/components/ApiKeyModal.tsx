import { useState } from 'react';

interface ApiKeyModalProps { onClose: () => void; onKeySet: () => void; }

export function ApiKeyModal({ onClose, onKeySet }: ApiKeyModalProps) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem('deepseek_api_key', key.trim());
      setSaved(true);
      setTimeout(() => onKeySet(), 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] w-full max-w-md overflow-hidden animate-scaleIn border-[rgba(255,255,255,0.08)]">

        <div className="p-7 pb-3">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-xl bg-amber-soft flex items-center justify-center">
              <svg className="w-5.5 h-5.5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-[18px] text-void tracking-tight">连接 API</h3>
              <p className="text-[13px] text-muted mt-0.5">设置 DeepSeek API Key</p>
            </div>
          </div>
        </div>

        <div className="px-7 pb-7">
          {saved ? (
            <div className="flex items-center justify-center gap-3.5 py-10">
              <div className="w-11 h-11 rounded-full bg-amber-soft flex items-center justify-center">
                <svg className="w-5.5 h-5.5 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-display font-semibold text-[16px] text-amber">API Key 已就绪</span>
            </div>
          ) : (
            <>
              <label className="block text-[13px] font-semibold text-void mb-2.5 font-body">DeepSeek API Key</label>
              <input
                type="password" value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4.5 py-3.5 glass-input rounded-xl text-[14px] outline-none transition-all duration-200 font-mono placeholder:text-ghost
                  focus:bg-white/[0.08] focus:border-amber/30 focus:ring-4 focus:ring-amber/5"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <p className="text-[12px] text-muted mt-3.5 leading-relaxed">
                Key 仅保存在浏览器本地。
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer"
                  className="text-amber hover:underline underline-offset-2 ml-1 font-medium">获取 API Key →</a>
              </p>
            </>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={onClose}
              className="flex-1 px-4 py-3.5 glass-card rounded-2xl text-[14px] font-medium text-muted hover:text-void hover:bg-white/[0.06] transition-all duration-200 cursor-pointer font-body active:scale-[0.98]">
              {saved ? '关闭' : '稍后'}
            </button>
            {!saved && (
              <button onClick={handleSave} disabled={!key.trim()}
                className="flex-[1.3] px-5 py-3.5 bg-amber hover:bg-amber/90 disabled:bg-white/[0.04] disabled:text-ghost rounded-2xl text-[14px] font-semibold text-[#09090b] transition-all duration-200 cursor-pointer font-body disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(245,158,11,0.15)] active:scale-[0.98]">
                保存并继续
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
