"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** A quay's drive time and when it was fetched (ms since epoch). */
export interface DriveTime {
  seconds: number;
  at: number;
}

/** How long a cached drive time is trusted before the quay view fetches a new one. */
export const DRIVE_FRESH_MS = 3 * 60_000;

export interface DriveTimes {
  /** Latest drive time for a quay, if any. Stable identity — safe in effect deps. */
  get: (quayId: string) => DriveTime | undefined;
  /** Record a newly fetched drive time. Stable identity. */
  put: (quayId: string, seconds: number) => void;
  /** Changes on every put, so render-time readers re-render. */
  version: number;
}

/**
 * One drive time per quay, shared by every view (favourites, quay overview, drive mode), so
 * they never show different numbers. Whoever fetched last wins; cleared when the user's
 * position changes.
 */
export function useDriveTimes(userLocation: [number, number] | null): DriveTimes {
  const store = useRef(new Map<string, DriveTime>());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    store.current = new Map();
    setVersion((v) => v + 1);
  }, [userLocation]);

  const get = useCallback((quayId: string) => store.current.get(quayId), []);
  const put = useCallback((quayId: string, seconds: number) => {
    store.current.set(quayId, { seconds, at: Date.now() });
    setVersion((v) => v + 1);
  }, []);

  return useMemo(() => ({ get, put, version }), [get, put, version]);
}
