import { useState, useEffect, useRef, useCallback } from 'react';
import type { SelectedLocation } from '../types/itinerary';
import { searchLocations } from '../api/nominatim';
import type { SearchResult } from '../api/nominatim';
import { useDebounce } from '../hooks/useDebounce';

interface SearchBarProps { onLocationSelect: (location: SelectedLocation) => void; }

export function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setIsOpen(false); return; }
    let cancelled = false;
    setIsSearching(true);
    searchLocations(debouncedQuery).then((data) => {
      if (!cancelled) { setResults(data); setIsOpen(data.length > 0); setHighlightIndex(-1); setIsSearching(false); }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectResult = useCallback((result: SearchResult) => {
    onLocationSelect({ lat: result.lat, lon: result.lon, displayName: result.displayName });
    setQuery(result.displayName); setIsOpen(false); inputRef.current?.blur();
  }, [onLocationSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((p) => (p < results.length - 1 ? p + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((p) => (p > 0 ? p - 1 : results.length - 1)); }
    else if (e.key === 'Enter' && highlightIndex >= 0) { e.preventDefault(); selectResult(results[highlightIndex]); }
    else if (e.key === 'Escape') { setIsOpen(false); }
  };

  return (
    <div ref={containerRef} className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4">
      <div className="relative">
        <div className="glass-strong rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 focus-within:shadow-[0_4px_24px_rgba(13,148,136,0.12)] focus-within:border-teal/20">
          <div className="flex items-center">
            <svg className="w-5 h-5 ml-4 text-soft shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef} type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              placeholder="搜索你想去的地方..."
              className="w-full px-3 py-4 text-[16px] bg-transparent outline-none text-void placeholder:text-soft/70 font-body"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
                className="p-2 mr-1.5 text-soft hover:text-void transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {isSearching && (
              <div className="mr-3.5">
                <div className="w-5 h-5 border-[1.5px] border-teal border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {isOpen && results.length > 0 && (
          <ul className="absolute top-full mt-2 left-0 right-0 glass-strong rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-h-64 overflow-y-auto scrollbar-thin animate-fadeIn">
            {results.map((result, index) => (
              <li key={`${result.lat}-${result.lon}`} onClick={() => selectResult(result)}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`px-4 py-3 cursor-pointer text-[15px] border-b border-black/3 last:border-b-0 transition-colors
                  ${index === highlightIndex ? 'bg-teal/6 text-teal font-medium' : 'text-void hover:bg-black/[0.02]'}`}>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-[2px] shrink-0 text-soft/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="line-clamp-2 leading-snug">{result.displayName}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
