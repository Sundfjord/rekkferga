"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useQuays } from "@/hooks/useQuays";
import SearchOverlay from "@/components/SearchOverlay";
import type { Quay, ResultItem, FerryLeg } from "@shared/types";
import { fetchJourney } from "@shared/services/journey";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { quays } = useQuays();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedQuay, setSelectedQuay] = useState<Quay | null>(null);
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserLocation([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleSelectQuay = useCallback((quay: Quay) => {
    setSelectedQuay(quay);
    setFitBoundsSignal((s) => s + 1);
  }, []);

  // Destination search: resolve to the FIRST ferry quay on the route, then behave as a
  // quay selection. (Deliberately shallow — see plan / reflections.)
  const handleSelectDestination = useCallback(
    async (result: ResultItem) => {
      if (!API_URL || !userLocation) return;
      const journeys = await fetchJourney(
        API_URL,
        userLocation[0],
        userLocation[1],
        result.latitude,
        result.longitude,
      );
      const firstFerry = journeys[0]?.legs.find(
        (l): l is FerryLeg => l.mode === "water",
      );
      const quay = firstFerry?.fromQuayId
        ? quays.find((q) => q.id === firstFerry.fromQuayId)
        : undefined;
      if (quay) handleSelectQuay(quay);
    },
    [userLocation, quays, handleSelectQuay],
  );

  return (
    <div className="absolute inset-0">
      <MapView
        quays={quays}
        userLocation={userLocation}
        selectedQuay={selectedQuay}
        route={null}
        onSelectQuay={handleSelectQuay}
        fitBoundsSignal={fitBoundsSignal}
      />
      <SearchOverlay
        quays={quays}
        onSelectQuay={handleSelectQuay}
        onSelectDestination={handleSelectDestination}
      />
    </div>
  );
}
