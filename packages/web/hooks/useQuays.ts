"use client";

import { useEffect, useState } from "react";
import type { Quay } from "@shared/types";
import { fetchQuays } from "@shared/services/quay";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CACHE_KEY = "rekkferga-quays";

// The quay dataset is static (refreshed monthly server-side), so cache it in localStorage
// and serve instantly on repeat visits while revalidating in the background.
export function useQuays(): { quays: Quay[]; loading: boolean } {
  const [quays, setQuays] = useState<Quay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cached = typeof localStorage !== "undefined" ? localStorage.getItem(CACHE_KEY) : null;
    if (cached) {
      try {
        const parsed: Quay[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
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
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { quays, loading };
}
