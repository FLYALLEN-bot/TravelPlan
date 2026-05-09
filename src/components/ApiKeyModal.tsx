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
    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-strong rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-md overflow-hidden animate-scaleIn">

        <div className="p-6 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-soft flex items-center justify-center">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-[17px] text-void tracking-tight">连接 API</h3>
              <p className="text-[12px] text-muted mt-0.5">设置 DeepSeek API Key</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {saved ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="w-10 h-10 rounded-full bg-teal-soft flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-display font-semibold text-[15px] text-teal">API Key 已就绪</span>
            </div>
          ) : (
            <>
              <label className="block text-[12px] font-semibold text-void mb-2 font-body">DeepSeek API Key</label>
              <input
                type="password" value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3.5 glass rounded-xl text-[13px] outline-none transition-all duration-200 font-mono placeholder:text-soft/50
                  focus:bg-white/90 focus:border-teal/30 focus:ring-4 focus:ring-teal/5"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <p className="text-[11px] text-muted mt-3 leading-relaxed">
                Key 仅保存在浏览器本地。
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer"
                  className="text-teal hover:underline underline-offset-2 ml-1 font-medium">获取 API Key →</a>
              </p>
            </>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 glass rounded-2xl text-[13px] font-medium text-muted hover:text-void hover:bg-white/70 transition-all duration-200 cursor-pointer font-body active:scale-[0.98]">
              {saved ? '关闭' : '稍后'}
            </button>
            {!saved && (
              <button onClick={handleSave} disabled={!key.trim()}
                className="flex-[1.3] px-4 py-3 bg-teal hover:bg-teal/90 disabled:bg-black/[0.06] disabled:text-soft/40 rounded-2xl text-[13px] font-semibold text-white transition-all duration-200 cursor-pointer font-body disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(13,148,136,0.2)] active:scale-[0.98]">
                保存并继续
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
