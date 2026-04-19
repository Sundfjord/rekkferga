"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Search from "@/components/Search";
import TripPanel from "@/components/TripPanel";
import type { SearchResult, JourneyResult, FerryLeg, TripState } from "@shared/types";
import { STALE_THRESHOLD_MS } from "@shared/utils";
import { fetchJourney, fetchDeparturesForLeg } from "@shared/services/journey";
import { processPosition as processPositionShared, refreshDepartures, type TripStateCallbacks } from "@shared/services/tripStateMachine";
import { useTranslation } from "@/hooks/useTranslation";

const Map = dynamic<{
  journey: JourneyResult | null;
  userLocation: [number, number] | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
  fitBoundsSignal?: number;
}>(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const t = useTranslation();

  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [tripState, setTripState] = useState<TripState>("driving_to_quay");
  const [stalePosition, setStalePosition] = useState(false);
  const [completedLegs, setCompletedLegs] = useState<Set<number>>(new Set());
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [isSidebar, setIsSidebar] = useState(false);
  const [journeyLoaded, setJourneyLoaded] = useState(false);

  const journeyRef = useRef<JourneyResult | null>(null);
  const currentLegIndexRef = useRef(0);
  const tripStateRef = useRef<TripState>("driving_to_quay");
  const lastPositionTimeRef = useRef(Date.now());
  const watchIdRef = useRef<number | null>(null);

  // Sidebar breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    setIsSidebar(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSidebar(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Keep refs in sync
  useEffect(() => { journeyRef.current = journey; }, [journey]);
  useEffect(() => {
    currentLegIndexRef.current = currentLegIndex;
    tripStateRef.current = tripState;
  }, [currentLegIndex, tripState]);

  const tripCallbacks = useRef<TripStateCallbacks>({
    setTripState: (state) => { setTripState(state); tripStateRef.current = state; },
    setCurrentLegIndex: (index) => { setCurrentLegIndex(index); currentLegIndexRef.current = index; },
    addCompletedLeg: (index) => setCompletedLegs((prev) => new Set([...prev, index])),
    updateJourneyDepartures: (legIdx, departures) =>
      setJourney((prev) => {
        if (!prev) return prev;
        const newLegs = prev.legs.map((leg, idx) => idx === legIdx ? { ...leg, departures } : leg);
        return { ...prev, legs: newLegs };
      }),
  }).current;

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    setUserLocation([lat, lng]);
    lastPositionTimeRef.current = Date.now();
    setStalePosition(false);

    processPositionShared(lat, lng, {
      journey: journeyRef.current,
      currentLegIndex: currentLegIndexRef.current,
      tripState: tripStateRef.current,
    }, tripCallbacks);

    const currentJourney = journeyRef.current;
    if (currentJourney && API_URL) {
      refreshDepartures(API_URL, currentJourney, currentLegIndexRef.current, lat, lng, tripCallbacks.updateJourneyDepartures);
    }
  }, [tripCallbacks]);

  // Start GPS watch once journey is loaded, tear down on exit
  useEffect(() => {
    if (!journeyLoaded) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    const staleTimer = setInterval(() => {
      if (Date.now() - lastPositionTimeRef.current > STALE_THRESHOLD_MS) setStalePosition(true);
    }, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.geolocation.getCurrentPosition(handlePosition, () => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(staleTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      watchIdRef.current = null;
    };
  }, [journeyLoaded, handlePosition]);

  const handleDestinationSelect = useCallback(async (result: SearchResult) => {
    // Tear down any existing GPS watch before starting fresh
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setDestination(result);
    setError(null);
    setIsLoading(true);
    setJourney(null);
    setJourneyLoaded(false);
    setCurrentLegIndex(0);
    setTripState("driving_to_quay");
    setCompletedLegs(new Set());
    setStalePosition(false);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      setUserLocation([userLat, userLng]);

      if (!API_URL) { setError(t("error")); return; }
      const journeys = await fetchJourney(API_URL, userLat, userLng, result.latitude, result.longitude);
      if (!journeys.length) {
        setError(t("noRouteQuays"));
        return;
      }

      const base = journeys[0];
      const hydratedLegs = await Promise.all(
        base.legs.map(async (leg, index) => {
          if (leg.mode !== "water") return leg;
          const prevLeg = index > 0 ? base.legs[index - 1] : null;
          const driveDurationMs = (prevLeg?.duration ?? 0) * 1000;
          const arrivalTime = new Date(Date.now() + driveDurationMs).toISOString();
          const departures = await fetchDeparturesForLeg(API_URL!, leg as FerryLeg, arrivalTime);
          return { ...leg, departures };
        })
      );

      const hydratedJourney = { ...base, legs: hydratedLegs };
      journeyRef.current = hydratedJourney;
      setJourney(hydratedJourney);
      setFitBoundsSignal((s) => s + 1);
      setJourneyLoaded(true);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError(t("unavailable"));
      } else {
        setError(t("error"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleExit = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setJourney(null);
    setDestination(null);
    setJourneyLoaded(false);
    setCurrentLegIndex(0);
    setTripState("driving_to_quay");
    setCompletedLegs(new Set());
    setStalePosition(false);
    setError(null);
  }, []);

  // ── Sidebar layout (≥1280px) ──────────────────────────────────────────────
  if (isSidebar) {
    return (
      <div className="flex h-full gap-4 p-4 overflow-hidden">
        {/* Left column — search + trip details, separated cards */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
          {/* Search card */}
          <div
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--surface)", boxShadow: "0 4px 24px rgba(1,22,56,0.18)" }}
          >
            <div className="px-4 pt-4 pb-4">
              <Search onSelect={handleDestinationSelect} />
            </div>
            {isLoading && (
              <div
                className="mx-4 mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                style={{ backgroundColor: "var(--surface-variant)", color: "var(--text-secondary)" }}
              >
                <div
                  className="animate-spin rounded-full h-4 w-4 border-2 flex-shrink-0"
                  style={{ borderColor: "var(--water-light)", borderTopColor: "transparent" }}
                />
                {t("searchingForQuays")}
              </div>
            )}
            {error && (
              <div
                className="mx-4 mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Trip details card */}
          {journey && destination && (
            <div
              className="flex-1 min-h-0 rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--surface)", boxShadow: "0 4px 24px rgba(1,22,56,0.18)" }}
            >
              <TripPanel
                journey={journey}
                destination={destination}
                currentLegIndex={currentLegIndex}
                tripState={tripState}
                onExit={handleExit}
                stalePosition={stalePosition}
                sidebar
              />
            </div>
          )}
        </div>

        {/* Map card */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(1,22,56,0.18)" }}>
          <Map
            journey={journey}
            userLocation={userLocation}
            completedLegs={completedLegs}
            followUser={!!journey}
            fitBoundsSignal={fitBoundsSignal}
          />
        </div>
      </div>
    );
  }

  // ── Mobile / narrow layout ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar — always at top */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        <Search onSelect={handleDestinationSelect} />
      </div>

      {isLoading && (
        <div className="flex-shrink-0 mx-3 mb-2 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          style={{ backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}
        >
          <div
            className="animate-spin rounded-full h-4 w-4 border-2 flex-shrink-0"
            style={{ borderColor: "var(--water-light)", borderTopColor: "transparent" }}
          />
          {t("searchingForQuays")}
        </div>
      )}
      {error && (
        <div className="flex-shrink-0 mx-3 mb-2 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      {journey && destination ? (
        <>
          <div className="flex-shrink-0 px-3 pb-2">
            <TripPanel
              journey={journey}
              destination={destination}
              currentLegIndex={currentLegIndex}
              tripState={tripState}
              onExit={handleExit}
              stalePosition={stalePosition}
            />
          </div>
          <div className="flex-1 relative overflow-hidden">
            <Map
              journey={journey}
              userLocation={userLocation}
              completedLegs={completedLegs}
              followUser
              fitBoundsSignal={fitBoundsSignal}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
