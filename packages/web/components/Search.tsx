"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { SearchResult, ResultItem } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";
import ContentPanel from "@/components/ContentPanel";

export interface SearchHandle {
  focus: () => void;
  clear: () => void;
}

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    style={{ color: "var(--text-secondary)", opacity: 0.5 }}
  >
    <path
      fillRule="evenodd"
      d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.003 3.5-4.567 3.5-7.327a6.79 6.79 0 0 0-6.79-6.79 6.79 6.79 0 0 0-6.79 6.79c0 2.76 1.556 5.323 3.5 7.327a19.579 19.579 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      clipRule="evenodd"
    />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "currentColor"}
    strokeWidth={2}
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

interface SearchProps {
  onSelect: (result: ResultItem) => void;
}

const Search = forwardRef<SearchHandle, SearchProps>(
  function Search({ onSelect }, ref) {
  const t = useTranslation();
  const { favorites } = useFavorites();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>(favorites);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { setQuery(""); setResults([]); },
  }));

  // Compute filtered favorites based on query
  const filteredFavorites = query.trim()
    ? favorites.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : favorites;
  const allFavoriteIds = new Set(favorites.map((f) => f.id));

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query.trim()) {
      setResults(favorites);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${url}/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults([...filteredFavorites, ...data.filter((r) => !allFavoriteIds.has(r.id))]);
          
        }
      } catch {
        setResults(favorites);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const justSelectedRef = useRef(false);

  const handleSelect = (result: ResultItem) => {
    justSelectedRef.current = true;
    onSelect(result);
    setQuery(result.name);
    setResults(favorites);
  };

  return (
    <ContentPanel>
      <ContentPanel.Header>
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); justSelectedRef.current = false; }}
            placeholder={t("searchPlaceholder")}
            className="flex-1 outline-none bg-transparent text-lg"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            }}
          />
          <div className="flex-shrink-0">
            {isSearching ? (
              <div
                className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--water-light)", borderTopColor: "transparent" }}
              />
            ) : (
              <SearchIcon />
            )}
          </div>
        </div>    
      </ContentPanel.Header>
      <ContentPanel.Body>
        {results.length > 0 && (
          <div
            className="overflow-hidden z-20 w-full overflow-y-auto px-4"
            style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-elevated)" }}
          >
            <div className="flex flex-col flex-1 gap-4 pb-4">

              {results.map((r, i) => (
                <div
                  key={`${r.id}-${i}`}
                  onClick={() => handleSelect(r)}
                  className="w-full hover:bg-[--surface-tint] cursor-pointer transition-colors flex items-center gap-3"
                >
                  {r.type === 'favorite' ? (
                    <HeartIcon filled />
                  ) : (
                    <LocationIcon />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-base truncate"
                      style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                    >
                      {r.name}
                    </div>
                    {r.subName && (
                      <div
                        className="text-sm mt-0.5 truncate"
                        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                      >
                        {r.subName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ContentPanel.Body>
      
    </ContentPanel>
  );
});

export default Search;
