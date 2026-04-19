import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ActivityIndicator, KeyboardAvoidingView, Platform, AppState, type AppStateStatus } from "react-native";
import {
  requestForegroundPermissionsAsync,
  watchPositionAsync,
  getCurrentPositionAsync,
  Accuracy,
  type LocationSubscription,
} from "expo-location";
import type { SearchResult, JourneyResult, FerryLeg, TripState } from "@shared/types";
import { STALE_THRESHOLD_MS } from "@shared/utils";
import { fetchJourney, fetchDeparturesForLeg } from "@shared/services/journey";
import { processPosition as processPositionShared, refreshDepartures, type TripStateCallbacks } from "@shared/services/tripStateMachine";
import { useTranslation } from "@/hooks/useTranslation";
import Map from "@/components/Map";
import Search from "@/components/Search";
import TripPanel from "@/components/TripPanel";
import { useThemeColors } from "../contexts/ThemeContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Latest position at module level so AppState resume can read it immediately
let latestPosition: { latitude: number; longitude: number } | null = null;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [tripState, setTripState] = useState<TripState>("driving_to_quay");
  const [stalePosition, setStalePosition] = useState(false);
  const [completedLegs, setCompletedLegs] = useState<Set<number>>(new Set());
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);

  const journeyRef = useRef<JourneyResult | null>(null);
  const currentLegIndexRef = useRef(0);
  const tripStateRef = useRef<TripState>("driving_to_quay");
  const lastPositionTimeRef = useRef(Date.now());
  const locationSubscriptionRef = useRef<LocationSubscription | null>(null);

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

  const processPosition = useCallback((lat: number, lng: number) => {
    latestPosition = { latitude: lat, longitude: lng };
    setUserLocation({ latitude: lat, longitude: lng });
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

  // GPS tracking — starts once journey loads, tears down on exit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!journey) return;
    let active = true;

    (async () => {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted" || !active) return;
      const subscription = await watchPositionAsync(
        { accuracy: Accuracy.BestForNavigation, timeInterval: 5000, distanceInterval: 20 },
        (loc) => processPosition(loc.coords.latitude, loc.coords.longitude)
      );
      locationSubscriptionRef.current = subscription;
    })();

    const staleTimer = setInterval(() => {
      if (Date.now() - lastPositionTimeRef.current > STALE_THRESHOLD_MS) setStalePosition(true);
    }, 30_000);

    const handleAppState = async (nextState: AppStateStatus) => {
      if (nextState === "active") {
        if (latestPosition) {
          processPosition(latestPosition.latitude, latestPosition.longitude);
        } else {
          try {
            const loc = await getCurrentPositionAsync({});
            processPosition(loc.coords.latitude, loc.coords.longitude);
          } catch {}
        }
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppState);

    return () => {
      active = false;
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
      clearInterval(staleTimer);
      appStateSub.remove();
    };
  }, [!!journey]); // Only restart tracking when journey existence changes, not on departure refreshes

  const handleDestinationSelect = useCallback(async (result: SearchResult) => {
    // Stop any existing tracking
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    latestPosition = null;

    setDestination(result);
    setError(null);
    setIsLoading(true);
    setJourney(null);
    setCurrentLegIndex(0);
    setTripState("driving_to_quay");
    setCompletedLegs(new Set());
    setStalePosition(false);

    const { status } = await requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError(t("unavailable"));
      setIsLoading(false);
      return;
    }

    try {
      const { coords } = await getCurrentPositionAsync({});
      const userLat = coords.latitude;
      const userLng = coords.longitude;
      setUserLocation({ latitude: userLat, longitude: userLng });

      if (!API_URL) { setError(t("error")); setIsLoading(false); return; }
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
    } catch {
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleExit = useCallback(() => {
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
    latestPosition = null;
    setJourney(null);
    setDestination(null);
    setCurrentLegIndex(0);
    setTripState("driving_to_quay");
    setCompletedLegs(new Set());
    setStalePosition(false);
    setError(null);
  }, []);

  // ── Single layout — search bar always at top ──────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }}>
        {/* Search bar — always visible at top */}
        <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
          <Search onSelect={handleDestinationSelect} />
        </View>

        {isLoading && (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            marginHorizontal: 12, marginBottom: 8,
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: colors.surface, borderRadius: 12,
          }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.onSurface, fontSize: 14, fontFamily: "DMSans-Regular", opacity: 0.7 }}>
              {t("searchingForQuays")}
            </Text>
          </View>
        )}
        {error && (
          <View style={{
            marginHorizontal: 12, marginBottom: 8,
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: "#fef2f2", borderRadius: 12,
            borderWidth: 1, borderColor: "#fecaca",
          }}>
            <Text style={{ color: "#dc2626", fontSize: 14, fontFamily: "DMSans-Regular" }}>{error}</Text>
          </View>
        )}

        {journey && destination ? (
          <>
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <TripPanel
                journey={journey}
                destination={destination}
                currentLegIndex={currentLegIndex}
                tripState={tripState}
                onExit={handleExit}
                stalePosition={stalePosition}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Map
                journey={journey}
                userLocation={userLocation}
                completedLegs={completedLegs}
                followUser
                fitBoundsSignal={fitBoundsSignal}
              />
            </View>
          </>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
