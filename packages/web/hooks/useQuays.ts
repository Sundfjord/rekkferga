"use client";

import { useCallback, useEffect, useState } from "react";
import type { Quay } from "@shared/types";
import { fetchQuays } from "@shared/services/quay";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CACHE_KEY = "rekkferga-quays";

export interface QuaysState {
  quays: Quay[];
  /** The fetch failed and there is no cached copy to fall back on. */
  error: boolean;
  retry: () => void;
}

function readCache(): { raw: string; quays: Quay[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const quays: unknown = JSON.parse(raw);
    return Array.isArray(quays) && quays.length ? { raw, quays } : null;
  } catch {
    return null; // corrupt cache or storage unavailable
  }
}

// The quay dataset is static (refreshed monthly server-side), so cache it in localStorage
// and serve instantly on repeat visits while revalidating in the background. A failed
// revalidation is only reported when there is nothing cached to show.
export function useQuays(): QuaysState {
  const [quays, setQuays] = useState<Quay[]>([]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    const cached = readCache();
    if (cached) setQuays(cached.quays);
    if (!API_URL) return;

    fetchQuays(API_URL)
      .then((data) => {
        if (cancelled || !data.length) return;
        const raw = JSON.stringify(data);
        // Usually unchanged: keep the cached array, so nothing downstream recomputes.
        if (raw === cached?.raw) return;
        setQuays(data);
        try {
          localStorage.setItem(CACHE_KEY, raw);
        } catch {
          /* quota / unavailable — non-fatal */
        }
      })
      .catch(() => {
        if (!cancelled && !cached) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { quays, error, retry };
}
