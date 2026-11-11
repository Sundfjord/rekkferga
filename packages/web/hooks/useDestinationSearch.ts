"use client";

import { useEffect, useState } from "react";
import type { SearchResult } from "@shared/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

/** Debounced place search (/search); drops responses for anything but the latest query. */
export function useDestinationSearch(query: string, focus: [number, number] | null) {
  const [results, setResults] = useState<SearchResult[]>([]);
  // The query `results` belong to — tells "no hits" apart from "not searched yet".
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (!API_URL || q.length < MIN_QUERY) {
      setResults([]);
      setResultsFor(null);
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ query: q, size: "6" });
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
  }, [q, focus]);

  return { results, isSearching, settled: resultsFor === q && !isSearching };
}
