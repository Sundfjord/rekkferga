"use client";

import { useCallback, useEffect, useState } from "react";
import type { Quay } from "@shared/types";
import { fetchQuays } from "@shared/services/quay";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CACHE_KEY = "rekkferga-quays";

export interface QuaysState {
  quays: Quay[];
  loading: boolean;
  /** The fetch failed and there is no cached copy to fall back on. */
  error: boolean;
  retry: () => void;
}

// The quay dataset is static (refreshed monthly server-side), so cache it in localStorage
// and serve instantly on repeat visits while revalidating in the background. A failed
// revalidation is only reported when there is nothing cached to show.
export function useQuays(): QuaysState {
  const [quays, setQuays] = useState<Quay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    let hasCache = false;
    setError(false);

    const cached = typeof localStorage !== "undefined" ? localStorage.getItem(CACHE_KEY) : null;
    if (cached) {
      try {
        const parsed: Quay[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          hasCache = true;
          setQuays(parsed);
          setLoading(false);
        }
      } catch {
        /* ignore corrupt cache */
      }
    }

    if (!API_URL) {
      setLoading(false);
      return;
    }

    setLoading(!hasCache);
    fetchQuays(API_URL)
      .then((data) => {
        if (cancelled || !data.length) return;
        setQuays(data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          /* quota / unavailable — non-fatal */
        }
      })
      .catch(() => {
        if (!cancelled && !hasCache) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { quays, loading, error, retry };
}
