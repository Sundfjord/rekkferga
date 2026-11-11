"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Quay, SearchResult, ResultItem, SavedDestination } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";
import Spinner from "@/components/Spinner";

type Mode = "quay" | "destination";

export type DestinationStatus =
  | { kind: "resolving"; name: string }
  | { kind: "error"; messageKey: string }
  | null;

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_QUAY_MATCHES = 8;
const MIN_DESTINATION_QUERY = 2;
const DEBOUNCE_MS = 250;

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
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
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

function ModeToggle({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? "var(--surface)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        boxShadow: active ? "0 1px 2px rgba(1,22,56,0.10)" : "none",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {label}
    </button>
  );
}

const matches = (q: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(q));

/** Debounced destination search; drops responses for anything but the latest query. */
function useDestinationSearch(query: string, enabled: boolean, focus: [number, number] | null) {
  const [results, setResults] = useState<SearchResult[]>([]);
  // The query `results` belong to — lets us tell "no hits" apart from "not searched yet".
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (!enabled || !API_URL || q.length < MIN_DESTINATION_QUERY) {
      setResults([]);
      setResultsFor(null);
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ query: q });
      if (focus) {
        params.set("lat", focus[0].toFixed(3));
        params.set("lon", focus[1].toFixed(3));
      }
      try {
        const res = await fetch(`${API_URL}/search?${params}`, { signal: controller.signal });
        const data = res.ok ? await res.json() : [];
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
      }
      setResultsFor(q);
      setIsSearching(false);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, enabled, focus]);

  return { results, isSearching, settled: resultsFor === q && !isSearching };
}

export interface SearchOverlayProps {
  quays: Quay[];
  userLocation: [number, number] | null;
  destinationStatus: DestinationStatus;
  onSelectQuay: (quay: Quay) => void;
  onSelectDestination: (result: ResultItem) => void;
}

export default function SearchOverlay({
  quays,
  userLocation,
  destinationStatus,
  onSelectQuay,
  onSelectDestination,
}: SearchOverlayProps) {
  const t = useTranslation();
  const { favorites } = useFavorites();
  const [mode, setMode] = useState<Mode>("quay");
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const destination = useDestinationSearch(query, mode === "destination", userLocation);

  const quaysById = useMemo(() => new Map(quays.map((quay) => [quay.id, quay])), [quays]);

  // Favorites are listed in both modes and stay visible (filtered) while typing.
  const favoriteMatches = q ? favorites.filter((f) => matches(q, f.name, f.subName)) : favorites;
  const favoriteIds = new Set(favorites.map((f) => f.id));
  const quayMatches =
    mode === "quay" && q
      ? quays.filter((quay) => !favoriteIds.has(quay.id) && matches(q, quay.name, quay.subName)).slice(0, MAX_QUAY_MATCHES)
      : [];
  const destResults = mode === "destination" ? destination.results : [];

  const hasRows = favoriteMatches.length + quayMatches.length + destResults.length > 0;
  const noResults =
    !hasRows && (mode === "quay" ? !!q && quays.length > 0 : destination.settled);
  const showDropdown = isFocused && (hasRows || noResults);

  const close = () => {
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const selectFavorite = (f: SavedDestination) => {
    const quay = quaysById.get(f.id);
    if (quay) onSelectQuay(quay);
    else onSelectDestination(f); // a saved place that isn't a quay
    close();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
        <div className="grid grid-cols-2 gap-1 p-1 m-2 rounded-xl" style={{ backgroundColor: "var(--surface-variant)" }}>
          <ModeToggle active={mode === "quay"} label={t("quay")} onClick={() => switchMode("quay")} />
          <ModeToggle active={mode === "destination"} label={t("destination")} onClick={() => switchMode("destination")} />
        </div>

        <div className="flex items-center gap-3 px-4 pb-3 pt-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === "Escape" && close()}
            placeholder={mode === "quay" ? t("searchQuayPlaceholder") : t("searchDestinationPlaceholder")}
            className="flex-1 outline-none bg-transparent text-lg"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans)" }}
          />
          {destination.isSearching ? <Spinner className="h-5 w-5" /> : <SearchIcon />}
        </div>

        {destinationStatus && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 px-4 py-3 border-t text-sm"
            style={{
              borderColor: "var(--border)",
              color: destinationStatus.kind === "error" ? "var(--error)" : "var(--text-secondary)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {destinationStatus.kind === "resolving" ? (
              <>
                <Spinner />
                <span className="truncate">{t("findingQuayFor", { place: destinationStatus.name })}</span>
              </>
            ) : (
              <span>{t(destinationStatus.messageKey)}</span>
            )}
          </div>
        )}

        {showDropdown && (
          <div className="border-t max-h-80 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            {favoriteMatches.map((f) => (
              <ResultRow key={`fav-${f.id}`} icon={<HeartIcon />} name={f.name} subName={f.subName} query={query} onSelect={() => selectFavorite(f)} />
            ))}
            {quayMatches.map((quay) => (
              <ResultRow
                key={quay.id}
                icon={<PinIcon />}
                name={quay.name}
                subName={quay.subName}
                query={query}
                onSelect={() => {
                  onSelectQuay(quay);
                  close();
                }}
              />
            ))}
            {destResults.map((r) => (
              <ResultRow
                key={r.id}
                icon={<PinIcon />}
                name={r.name}
                subName={r.subName}
                query={query}
                onSelect={() => {
                  onSelectDestination(r);
                  close();
                }}
              />
            ))}
            {noResults && (
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
