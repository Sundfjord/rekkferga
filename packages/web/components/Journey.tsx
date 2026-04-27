"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import dynamic from "next/dynamic";
import JourneyDetails from "@/components/JourneyDetails";
import QuayCard from "@/components/QuayCard";
import FerryNotFound from "@/components/FerryNotFound";
import JourneySkeleton from "@/components/JourneySkeleton";
import ContentPanel from "@/components/ContentPanel";
import type { JourneyResult, TripState, ResultItem, FerryLeg } from "@shared/types";
import { STALE_THRESHOLD_MS, nextReachable } from "@shared/utils";
import { fetchJourney } from "@shared/services/journey";
import {
  processPosition as processPositionShared,
  refreshDepartures,
  estimateRemainingMsToNextFerry,
  type TripStateCallbacks,
} from "@shared/services/tripStateMachine";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripSimulator } from "@/hooks/useTripSimulator";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const JourneyMap = dynamic(() => import("@/components/JourneyMap"), { ssr: false });

function getRefreshIntervalMs(marginMinutes: number | null): number {
  if (marginMinutes === null) return 120_000;
  if (marginMinutes >= 10) return 180_000;
  if (marginMinutes >= 3) return 90_000;
  if (marginMinutes >= -5) return 30_000;
  return 180_000;
}

interface JourneyProps {
  destination: ResultItem;
  onExit: () => void;
}

type JourneyTab = "details" | "map";

export default function Journey({ destination, onExit }: JourneyProps) {
  const t = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const tabIdBase = useId();

  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [tripState, setTripState] = useState<TripState>("driving_to_quay");
  const [completedLegs, setCompletedLegs] = useState<Set<number>>(new Set());
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [journeyLoaded, setJourneyLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<JourneyTab>("details");
  const [showFullJourney, setShowFullJourney] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const journeyRef = useRef<JourneyResult | null>(null);
  const currentLegIndexRef = useRef(0);
  const tripStateRef = useRef<TripState>("driving_to_quay");
  const lastPositionTimeRef = useRef(Date.now());
  const watchIdRef = useRef<number | null>(null);
  const userLocationRef = useRef<[number, number] | null>(null);
  const lastRemainingMsAtFixRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshAtRef = useRef<Date | null>(null);
  const doRefreshRef = useRef<(() => Promise<void>) | undefined>(undefined);

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
        const newLegs = prev.legs.map((leg, idx) =>
          idx === legIdx
            ? { ...leg, departures, selectedDeparture: nextReachable(departures) }
            : leg
        );
        return { ...prev, legs: newLegs };
      }),
  }).current;

  // Assigned every render so it always closes over fresh refs without stale values.
  doRefreshRef.current = async () => {
    const currentJourney = journeyRef.current;
    if (!currentJourney || !API_URL) return;

    // Compute remaining drive time: use the GPS-based estimate from last fix, decayed
    // by elapsed time. Falls back to the full car leg duration if no fix has arrived yet.
    const lastRemaining = lastRemainingMsAtFixRef.current;
    let remainingMs: number;
    if (lastRemaining !== null) {
      remainingMs = Math.max(0, lastRemaining - (Date.now() - lastPositionTimeRef.current));
    } else {
      remainingMs = currentJourney.legs
        .filter((l) => l.mode === "car")
        .reduce((s, l) => s + l.duration * 1000, 0);
    }

    setIsRefreshing(true);
    try {
      await refreshDepartures(
        API_URL,
        currentJourney,
        currentLegIndexRef.current,
        remainingMs,
        tripCallbacks.updateJourneyDepartures,
      );
      const now = new Date();
      lastRefreshAtRef.current = now;
      setLastRefreshAt(now);
    } finally {
      setIsRefreshing(false);
    }

    const nextFerryLeg = journeyRef.current?.legs.find(l => l.mode === "water") as FerryLeg | undefined;
    const margin = nextFerryLeg?.selectedDeparture?.marginMinutes ?? null;
    if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => doRefreshRef.current?.(), getRefreshIntervalMs(margin));
  };

  // Shared position handler used by both the GPS watch and the dev simulator.
  const processCoords = useCallback((lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    userLocationRef.current = [lat, lng];
    lastPositionTimeRef.current = Date.now();

    const j = journeyRef.current;
    if (j) {
      lastRemainingMsAtFixRef.current = estimateRemainingMsToNextFerry(
        j, currentLegIndexRef.current, lat, lng,
      );
    }

    processPositionShared(lat, lng, {
      journey: journeyRef.current,
      currentLegIndex: currentLegIndexRef.current,
      tripState: tripStateRef.current,
    }, tripCallbacks);
  }, [tripCallbacks]);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    processCoords(position.coords.latitude, position.coords.longitude);
  }, [processCoords]);

  useTripSimulator({
    journey,
    injectPosition: processCoords,
    updateJourneyDepartures: tripCallbacks.updateJourneyDepartures,
    journeyRef,
    currentLegIndexRef,
    userLocationRef,
  });

  // Fetch journey on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
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
        userLocationRef.current = [userLat, userLng];
        lastPositionTimeRef.current = Date.now();

        if (!API_URL) { setError(t("error")); return; }
        const journeys = await fetchJourney(API_URL, userLat, userLng, destination.latitude, destination.longitude);
        if (cancelled) return;
        if (!journeys.length) { setError(t("noRouteQuays")); return; }

        const serverJourney = journeys[0];
        journeyRef.current = serverJourney;
        lastRemainingMsAtFixRef.current = estimateRemainingMsToNextFerry(serverJourney, 0, userLat, userLng);
        setJourney(serverJourney);
        setFitBoundsSignal((s) => s + 1);
        setJourneyLoaded(true);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof GeolocationPositionError) {
          setError(t("unavailable"));
        } else {
          setError(t("error"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  // Start GPS watch and margin-adaptive departure refresh once journey is loaded
  useEffect(() => {
    if (!journeyLoaded) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    // If GPS stops updating, silently re-register watchPosition with maximumAge: 0
    // to force a fresh fix rather than showing a banner.
    const staleCheckTimer = setInterval(() => {
      if (Date.now() - lastPositionTimeRef.current > STALE_THRESHOLD_MS) {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          () => {},
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      }
    }, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.geolocation.getCurrentPosition(handlePosition, () => {});
        const lastRefresh = lastRefreshAtRef.current;
        if (!lastRefresh || Date.now() - lastRefresh.getTime() > 30_000) {
          if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
          doRefreshRef.current?.();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const ferryLeg = journeyRef.current?.legs.find(l => l.mode === "water") as FerryLeg | undefined;
    const initialMargin = ferryLeg?.selectedDeparture?.marginMinutes ?? null;
    refreshTimerRef.current = setTimeout(() => doRefreshRef.current?.(), getRefreshIntervalMs(initialMargin));

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(staleCheckTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
      watchIdRef.current = null;
    };
  }, [journeyLoaded, handlePosition]);

  // Tear down GPS and refresh timer on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  const isFav = isFavorite(destination.id);
  const tabs: Array<{ key: JourneyTab; label: string }> = [
    { key: "details", label: t("detailsTab") },
    { key: "map", label: t("mapTab") },
  ];

  useEffect(() => {
    if (!journey || activeTab !== "map") return;
    setFitBoundsSignal((s) => s + 1);
  }, [activeTab, journey]);

  const firstFerryLeg = journey?.legs.find((l): l is FerryLeg => l.mode === "water") ?? null;
  const firstCarLeg = journey?.legs.find((l) => l.mode === "car") ?? null;
  const showQuayCard = !showFullJourney && firstFerryLeg != null;

  const handleViewFullJourney = useCallback(() => {
    setShowFullJourney(true);
    setActiveTab("details");
    setFitBoundsSignal((s) => s + 1);
  }, []);

  return (
    <ContentPanel>
      <ContentPanel.Header>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 min-w-0 text-xl font-bold truncate"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {destination.name}
          </div>
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
          <button
            onClick={onExit}
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

      {showFullJourney && journey && !isLoading && !error && (
        <div className="flex-shrink-0 px-4 py-2 xl:hidden" style={{ backgroundColor: "var(--surface)" }}>
          <div
            role="tablist"
            aria-label={t("journeyViews")}
            className="grid grid-cols-2 gap-2 rounded-xl p-2"
            style={{
              backgroundColor: "var(--surface-variant)",
              border: "1px solid var(--border)",
            }}
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              const tabId = `${tabIdBase}-tab-${tab.key}`;
              return (
                <button
                  key={tab.key}
                  id={tabId}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={`${tabIdBase}-panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className="cursor-pointer rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    backgroundColor: isSelected ? "var(--surface)" : "transparent",
                    border: isSelected ? "1px solid var(--border)" : "1px solid transparent",
                    color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: isSelected ? "0 1px 2px rgba(1,22,56,0.10)" : "none",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ContentPanel.Body fullHeight>
        {isLoading && <JourneySkeleton />}
        {error && (
          <div className="p-4 text-sm w-full"
            style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
          >
            {error}
          </div>
        )}
        {journey && !firstFerryLeg && <FerryNotFound />}
        {journey && showQuayCard && firstFerryLeg && (
          <QuayCard
            driveDuration={firstCarLeg?.duration ?? 0}
            fromQuayName={firstFerryLeg.fromPlace.name}
            toQuayName={firstFerryLeg.toPlace.name}
            departures={firstFerryLeg.departures ?? []}
            selectedDeparture={firstFerryLeg.selectedDeparture ?? null}
            onViewFullJourney={handleViewFullJourney}
            lastRefreshAt={lastRefreshAt}
            isRefreshing={isRefreshing}
          />
        )}
        {journey && showFullJourney && (
          <div className="flex flex-1 min-h-0 rounded-b-2xl flex-col xl:flex-row">
            <div
              id={`${tabIdBase}-panel-details`}
              role="tabpanel"
              aria-labelledby={`${tabIdBase}-tab-details`}
              className={`${activeTab === "details" ? "flex" : "hidden"} xl:flex min-h-0 overflow-hidden xl:w-96 xl:flex-none`}
              style={{ backgroundColor: "var(--surface)" }}
            >
              <JourneyDetails
                journey={journey}
                destination={destination}
                currentLegIndex={currentLegIndex}
                tripState={tripState}
                lastRefreshAt={lastRefreshAt}
                isRefreshing={isRefreshing}
              />
            </div>
            <div
              id={`${tabIdBase}-panel-map`}
              role="tabpanel"
              aria-labelledby={`${tabIdBase}-tab-map`}
              className={`${activeTab === "map" ? "flex" : "hidden"} xl:flex flex-1 min-h-0 overflow-hidden`}
            >
              <JourneyMap
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
