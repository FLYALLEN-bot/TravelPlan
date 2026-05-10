import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ItineraryData } from '../types/itinerary';
import { chatModifyItinerary } from '../api/anthropic';
import { parseItineraryResponse } from '../utils/formatItinerary';

interface InlineChatBarProps {
  itineraryData: ItineraryData;
  messages: ChatMessage[];
  loading: boolean;
  expanded: boolean;
  onToggle: (open: boolean) => void;
  onSend: (msg: ChatMessage) => void;
  onSetLoading: (loading: boolean) => void;
  onApplyItinerary: (itinerary: ItineraryData) => void;
}

export function InlineChatBar({
  itineraryData, messages, loading, expanded, onToggle, onSend, onSetLoading, onApplyItinerary,
}: InlineChatBarProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', text };
    onSend(userMsg);
    onSetLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      }));

      const clean = { ...itineraryData } as Record<string, unknown>;
      delete clean.routeStops;

      const result = await chatModifyItinerary(clean, text, history);

      let proposedItinerary: ItineraryData | null = null;
      if (result.itinerary) {
        try {
          proposedItinerary = parseItineraryResponse(JSON.stringify(result.itinerary));
        } catch (e) {
          console.warn('[Chat] strict parse failed, merging with current itinerary:', e);
          try {
            const ai = result.itinerary;
            const merged = { ...itineraryData };
            if (typeof ai.locationName === 'string') merged.locationName = ai.locationName;
            for (const key of (['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const)) {
              const aiSlot = ai[key] as Record<string, unknown> | undefined;
              if (aiSlot) {
                if (typeof aiSlot.timeRange === 'string') merged[key].timeRange = aiSlot.timeRange;
                if (typeof aiSlot.title === 'string') merged[key].title = aiSlot.title;
                if (Array.isArray(aiSlot.activities)) {
                  merged[key].activities = aiSlot.activities.map((a: unknown) => {
                    if (typeof a === 'string') return { name: a };
                    if (typeof a === 'object' && a !== null) {
                      const obj = a as Record<string, unknown>;
                      return { name: String(obj.name || ''), transport: typeof obj.transport === 'string' ? obj.transport : undefined };
                    }
                    return { name: String(a) };
                  });
                }
              }
            }
            if (Array.isArray(ai.transportationTips)) merged.transportationTips = ai.transportationTips as string[];
            if (Array.isArray(ai.photoSpots)) merged.photoSpots = ai.photoSpots as typeof merged.photoSpots;
            if (Array.isArray(ai.trendingNotes)) merged.trendingNotes = ai.trendingNotes as string[];
            proposedItinerary = merged;
          } catch {
            console.warn('[Chat] merge also failed, discarding');
          }
        }
      }

      onSend({ role: 'assistant', text: result.reply, proposedItinerary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onSend({ role: 'assistant', text: `抱歉，出了点问题：${msg}` });
    } finally {
      onSetLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 relative z-[1000]">
      {/* Collapsed bar */}
      {!expanded && (
        <button
          onClick={() => onToggle(true)}
          className="w-full glass-panel border-t border-[rgba(255,255,255,0.04)] px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-[rgba(26,26,36,0.9)] transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center shrink-0 group-hover:bg-amber/15 transition-colors">
            <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <span className="flex-1 text-left text-[15px] text-muted font-body group-hover:text-void/80 transition-colors">
            想要什么让AI修改~~~
          </span>
          <svg className="w-4 h-4 text-ghost group-hover:text-muted transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="glass-panel border-t border-[rgba(255,255,255,0.06)] animate-slideUp flex flex-col" style={{ maxHeight: '420px' }}>
          {/* Header */}
          <div className="shrink-0 px-5 py-3.5 flex items-center justify-between border-b border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <span className="font-display font-semibold text-[15px] text-void tracking-tight">AI 修改</span>
            </div>
            <button
              onClick={() => onToggle(false)}
              className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-[14px] text-muted leading-relaxed">
                  告诉我你想怎么调整行程，比如：
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {['把午餐换成火锅', '下午加一个博物馆', '换一个更浪漫的晚餐', '推荐更多拍照打卡点'].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="text-[13px] px-3.5 py-2 rounded-full bg-amber-soft text-amber hover:bg-amber-glow transition-colors cursor-pointer font-body"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
                <div className={`max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-amber text-[#09090b] rounded-2xl rounded-br-md px-4 py-2.5'
                    : 'bg-overlay text-void rounded-2xl rounded-bl-md px-4 py-2.5 border border-[rgba(255,255,255,0.04)]'
                }`}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {m.role === 'assistant' && m.proposedItinerary && (
                    <button
                      onClick={() => onApplyItinerary(m.proposedItinerary!)}
                      className="mt-3 w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-[#09090b] bg-amber hover:bg-amber/90 rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      应用此修改
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeInUp">
                <div className="bg-overlay border border-[rgba(255,255,255,0.04)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入修改需求..."
                disabled={loading}
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-[14px] text-void placeholder:text-muted/40 focus:outline-none transition-all font-body disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="shrink-0 w-10 h-10 rounded-xl bg-amber hover:bg-amber/90 disabled:bg-white/[0.04] disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#09090b] disabled:text-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
