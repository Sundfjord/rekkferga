"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchResult } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";

const PinIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    style={{ color: "var(--water-light)" }}
  >
    <path
      fillRule="evenodd"
      d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.003 3.5-4.567 3.5-7.327a6.79 6.79 0 0 0-6.79-6.79 6.79 6.79 0 0 0-6.79 6.79c0 2.76 1.556 5.323 3.5 7.327a19.579 19.579 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      clipRule="evenodd"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function Search({ onSelect }: { onSelect: (result: SearchResult) => void }) {
  const t = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${url}/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setQuery(result.name);
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 bg-white px-5 py-4 rounded-2xl"
        style={{ boxShadow: "var(--shadow-search)" }}
      >
        <PinIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 outline-none bg-transparent text-lg text-gray-900 placeholder-gray-400"
          style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
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

      {isOpen && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl overflow-hidden z-20"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            {results.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                onClick={() => handleSelect(r)}
                className="px-5 py-3.5 hover:bg-[--surface-tint] cursor-pointer border-b last:border-b-0 transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="font-medium text-base"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  {r.name}
                </div>
                {r.subName && (
                  <div
                    className="text-sm mt-0.5"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                  >
                    {r.subName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
