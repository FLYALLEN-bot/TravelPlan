import { useState, useEffect, useRef, useCallback } from 'react';
import type { SelectedLocation } from '../types/itinerary';
import { inputTips } from '../api/amapRest';
import { useDebounce } from '../hooks/useDebounce';

interface SearchBarProps { onLocationSelect: (location: SelectedLocation) => void; }

interface TipItem {
  name: string;
  address: string;
  district: string;
  lng: number;
  lat: number;
  id: string;
}

export function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TipItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    console.log('[Search] inputTips:', q);

    inputTips(q)
      .then((tips) => {
        console.log('[Search] results:', tips.length);
        if (tips.length > 0) {
          const items: TipItem[] = tips.map((t) => {
            const [lng, lat] = t.location.split(',').map(Number);
            return {
              name: t.name,
              address: t.address || '',
              district: t.district || '',
              lng,
              lat,
              id: t.id || `${t.name}-${t.location}`,
            };
          });
          setResults(items);
          setIsOpen(true);
          setHighlightIndex(-1);
        } else {
          setResults([]);
          setIsOpen(false);
        }
        setIsSearching(false);
      })
      .catch(() => {
        setResults([]);
        setIsOpen(false);
        setIsSearching(false);
      });
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectResult = useCallback((tip: TipItem) => {
    const displayName = tip.district
      ? `${tip.district} ${tip.name}`
      : tip.name;
    onLocationSelect({ lat: tip.lat, lon: tip.lng, displayName });
    setQuery(tip.name);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onLocationSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((p) => (p < results.length - 1 ? p + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((p) => (p > 0 ? p - 1 : results.length - 1)); }
    else if (e.key === 'Enter' && highlightIndex >= 0) { e.preventDefault(); selectResult(results[highlightIndex]); }
    else if (e.key === 'Escape') { setIsOpen(false); }
  };

  return (
    <div ref={containerRef} className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">
      <div className="relative">
        <div className="glass-panel rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 focus-within:shadow-[0_4px_32px_rgba(245,158,11,0.12)] focus-within:border-amber/20">
          <div className="flex items-center">
            <svg className="w-5 h-5 ml-4.5 text-ghost shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef} type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              placeholder="搜索你想去的地方..."
              className="w-full px-3.5 py-4.5 text-[17px] bg-transparent outline-none text-void placeholder:text-ghost font-body"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
                className="p-2 mr-2 text-ghost hover:text-muted transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {isSearching && (
              <div className="mr-4">
                <div className="w-5 h-5 border-[1.5px] border-amber border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {isOpen && results.length > 0 && (
          <ul className="absolute top-full mt-2 left-0 right-0 glass-panel rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] max-h-72 overflow-y-auto scrollbar-thin animate-fadeIn border-[rgba(255,255,255,0.08)]">
            {results.map((tip, index) => (
              <li key={tip.id || `${tip.name}-${index}`} onClick={() => selectResult(tip)}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`px-5 py-3.5 cursor-pointer text-[16px] border-b border-border last:border-b-0 transition-colors
                  ${index === highlightIndex ? 'bg-amber-soft text-amber font-medium' : 'text-void hover:bg-white/[0.02]'}`}>
                <div className="flex items-start gap-3.5">
                  <svg className="w-5 h-5 mt-[3px] shrink-0 text-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="line-clamp-1 leading-snug font-medium">{tip.name}</span>
                    {tip.address && (
                      <span className="block text-[13px] text-muted mt-0.5 line-clamp-1">{tip.address}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
