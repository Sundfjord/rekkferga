"use client";

import { useCallback, useEffect, useState } from "react";
import type { Quay, DepartureOption } from "@shared/types";
import { fetchQuayRoute, fetchQuayDepartures } from "@shared/services/quay";
import { estimateArrival, isFresh, type DriveTimes } from "@/hooks/useDriveTimes";
import type { LatLng } from "@/hooks/usePosition";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const RETRY_AFTER_ERROR_MS = 30_000;
/** How often the drive time is checked; it's only re-fetched when stale (isFresh). */
const DRIVE_CHECK_MS = 20_000;

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
 * For the selected quay: poll departures, and keep the drive time in the shared store
 * (`DriveTimes`) current. The drive time is checked every DRIVE_CHECK_MS and re-fetched when
 * stale — older than 3 min, or older than 1 min after the user moved (isFresh) — so it
 * follows the user while they drive, at most about once a minute. Position changes are read
 * through `getPosition`, so they never restart the polls. Without a position (or if routing
 * fails) departures still load, just without margins.
 */
export function useQuayDepartures(
  quay: Quay | null,
  /** Whether a position is known; the polls restart once when the first fix arrives. */
  located: boolean,
  getPosition: () => LatLng | null,
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
    let inFlight: Promise<number | null> | null = null;
    setState({ ...INITIAL, loading: true });

    const fetchDrive = async (from: LatLng): Promise<number | null> => {
      const cached = getDrive(quay.id);
      try {
        const route = await fetchQuayRoute(apiUrl, from[0], from[1], quay.id);
        putDrive(quay.id, { seconds: route.durationSeconds, typicalSeconds: route.typicalDurationSeconds ?? null, from });
        if (!cancelled) setState((s) => ({ ...s, routeError: false }));
        return route.durationSeconds;
      } catch {
        // Fall back to a stale drive time if we have one; only report when there is none.
        if (!cancelled) setState((s) => ({ ...s, routeError: !cached }));
        return cached?.seconds ?? null;
      }
    };

    // Current drive time in seconds: the stored one while fresh, else a new fetch (shared
    // between the drive loop and the departures poll, so they never fetch twice at once).
    const driveSeconds = (): Promise<number | null> => {
      const position = getPosition();
      if (!position) return Promise.resolve(null);
      const cached = getDrive(quay.id);
      if (isFresh(cached, position)) return Promise.resolve(cached.seconds);
      inFlight ??= fetchDrive(position).finally(() => {
        inFlight = null;
      });
      return inFlight;
    };
    const driveLoop = setInterval(() => void driveSeconds(), DRIVE_CHECK_MS);

    const refresh = async () => {
      const drive = await driveSeconds();
      if (cancelled) return;
      // The server still needs an arrival estimate to pick the next reachable departure and
      // to hide clearly missed ones; displayed margins are recomputed live by the views.
      const arrival = drive === null ? undefined : estimateArrival(Date.now(), getDrive(quay.id), getPosition())?.toISOString();
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
      clearInterval(driveLoop);
    };
    // `located` restarts the polls once when the first position arrives; later moves don't.
  }, [quay, located, getPosition, limit, getDrive, putDrive, attempt]);

  return { ...state, retry };
}
