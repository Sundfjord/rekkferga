"use client";

import { useEffect, useState } from "react";
import type { Quay, QuayRoute, DepartureOption } from "@shared/types";
import { fetchQuayRoute, fetchQuayDepartures } from "@shared/services/quay";

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
  route: QuayRoute | null;
  departures: DepartureOption[];
  /** True from selection until the first departures have arrived. */
  loading: boolean;
  /** True during background polls after the first load. */
  isRefreshing: boolean;
  lastRefreshAt: Date | null;
}

const INITIAL: QuayDeparturesState = {
  route: null,
  departures: [],
  loading: false,
  isRefreshing: false,
  lastRefreshAt: null,
};

/**
 * For the selected quay: fetch the drive route (when the user's position is known), then
 * poll departures with a live arrival estimate. Without a position (or if routing fails)
 * departures are still shown, just without margins.
 */
export function useQuayDepartures(
  quay: Quay | null,
  userLocation: [number, number] | null,
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

    const refreshDepartures = async (driveSeconds: number | null) => {
      const arrival =
        driveSeconds === null ? undefined : new Date(Date.now() + driveSeconds * 1000).toISOString();
      const data = await fetchQuayDepartures(apiUrl, quay.id, arrival);
      if (cancelled) return;
      setState((s) => ({
        ...s,
        departures: data.departures,
        loading: false,
        isRefreshing: false,
        lastRefreshAt: new Date(),
      }));
      const margin = data.selectedDeparture?.marginMinutes ?? null;
      timer = setTimeout(() => {
        setState((s) => ({ ...s, isRefreshing: true }));
        refreshDepartures(driveSeconds);
      }, getRefreshIntervalMs(margin));
    };

    (async () => {
      let driveSeconds: number | null = null;
      if (userLocation) {
        const route = await fetchQuayRoute(apiUrl, userLocation[0], userLocation[1], quay.id);
        if (cancelled) return;
        setState((s) => ({ ...s, route }));
        driveSeconds = route?.durationSeconds ?? null;
      }
      await refreshDepartures(driveSeconds);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [quay, userLocation]);

  return state;
}
