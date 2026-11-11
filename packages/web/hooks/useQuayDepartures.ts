"use client";

import { useEffect, useState } from "react";
import type { Quay, DepartureOption } from "@shared/types";
import { fetchQuayRoute, fetchQuayDepartures } from "@shared/services/quay";
import { DRIVE_FRESH_MS, type DriveTimes } from "@/hooks/useDriveTimes";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
}

const INITIAL: QuayDeparturesState = {
  departures: [],
  loading: false,
  isRefreshing: false,
  lastRefreshAt: null,
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
  const [state, setState] = useState<QuayDeparturesState>(INITIAL);

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
      const route = await fetchQuayRoute(apiUrl, userLocation[0], userLocation[1], quay.id);
      if (route) putDrive(quay.id, route.durationSeconds);
      return route?.durationSeconds ?? cached?.seconds ?? null;
    };

    const refresh = async () => {
      const drive = await driveSeconds();
      if (cancelled) return;
      // The server still needs an arrival estimate to pick the next reachable departure and
      // to hide clearly missed ones; displayed margins are recomputed live by the views.
      const arrival = drive === null ? undefined : new Date(Date.now() + drive * 1000).toISOString();
      const data = await fetchQuayDepartures(apiUrl, quay.id, arrival, limit);
      if (cancelled) return;
      setState({ departures: data.departures, loading: false, isRefreshing: false, lastRefreshAt: new Date() });
      timer = setTimeout(() => {
        setState((s) => ({ ...s, isRefreshing: true }));
        refresh();
      }, getRefreshIntervalMs(data.selectedDeparture?.marginMinutes ?? null));
    };

    refresh();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [quay, userLocation, limit, getDrive, putDrive]);

  return state;
}
