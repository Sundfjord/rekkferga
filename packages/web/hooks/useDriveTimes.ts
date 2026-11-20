"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { calculateDistance } from "@shared/utils";
import type { LatLng } from "@/hooks/usePosition";

/** A quay's drive time, where it was measured from and when (ms since epoch). */
export interface DriveTime {
  seconds: number;
  /** With usual traffic for this time; null when HERE has none. */
  typicalSeconds: number | null;
  from: LatLng;
  at: number;
}

/** A drive time is re-fetched when older than this… */
const MAX_AGE_MS = 3 * 60_000;
/** …or, once at least MIN_AGE_MS old, when the user has moved more than MOVED_KM since. */
const MIN_AGE_MS = 60_000;
const MOVED_KM = 0.3;
/** Moved this far since the fetch → the user is on the way (see estimateArrival). */
const ON_THE_WAY_KM = 0.15;

const kmBetween = (a: LatLng, b: LatLng) => calculateDistance(a[0], a[1], b[0], b[1]);

/** Whether a stored drive time still describes the trip from `position`. */
export function isFresh(drive: DriveTime | undefined, position: LatLng | null, now = Date.now()): drive is DriveTime {
  if (!drive) return false;
  const age = now - drive.at;
  if (age >= MAX_AGE_MS) return false;
  return !position || age < MIN_AGE_MS || kmBetween(drive.from, position) <= MOVED_KM;
}

/**
 * Estimated arrival at the quay. Once the user has moved since the drive time was fetched,
 * they're driving, so the arrival stays where it was (fetch time + drive time) instead of
 * sliding with the clock; standing still, it's now + drive time.
 */
export function estimateArrival(now: number, drive: DriveTime | undefined, position: LatLng | null): Date | null {
  if (!drive) return null;
  const onTheWay = position !== null && kmBetween(drive.from, position) > ON_THE_WAY_KM;
  return new Date((onTheWay ? drive.at : now) + drive.seconds * 1000);
}

/** Time left to the quay (seconds, never negative) from an estimateArrival result. */
export const secondsUntil = (arrivalAt: Date, now: number) => Math.max(0, (arrivalAt.getTime() - now) / 1000);

export interface DriveTimes {
  /** Latest drive time for a quay, if any. Stable identity — safe in effect deps. */
  get: (quayId: string) => DriveTime | undefined;
  /** Record a newly fetched drive time. Stable identity. */
  put: (quayId: string, drive: Omit<DriveTime, "at">) => void;
  /** Changes on every put, so render-time readers re-render. */
  version: number;
}

/**
 * One drive time per quay, shared by every view (favourites, quay overview, drive mode), so
 * they never show different numbers. Whoever fetched last wins; each entry remembers where it
 * was measured from, so moving on makes it stale (isFresh) rather than wiping the store.
 */
export function useDriveTimes(): DriveTimes {
  const store = useRef(new Map<string, DriveTime>());
  const [version, setVersion] = useState(0);

  const get = useCallback((quayId: string) => store.current.get(quayId), []);
  const put = useCallback((quayId: string, drive: Omit<DriveTime, "at">) => {
    store.current.set(quayId, { ...drive, at: Date.now() });
    setVersion((v) => v + 1);
  }, []);

  return useMemo(() => ({ get, put, version }), [get, put, version]);
}
