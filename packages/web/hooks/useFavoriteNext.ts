"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuayNext } from "@shared/types";
import { fetchQuaysNext } from "@shared/services/quay";
import type { DriveTimes } from "@/hooks/useDriveTimes";
import type { LatLng } from "@/hooks/usePosition";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REFRESH_MS = 120_000;

export interface FavoriteNext {
  byId: Map<string, QuayNext>;
  /**
   * True once a load for the current set of quays has finished (even a failed one), so cards can
   * stop showing a placeholder. False again while a changed set (a new favourite) loads.
   */
  loaded: boolean;
  /** The latest load failed. Earlier results (if any) are kept in `byId`. */
  error: boolean;
  retry: () => void;
}

/**
 * Next few departures per favourite quay, keyed by quay id; refreshed every 2 min and when the
 * coarse `location` changes. Drive times are measured from the latest fix (`getPosition`) and
 * written to the shared store, so the quay view reuses them. Nothing loads until `ready` (the
 * position has settled), so the first load already has drive times and margins.
 */
export function useFavoriteNext(
  quayIds: string[],
  location: LatLng | null,
  getPosition: () => LatLng | null,
  putDrive: DriveTimes["put"],
  ready: boolean,
): FavoriteNext {
  // `key`: which quays the state was loaded for, so `loaded` is per set of quays.
  const [state, setState] = useState<{ key: string | null; byId: Map<string, QuayNext>; error: boolean }>({
    key: null,
    byId: new Map(),
    error: false,
  });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const key = quayIds.join(",");

  useEffect(() => {
    if (!API_URL || !key) {
      setState({ key, byId: new Map(), error: false });
      return;
    }
    if (!ready) return;
    const apiUrl = API_URL;
    let cancelled = false;
    const load = async () => {
      try {
        const from = getPosition() ?? location;
        const rows = await fetchQuaysNext(apiUrl, key.split(","), from);
        if (cancelled) return;
        for (const r of rows) {
          if (r.driveSeconds != null && from) {
            putDrive(r.quayId, { seconds: r.driveSeconds, typicalSeconds: r.typicalDriveSeconds ?? null, from });
          }
        }
        setState({ key, byId: new Map(rows.map((r) => [r.quayId, r])), error: false });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, key, error: true }));
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key, location, getPosition, putDrive, ready, attempt]);

  return { byId: state.byId, loaded: state.key === key, error: state.error, retry };
}
