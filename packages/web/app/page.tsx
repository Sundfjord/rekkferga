"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import ContentPanel from "@/components/ContentPanel";
import Search from "@/components/Search";
import type { SearchHandle } from "@/components/Search";
import TripPanel from "@/components/TripPanel";
import type { JourneyResult, FerryLeg, TripState, ResultItem } from "@shared/types";
import { STALE_THRESHOLD_MS } from "@shared/utils";
import { fetchJourney, fetchDeparturesForLeg } from "@shared/services/journey";
import { processPosition as processPositionShared, refreshDepartures, type TripStateCallbacks } from "@shared/services/tripStateMachine";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";

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
  const [destination, setDestination] = useState<ResultItem | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [tripState, setTripState] = useState<TripState>("driving_to_quay");
  const [stalePosition, setStalePosition] = useState(false);
  const [completedLegs, setCompletedLegs] = useState<Set<number>>(new Set());
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [journeyLoaded, setJourneyLoaded] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();

  const searchRef = useRef<SearchHandle>(null);
  const journeyRef = useRef<JourneyResult | null>(null);
  const currentLegIndexRef = useRef(0);
  const tripStateRef = useRef<TripState>("driving_to_quay");
  const lastPositionTimeRef = useRef(Date.now());
  const watchIdRef = useRef<number | null>(null);

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

  const handleDestinationSelect = useCallback(async (result: ResultItem) => {
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
      // Hydrate ferry legs sequentially — each needs the cumulative travel time
      // from all preceding legs to compute a correct arrival estimate.
      const hydratedLegs: typeof base.legs = [];
      let cumulativeMs = 0;
      for (let index = 0; index < base.legs.length; index++) {
        const leg = base.legs[index];
        if (leg.mode !== "water") {
          cumulativeMs += leg.duration * 1000;
          hydratedLegs.push(leg);
          continue;
        }
        const arrivalTime = new Date(Date.now() + cumulativeMs).toISOString();
        const departures = await fetchDeparturesForLeg(API_URL!, leg as FerryLeg, arrivalTime);
        // After fetching departures, add the ferry crossing duration + any wait time
        const dep = departures.find((d) => d.marginMinutes !== null && d.marginMinutes >= 0) ?? departures[0];
        if (dep) {
          // Wait = time from arrival at quay until departure
          const arriveAtQuayMs = Date.now() + cumulativeMs;
          const depTimeMs = new Date(dep.expectedDepartureTime).getTime();
          const waitMs = Math.max(0, depTimeMs - arriveAtQuayMs);
          cumulativeMs += waitMs + leg.duration * 1000;
        } else {
          cumulativeMs += leg.duration * 1000;
        }
        hydratedLegs.push({ ...leg, departures });
      }

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

  const refreshPosition = useCallback(() => {
    navigator.geolocation.getCurrentPosition(handlePosition, () => {});
  }, [handlePosition]);

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

  const hasDestination = !!(destination);

  if (!hasDestination) {
    return (
      <Search
        ref={searchRef}
        onSelect={handleDestinationSelect}
      />
    )
  }

  const isFav = isFavorite(destination.id);
  return (
    <ContentPanel>
      <ContentPanel.Header>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 min-w-0 text-lg font-bold truncate"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {destination.name}
          </div>
          {destination && (
            <button
              onClick={() => toggleFavorite(destination)}
              aria-label={isFav ? t("removeFavorite") : t("addFavorite")}
              className="flex-shrink-0 p-1 transition-colors cursor-pointer"
              style={{ color: isFav ? "#ef4444" : "var(--text-secondary)" }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isFav ? 0 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleExit}
            aria-label={t("close") ?? "Close"}
            className="flex-shrink-0 p-1 transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </ContentPanel.Header>

      <ContentPanel.Body fullHeight>
        {!!journey && (
          <div className="flex flex-col xl:flex-row flex-1 min-h-0 rounded-b-2xl">
            <div
              className="flex-shrink-0 xl:w-96 xl:flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: "var(--surface)", boxShadow: "0 4px 24px rgba(1,22,56,0.18)" }}
            >
              <TripPanel
                journey={journey}
                destination={destination}
                currentLegIndex={currentLegIndex}
                tripState={tripState}
                stalePosition={stalePosition}
                onRefreshPosition={refreshPosition}
              />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(1,22,56,0.18)" }}>
              <Map
                journey={journey}
                userLocation={userLocation}
                completedLegs={completedLegs}
                followUser
                fitBoundsSignal={fitBoundsSignal}
              />
            </div>
          </div> 
        )}
      </ContentPanel.Body>
    </ContentPanel>
  );
}
