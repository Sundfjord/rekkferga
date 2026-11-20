"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calculateDistance } from "@shared/utils";

export type LatLng = [number, number];

/** How far (km) the user must move before `location` — the coarse position — updates. */
const LOCATION_STEP_KM = 1;
/** Give up waiting for a first answer (e.g. the permission prompt is left open) after this long. */
const SETTLE_FALLBACK_MS = 8_000;

export interface Position {
  /** Latest GPS fix; updates on every fix while the page is open. For render-time estimates. */
  position: LatLng | null;
  /**
   * Coarse position: the first fix, then only after a move of LOCATION_STEP_KM. For things
   * that re-fetch or re-sort when it changes (favourites, place search).
   */
  location: LatLng | null;
  /**
   * The first answer is in: a fix, an error (denied, unavailable, timeout), no geolocation at
   * all, or SETTLE_FALLBACK_MS passed. Lets position-dependent loads wait for it instead of
   * loading once without a position and again with one.
   */
  settled: boolean;
  /** Latest fix without re-rendering — for polls, which must not restart on every fix. Stable. */
  getPosition: () => LatLng | null;
}

/** Follows the user's position (watchPosition), so drive times stay current while driving. */
export function usePosition(): Position {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [settled, setSettled] = useState(false);
  const latest = useRef<LatLng | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSettled(true);
      return;
    }
    const fallback = setTimeout(() => setSettled(true), SETTLE_FALLBACK_MS);
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const fix: LatLng = [p.coords.latitude, p.coords.longitude];
        latest.current = fix;
        setPosition(fix);
        setSettled(true);
        setLocation((prev) => (!prev || calculateDistance(prev[0], prev[1], fix[0], fix[1]) >= LOCATION_STEP_KM ? fix : prev));
      },
      () => setSettled(true),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 10_000 },
    );
    return () => {
      clearTimeout(fallback);
      navigator.geolocation.clearWatch(id);
    };
  }, []);

  const getPosition = useCallback(() => latest.current, []);
  return { position, location, settled, getPosition };
}
