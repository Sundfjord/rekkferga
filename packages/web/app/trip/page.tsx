"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { JourneyResult, FerryLeg, CarLeg, DepartureOption, SearchResult } from "@shared/types";
import { calculateDistance } from "@shared/utils";
import TripPanel, { type TripState } from "@/components/TripPanel";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const QUAY_PROXIMITY_KM = 0.2;
const DESTINATION_PROXIMITY_KM = 0.2;
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

function estimateRemainingSeconds(leg: CarLeg, currentLat: number, currentLng: number): number {
  const geometry = leg.geometry;
  const endLat = leg.toPlace.latitude ?? 0;
  const endLng = leg.toPlace.longitude ?? 0;

  if (!geometry || geometry.length < 2) {
    const totalKm = leg.distance / 1000;
    const remainingKm = calculateDistance(currentLat, currentLng, endLat, endLng);
    return totalKm > 0 ? leg.duration * Math.min(1, remainingKm / totalKm) : leg.duration;
  }

  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < geometry.length; i++) {
    const d = calculateDistance(currentLat, currentLng, geometry[i][0], geometry[i][1]);
    if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
  }

  let remainingKm = 0;
  let totalKm = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = calculateDistance(geometry[i][0], geometry[i][1], geometry[i + 1][0], geometry[i + 1][1]);
    totalKm += d;
    if (i >= nearestIdx) remainingKm += d;
  }

  return totalKm > 0 ? leg.duration * (remainingKm / totalKm) : leg.duration;
}

async function fetchDepartures(
  quayId: string,
  arrivalTime: string,
  destName: string
): Promise<DepartureOption[]> {
  if (!quayId || !API_URL) return [];
  try {
    const res = await fetch(
      `${API_URL}/quay/departures?quayId=${quayId}&arrivalTime=${encodeURIComponent(arrivalTime)}`
    );
    if (!res.ok) return [];
    const data: Record<string, DepartureOption[]> = await res.json();
    const key =
      Object.keys(data).find((k) => k === destName) ??
      Object.keys(data).find((k) => k.toLowerCase() === destName.toLowerCase()) ??
      Object.keys(data)[0];
    return key ? (data[key] ?? []) : [];
  } catch {
    return [];
  }
}

export default function TripPage() {
  const router = useRouter();
  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [tripState, setTripState] = useState<TripState>('driving_to_quay');
  const [stalePosition, setStalePosition] = useState(false);
  const [completedLegs, setCompletedLegs] = useState<Set<number>>(new Set());
  const [journeyLoaded, setJourneyLoaded] = useState(false);
  const [isSidebar, setIsSidebar] = useState(false);

  const journeyRef = useRef<JourneyResult | null>(null);
  const currentLegIndexRef = useRef(0);
  const tripStateRef = useRef<TripState>('driving_to_quay');
  const lastPositionTimeRef = useRef(Date.now());
  const watchIdRef = useRef<number | null>(null);

  // Sidebar breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    setIsSidebar(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSidebar(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keep refs in sync with state
  useEffect(() => { journeyRef.current = journey; }, [journey]);
  useEffect(() => {
    currentLegIndexRef.current = currentLegIndex;
    tripStateRef.current = tripState;
  }, [currentLegIndex, tripState]);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const j = sessionStorage.getItem('trip_journey');
      const d = sessionStorage.getItem('trip_destination');
      if (j && d) {
        const parsedJourney = JSON.parse(j) as JourneyResult;
        const parsedDest = JSON.parse(d) as SearchResult;
        journeyRef.current = parsedJourney;
        setJourney(parsedJourney);
        setDestination(parsedDest);
        setJourneyLoaded(true);
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  }, [router]);

  const refreshDepartures = useCallback(async (
    currentJourney: JourneyResult,
    legIndex: number,
    lat: number,
    lng: number
  ) => {
    const legs = currentJourney.legs;
    for (let i = legIndex; i < legs.length; i++) {
      if (legs[i].mode !== 'water') continue;
      const ferryLeg = legs[i] as FerryLeg;
      if (!ferryLeg.fromQuayId) continue;

      // Estimate remaining drive time to this ferry
      let remainingMs = 0;
      for (let j = legIndex; j < i; j++) {
        if (legs[j].mode === 'car') {
          remainingMs += j === legIndex
            ? estimateRemainingSeconds(legs[j] as CarLeg, lat, lng) * 1000
            : legs[j].duration * 1000;
        }
      }

      const arrivalTime = new Date(Date.now() + remainingMs).toISOString();
      const departures = await fetchDepartures(ferryLeg.fromQuayId, arrivalTime, ferryLeg.toPlace.name);

      setJourney((prev) => {
        if (!prev) return prev;
        const newLegs = prev.legs.map((leg, idx) => idx === i ? { ...leg, departures } : leg);
        return { ...prev, legs: newLegs };
      });
      break; // Only refresh the nearest upcoming ferry
    }
  }, []);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    setUserLocation([lat, lng]);
    lastPositionTimeRef.current = Date.now();
    setStalePosition(false);

    const currentJourney = journeyRef.current;
    if (!currentJourney) return;

    const legs = currentJourney.legs;
    let legIndex = currentLegIndexRef.current;
    const state = tripStateRef.current;

    // Check arrival at final destination
    const lastLeg = legs[legs.length - 1];
    if (
      lastLeg?.toPlace.latitude != null &&
      lastLeg?.toPlace.longitude != null &&
      calculateDistance(lat, lng, lastLeg.toPlace.latitude, lastLeg.toPlace.longitude) < DESTINATION_PROXIMITY_KM
    ) {
      setTripState('arrived');
      tripStateRef.current = 'arrived';
      return;
    }

    if (legIndex >= legs.length) return;

    const currentLeg = legs[legIndex];

    // Car leg transitions
    if (currentLeg.mode === 'car') {
      const nextLeg = legs[legIndex + 1];
      const targetLat = nextLeg?.fromPlace.latitude ?? currentLeg.toPlace.latitude;
      const targetLng = nextLeg?.fromPlace.longitude ?? currentLeg.toPlace.longitude;

      if (targetLat != null && targetLng != null) {
        const dist = calculateDistance(lat, lng, targetLat, targetLng);
        if (dist < QUAY_PROXIMITY_KM) {
          const newIndex = legIndex + 1;
          setCompletedLegs((prev) => new Set([...prev, legIndex]));
          setCurrentLegIndex(newIndex);
          currentLegIndexRef.current = newIndex;
          setTripState(nextLeg?.mode === 'water' ? 'at_quay' : 'driving_to_quay');
          tripStateRef.current = nextLeg?.mode === 'water' ? 'at_quay' : 'driving_to_quay';
          legIndex = newIndex;
        }
      }
    }

    // Ferry leg transitions
    if (legIndex < legs.length && legs[legIndex].mode === 'water') {
      const ferryLeg = legs[legIndex] as FerryLeg;

      if (state === 'at_quay') {
        const firstDep = ferryLeg.departures?.[0];
        if (firstDep && new Date(firstDep.expectedDepartureTime).getTime() < Date.now()) {
          setTripState('crossing');
          tripStateRef.current = 'crossing';
        }
      }

      if (state === 'crossing' && ferryLeg.toPlace.latitude != null && ferryLeg.toPlace.longitude != null) {
        const dist = calculateDistance(lat, lng, ferryLeg.toPlace.latitude, ferryLeg.toPlace.longitude);
        if (dist < QUAY_PROXIMITY_KM) {
          const newIndex = legIndex + 1;
          setCompletedLegs((prev) => new Set([...prev, legIndex]));
          setCurrentLegIndex(newIndex);
          currentLegIndexRef.current = newIndex;
          const nextState: TripState = newIndex < legs.length ? 'driving_to_quay' : 'arrived';
          setTripState(nextState);
          tripStateRef.current = nextState;
          legIndex = newIndex;
        }
      }
    }

    refreshDepartures(currentJourney, currentLegIndexRef.current, lat, lng);
  }, [refreshDepartures]);

  // Start GPS tracking once journey is loaded
  useEffect(() => {
    if (!journeyLoaded) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    const staleTimer = setInterval(() => {
      if (Date.now() - lastPositionTimeRef.current > STALE_THRESHOLD_MS) {
        setStalePosition(true);
      }
    }, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        navigator.geolocation.getCurrentPosition(handlePosition, () => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(staleTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [journeyLoaded, handlePosition]);

  const handleExit = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    sessionStorage.removeItem('trip_journey');
    sessionStorage.removeItem('trip_destination');
    router.push('/');
  }, [router]);

  if (!journey || !destination) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading trip...</div>
      </div>
    );
  }

  if (isSidebar) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="w-96 flex-shrink-0 h-full">
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
        <div className="flex-1 relative h-full overflow-hidden">
          <Map
            journey={journey}
            userLocation={userLocation}
            completedLegs={completedLegs}
            followUser
            disableFitBounds={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <Map
        journey={journey}
        userLocation={userLocation}
        completedLegs={completedLegs}
        followUser
        disableFitBounds={false}
      />
      <TripPanel
        journey={journey}
        destination={destination}
        currentLegIndex={currentLegIndex}
        tripState={tripState}
        onExit={handleExit}
        stalePosition={stalePosition}
      />
    </div>
  );
}
