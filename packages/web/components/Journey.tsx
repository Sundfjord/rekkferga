"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import dynamic from "next/dynamic";
import JourneyDetails from "@/components/JourneyDetails";
import JourneySkeleton from "@/components/JourneySkeleton";
import ContentPanel from "@/components/ContentPanel";
import type { JourneyResult, TripState, ResultItem } from "@shared/types";
import { STALE_THRESHOLD_MS } from "@shared/utils";
import { fetchJourney } from "@shared/services/journey";
import { processPosition as processPositionShared, refreshDepartures, type TripStateCallbacks } from "@shared/services/tripStateMachine";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const JourneyMap = dynamic(() => import("@/components/JourneyMap"), { ssr: false });

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
  const [stalePosition, setStalePosition] = useState(false);
  const [completedLegs, setCompletedLegs] = useState<Set<number>>(new Set());
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [journeyLoaded, setJourneyLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<JourneyTab>("details");

  const journeyRef = useRef<JourneyResult | null>(null);
  const currentLegIndexRef = useRef(0);
  const tripStateRef = useRef<TripState>("driving_to_quay");
  const lastPositionTimeRef = useRef(Date.now());
  const watchIdRef = useRef<number | null>(null);

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

        if (!API_URL) { setError(t("error")); return; }
        const journeys = await fetchJourney(API_URL, userLat, userLng, destination.latitude, destination.longitude);
        if (cancelled) return;
        if (!journeys.length) { setError(t("noRouteQuays")); return; }

        const serverJourney = journeys[0];
        journeyRef.current = serverJourney;
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

  // Start GPS watch once journey is loaded
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

  // Tear down GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const refreshPosition = useCallback(() => {
    navigator.geolocation.getCurrentPosition(handlePosition, () => {});
  }, [handlePosition]);

  const isFav = isFavorite(destination.id);
  const tabs: Array<{ key: JourneyTab; label: string }> = [
    { key: "details", label: t("detailsTab") },
    { key: "map", label: t("mapTab") },
  ];

  useEffect(() => {
    if (!journey || activeTab !== "map") return;
    setFitBoundsSignal((s) => s + 1);
  }, [activeTab, journey]);

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

      {journey && !isLoading && !error && (
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
        {journey && (
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
                stalePosition={stalePosition}
                onRefreshPosition={refreshPosition}
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
