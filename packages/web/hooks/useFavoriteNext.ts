"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuayNext } from "@shared/types";
import { fetchQuaysNext } from "@shared/services/quay";
import type { DriveTimes } from "@/hooks/useDriveTimes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REFRESH_MS = 120_000;

export interface FavoriteNext {
  byId: Map<string, QuayNext>;
  /** True once a load has finished (even a failed one), so cards can stop showing a placeholder. */
  loaded: boolean;
  /** The latest load failed. Earlier results (if any) are kept in `byId`. */
  error: boolean;
  retry: () => void;
}

/**
 * Next few departures per favourite quay, keyed by quay id; refreshed every 2 min. Each
 * drive time it gets is written to the shared store, so the quay view reuses it.
 */
export function useFavoriteNext(
  quayIds: string[],
  userLocation: [number, number] | null,
  putDrive: DriveTimes["put"],
): FavoriteNext {
  const [state, setState] = useState<Omit<FavoriteNext, "retry">>({ byId: new Map(), loaded: false, error: false });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const key = quayIds.join(",");

  useEffect(() => {
    if (!API_URL || !key) {
      setState({ byId: new Map(), loaded: true, error: false });
      return;
    }
    const apiUrl = API_URL;
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchQuaysNext(apiUrl, key.split(","), userLocation);
        if (cancelled) return;
        for (const r of rows) if (r.driveSeconds != null) putDrive(r.quayId, r.driveSeconds);
        setState({ byId: new Map(rows.map((r) => [r.quayId, r])), loaded: true, error: false });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loaded: true, error: true }));
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key, userLocation, putDrive, attempt]);

  return { ...state, retry };
}
