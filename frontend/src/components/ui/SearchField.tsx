import { useEffect, useRef, useState } from 'react';
import { Search, X, MapPin, Building2, Layers, Command } from 'lucide-react';
import type { Parcel, SearchEntry } from '@/types/property';
import { usePropertySearch } from '@/hooks/usePropertySearch';

interface SearchFieldProps {
  onSelect: (entry: SearchEntry) => void;
  savedParcels?: Parcel[];
}

const KIND_ICON = {
  parcel: MapPin,
  building: Building2,
  floor: Layers,
} as const;

export function SearchField({ onSelect, savedParcels }: SearchFieldProps) {
  const { query, setQuery, results } = usePropertySearch(savedParcels);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K listener to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (entry: SearchEntry) => {
    onSelect(entry);
    setQuery(entry.displayLabel);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by ULPIN / Property ID / Address..."
          className="w-full bg-base-800/50 border border-white/[0.06] rounded-lg pl-9 pr-20 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-accent-500/30 focus:ring-1 focus:ring-accent-500/20 transition-all"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div
            onClick={() => inputRef.current?.focus()}
            className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] text-slate-600 bg-base-700/50 px-1.5 py-0.5 rounded border border-white/[0.04]"
          >
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full glass-panel border border-white/[0.06] rounded-lg overflow-hidden z-50 animate-fade-in shadow-panel-lg">
          <ul className="max-h-72 overflow-y-auto scrollbar-thin">
            {results.map((entry) => {
              const Icon = KIND_ICON[entry.kind];
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => handleSelect(entry)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-0"
                  >
                    <div className="h-7 w-7 rounded-md bg-accent-500/10 border border-accent-500/15 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-accent-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-slate-200 font-medium truncate">
                        {entry.displayLabel}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {entry.secondaryLabel}
                        {entry.ulpin && ` · ULPIN: ${entry.ulpin}`}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-600 uppercase tracking-wider shrink-0 font-mono">
                      {entry.kind}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {open && query.length > 0 && results.length === 0 && (
        <div className="absolute top-full mt-1.5 w-full glass-panel rounded-lg p-3 text-[11px] text-slate-500 z-50 animate-fade-in shadow-panel-lg">
          No matching properties found.
        </div>
      )}
    </div>
  );
}
