import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, MultiDayItinerary } from '../types/itinerary';
import { chatModifyItinerary } from '../api/anthropic';
import { parseItineraryResponse } from '../utils/formatItinerary';

interface InlineChatBarProps {
  itineraryData: MultiDayItinerary;
  messages: ChatMessage[];
  loading: boolean;
  expanded: boolean;
  onToggle: (open: boolean) => void;
  onSend: (msg: ChatMessage) => void;
  onSetLoading: (loading: boolean) => void;
  onApplyItinerary: (itinerary: MultiDayItinerary) => void;
}

export function InlineChatBar({
  itineraryData, messages, loading, expanded, onToggle, onSend, onSetLoading, onApplyItinerary,
}: InlineChatBarProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [expanded]);

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      });
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

      const clean = {
        ...itineraryData,
        days: itineraryData.days.map(({ routeStops, ...rest }) => rest),
      } as Record<string, unknown>;

      const result = await chatModifyItinerary(clean, text, history);

      let proposedItinerary: MultiDayItinerary | null = null;
      if (result.itinerary) {
        try {
          proposedItinerary = parseItineraryResponse(JSON.stringify(result.itinerary));
        } catch (e) {
          console.warn('[Chat] strict parse failed, merging with current itinerary:', e);
          try {
            const ai = result.itinerary;
            const merged: MultiDayItinerary = { ...itineraryData };
            if (typeof ai.locationName === 'string') merged.locationName = ai.locationName;
            if (Array.isArray(ai.days)) {
              ai.days.forEach((aiDay: Record<string, unknown>, di: number) => {
                if (!merged.days[di]) return;
                for (const key of (['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const)) {
                  const aiSlot = aiDay[key] as Record<string, unknown> | undefined;
                  if (aiSlot) {
                    if (typeof aiSlot.timeRange === 'string') merged.days[di][key].timeRange = aiSlot.timeRange;
                    if (typeof aiSlot.title === 'string') merged.days[di][key].title = aiSlot.title;
                    if (Array.isArray(aiSlot.activities)) {
                      merged.days[di][key].activities = (aiSlot.activities as unknown[]).map((a: unknown) => {
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
              });
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
          className="w-full px-5 py-3 flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:bg-white/[0.02]"
          style={{ background: 'rgba(18,18,23,0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber to-orange-600 flex items-center justify-center shadow-lg shadow-amber/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#121217]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] text-void/90 font-medium font-body">AI 旅行助手</p>
            <p className="text-[12px] text-muted/60 font-body">点击开始对话，调整你的行程</p>
          </div>
          <div className="flex items-center gap-1.5 text-amber/60 group-hover:text-amber transition-colors">
            <span className="text-[12px] font-body">展开</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div
          className="flex flex-col origin-bottom"
          style={{
            maxHeight: '480px',
            background: 'rgba(14,14,18,0.95)',
            backdropFilter: 'blur(32px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            animation: 'chatExpand 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header */}
          <div className="shrink-0 px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber to-orange-600 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0e0e12]" />
              </div>
              <div>
                <span className="font-display font-semibold text-[15px] text-void tracking-tight">AI 旅行助手</span>
                <p className="text-[11px] text-green-400/80 font-body flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  在线
                </p>
              </div>
            </div>
            <button
              onClick={() => onToggle(false)}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin" style={{ scrollBehavior: 'smooth' }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber/20 to-orange-600/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <p className="text-[14px] text-void/70 font-medium mb-1 font-body">嗨！我是你的旅行助手</p>
                <p className="text-[12px] text-muted/50 mb-5 font-body">告诉我你想怎么调整行程吧</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-[320px]">
                  {['把午餐换成火锅', '下午加一个博物馆', '换一个更浪漫的晚餐', '推荐更多拍照打卡点'].map((hint, i) => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="text-[12px] px-3 py-1.5 rounded-full border border-amber/20 text-amber/80 hover:bg-amber/10 hover:border-amber/40 transition-all duration-200 cursor-pointer font-body active:scale-95"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} index={i} onApplyItinerary={onApplyItinerary} />
            ))}

            {loading && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入修改需求..."
                  disabled={loading}
                  className="w-full rounded-full px-4 py-2.5 text-[14px] text-void placeholder:text-muted/30 focus:outline-none transition-all duration-200 font-body disabled:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(245,158,11,0.4)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
                    : 'rgba(255,255,255,0.05)',
                  boxShadow: input.trim() && !loading
                    ? '0 2px 12px rgba(245,158,11,0.3)'
                    : 'none',
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

/* ---- Sub-components ---- */

function ChatBubble({ message, index, onApplyItinerary }: {
  message: ChatMessage;
  index: number;
  onApplyItinerary: (itinerary: MultiDayItinerary) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{
        animation: `chatBubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 30}ms both`,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber to-orange-600 flex items-center justify-center mt-1 shadow-sm">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div className={`relative max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-3.5 py-2.5 text-[13.5px] leading-relaxed font-body ${
            isUser
              ? 'text-white rounded-[18px] rounded-br-[4px]'
              : 'text-void/90 rounded-[18px] rounded-bl-[4px]'
          }`}
          style={isUser
            ? {
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
              }
            : {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
              }
          }
        >
          <p className="whitespace-pre-wrap">{message.text}</p>

          {message.role === 'assistant' && message.proposedItinerary && (
            <button
              onClick={() => onApplyItinerary(message.proposedItinerary!)}
              className="mt-2.5 w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-white rounded-xl px-4 py-2 transition-all duration-200 cursor-pointer active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              应用此修改
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 mb-3" style={{ animation: 'chatBubbleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber to-orange-600 flex items-center justify-center mt-1 shadow-sm">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <div
        className="px-4 py-3 rounded-[18px] rounded-bl-[4px]"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1">
          <span className="typing-dot w-2 h-2 rounded-full bg-amber/50" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot w-2 h-2 rounded-full bg-amber/50" style={{ animationDelay: '160ms' }} />
          <span className="typing-dot w-2 h-2 rounded-full bg-amber/50" style={{ animationDelay: '320ms' }} />
        </div>
      </div>
    </div>
  );
}
