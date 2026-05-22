"use client";

import { useState, useEffect, useRef } from "react";
import type { Quay, SearchResult, ResultItem } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";

type Mode = "quay" | "destination";

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden style={{ color: "var(--text-disabled)" }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PinIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ color: "var(--water-light)" }}>
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.003 3.5-4.567 3.5-7.327a6.79 6.79 0 0 0-6.79-6.79 6.79 6.79 0 0 0-6.79 6.79c0 2.76 1.556 5.323 3.5 7.327a19.579 19.579 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

interface RowProps {
  icon: React.ReactNode;
  name: string;
  subName?: string;
  query: string;
  onSelect: () => void;
}

function ResultRow({ icon, name, subName, query, onSelect }: RowProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className="w-full text-left px-4 py-2.5 hover:bg-[--surface-tint] cursor-pointer transition-colors flex items-center gap-3"
    >
      {icon}
      <span className="flex-1 min-w-0">
        <span className="block text-base truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans)" }}>
          <HighlightMatch text={name} query={query} />
        </span>
        {subName && (
          <span className="block text-sm truncate" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
            {subName}
          </span>
        )}
      </span>
    </button>
  );
}

export interface SearchOverlayProps {
  quays: Quay[];
  onSelectQuay: (quay: Quay) => void;
  onSelectDestination: (result: ResultItem) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SearchOverlay({ quays, onSelectQuay, onSelectDestination }: SearchOverlayProps) {
  const t = useTranslation();
  const { favorites } = useFavorites();
  const [mode, setMode] = useState<Mode>("quay");
  const [query, setQuery] = useState("");
  const [destResults, setDestResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Destination mode: debounced Nominatim search
  useEffect(() => {
    if (mode !== "destination") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setDestResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!API_URL) return;
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`);
        setDestResults(res.ok ? await res.json() : []);
      } catch {
        setDestResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setQuery("");
    setDestResults([]);
    inputRef.current?.focus();
  };

  const select = (fn: () => void) => {
    fn();
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Quay mode: filter the in-memory dataset (instant)
  const q = query.trim().toLowerCase();
  const quayMatches = mode === "quay" && q
    ? quays.filter((quay) => quay.name.toLowerCase().includes(q)).slice(0, 8)
    : [];
  const favoriteQuays = mode === "quay" && !q ? favorites : [];

  const showDropdown =
    isFocused &&
    (favoriteQuays.length > 0 || quayMatches.length > 0 || destResults.length > 0 || (mode === "destination" && !!q));

  const placeholder = mode === "quay" ? t("searchQuayPlaceholder") : t("searchPlaceholder");

  const Toggle = ({ m, label }: { m: Mode; label: string }) => (
    <button
      type="button"
      onClick={() => switchMode(m)}
      aria-pressed={mode === m}
      className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      style={{
        backgroundColor: mode === m ? "var(--surface)" : "transparent",
        color: mode === m ? "var(--text-primary)" : "var(--text-secondary)",
        boxShadow: mode === m ? "0 1px 2px rgba(1,22,56,0.10)" : "none",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 m-2 rounded-xl" style={{ backgroundColor: "var(--surface-variant)" }}>
          <Toggle m="quay" label={t("quay")} />
          <Toggle m="destination" label={t("destination")} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 pb-3 pt-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={placeholder}
            className="flex-1 outline-none bg-transparent text-lg"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans)" }}
          />
          {isSearching ? (
            <div className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--water-light)", borderTopColor: "transparent" }} />
          ) : (
            <SearchIcon />
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="border-t max-h-80 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            {favoriteQuays.map((f) => {
              const quay = quays.find((quayItem) => quayItem.id === f.id);
              return (
                <ResultRow
                  key={f.id}
                  icon={<HeartIcon />}
                  name={f.name}
                  subName={f.subName}
                  query={query}
                  onSelect={() => quay && select(() => onSelectQuay(quay))}
                />
              );
            })}
            {quayMatches.map((quay) => (
              <ResultRow
                key={quay.id}
                icon={<PinIcon />}
                name={quay.name}
                subName={quay.subName}
                query={query}
                onSelect={() => select(() => onSelectQuay(quay))}
              />
            ))}
            {destResults.map((r) => (
              <ResultRow
                key={r.id}
                icon={<PinIcon />}
                name={r.name}
                subName={r.subName}
                query={query}
                onSelect={() => select(() => onSelectDestination(r))}
              />
            ))}
            {mode === "destination" && q && !isSearching && destResults.length === 0 && (
              <div className="px-4 py-3 text-sm" style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans)" }}>
                {t("noResults")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
