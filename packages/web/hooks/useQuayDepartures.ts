"use client";

import { useCallback, useEffect, useState } from "react";
import type { Quay, DepartureOption } from "@shared/types";
import { fetchQuayRoute, fetchQuayDepartures } from "@shared/services/quay";
import { DRIVE_FRESH_MS, type DriveTimes } from "@/hooks/useDriveTimes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const RETRY_AFTER_ERROR_MS = 30_000;

// Margin-adaptive departure poll: refresh more often as the margin tightens.
function getRefreshIntervalMs(marginMinutes: number | null): number {
  if (marginMinutes === null) return 120_000;
  if (marginMinutes >= 10) return 180_000;
  if (marginMinutes >= 3) return 90_000;
  if (marginMinutes >= -5) return 30_000;
  return 180_000;
}

export interface QuayDeparturesState {
  /** As returned by the API; views recompute margins live (lib/departures withLiveMargins). */
  departures: DepartureOption[];
  /** True from selection until the first departures have arrived. */
  loading: boolean;
  /** True during background polls after the first load. */
  isRefreshing: boolean;
  lastRefreshAt: Date | null;
  /** The latest departures request failed. Earlier departures (if any) are kept. */
  departuresError: boolean;
  /** The drive time couldn't be fetched (with a position), so margins are missing. */
  routeError: boolean;
  /** Re-run the whole load now (e.g. from an error notice's retry button). */
  retry: () => void;
}

type LoadState = Omit<QuayDeparturesState, "retry">;

const INITIAL: LoadState = {
  departures: [],
  loading: false,
  isRefreshing: false,
  lastRefreshAt: null,
  departuresError: false,
  routeError: false,
};

/**
 * For the selected quay: poll departures. The drive time comes from the shared store
 * (`DriveTimes`) and is re-fetched only when older than DRIVE_FRESH_MS — on selection and on
 * every poll — so it stays current while the quay is open and matches the favourites.
 * Without a position (or if routing fails) departures still load, just without margins.
 */
export function useQuayDepartures(
  quay: Quay | null,
  userLocation: [number, number] | null,
  limit: number,
  getDrive: DriveTimes["get"],
  putDrive: DriveTimes["put"],
): QuayDeparturesState {
  const [state, setState] = useState<LoadState>(INITIAL);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!API_URL || !quay) {
      setState(INITIAL);
      return;
    }
    const apiUrl = API_URL;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setState({ ...INITIAL, loading: true });

    const driveSeconds = async (): Promise<number | null> => {
      if (!userLocation) return null;
      const cached = getDrive(quay.id);
      if (cached && Date.now() - cached.at < DRIVE_FRESH_MS) return cached.seconds;
      try {
        const route = await fetchQuayRoute(apiUrl, userLocation[0], userLocation[1], quay.id);
        putDrive(quay.id, route.durationSeconds);
        if (!cancelled) setState((s) => ({ ...s, routeError: false }));
        return route.durationSeconds;
      } catch {
        // Fall back to a stale drive time if we have one; only report when there is none.
        if (!cancelled) setState((s) => ({ ...s, routeError: !cached }));
        return cached?.seconds ?? null;
      }
    };

    const refresh = async () => {
      const drive = await driveSeconds();
      if (cancelled) return;
      // The server still needs an arrival estimate to pick the next reachable departure and
      // to hide clearly missed ones; displayed margins are recomputed live by the views.
      const arrival = drive === null ? undefined : new Date(Date.now() + drive * 1000).toISOString();
      let nextPollMs = RETRY_AFTER_ERROR_MS;
      try {
        const data = await fetchQuayDepartures(apiUrl, quay.id, arrival, limit);
        if (cancelled) return;
        setState((s) => ({
          ...s,
          departures: data.departures,
          loading: false,
          isRefreshing: false,
          lastRefreshAt: new Date(),
          departuresError: false,
        }));
        nextPollMs = getRefreshIntervalMs(data.selectedDeparture?.marginMinutes ?? null);
      } catch {
        if (cancelled) return;
        // Keep the last good departures on screen; the error notice says they may be stale.
        setState((s) => ({ ...s, loading: false, isRefreshing: false, departuresError: true }));
      }
      timer = setTimeout(() => {
        setState((s) => ({ ...s, isRefreshing: true }));
        refresh();
      }, nextPollMs);
    };

    refresh();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [quay, userLocation, limit, getDrive, putDrive, attempt]);

  return { ...state, retry };
}
