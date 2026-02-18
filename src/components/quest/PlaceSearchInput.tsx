"use client";

import { useState, useRef } from "react";

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  category: string;
  lat: number;
  lng: number;
  distance: number | null;
}

interface Props {
  onSelect: (place: PlaceResult) => void;
  currentLat?: number;
  currentLng?: number;
}

export default function PlaceSearchInput({ onSelect, currentLat, currentLng }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: value });
        if (currentLat && currentLng) {
          params.set("lat", currentLat.toString());
          params.set("lng", currentLng.toString());
        }
        const res = await fetch(`/api/quest/search?${params}`);
        const data = await res.json();
        setResults(data.places || []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.name);
    setShowResults(false);
    onSelect(place);
  };

  return (
    <div className="relative">
      <div className="relative">
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="목적지 검색 (장소명, 주소)"
          className="w-full pl-9 pr-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => handleSelect(place)}
              className="w-full px-3 py-2.5 text-left hover:bg-[var(--color-surface-elevated)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
            >
              <p className="text-sm font-medium text-[var(--color-text)]">{place.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {place.address}
                {place.distance != null && ` · ${place.distance >= 1000 ? `${(place.distance / 1000).toFixed(1)}km` : `${place.distance}m`}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
