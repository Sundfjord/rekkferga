"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useQuays } from "@/hooks/useQuays";
import SearchOverlay from "@/components/SearchOverlay";
import MarginPanel from "@/components/MarginPanel";
import type { Quay, QuayRoute, DepartureOption, ResultItem, FerryLeg } from "@shared/types";
import { fetchJourney } from "@shared/services/journey";
import { fetchQuayRoute, fetchQuayDepartures } from "@shared/services/quay";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Margin-adaptive departure poll: refresh more often as the margin tightens.
function getRefreshIntervalMs(marginMinutes: number | null): number {
  if (marginMinutes === null) return 120_000;
  if (marginMinutes >= 10) return 180_000;
  if (marginMinutes >= 3) return 90_000;
  if (marginMinutes >= -5) return 30_000;
  return 180_000;
}

export default function Home() {
  const { quays } = useQuays();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedQuay, setSelectedQuay] = useState<Quay | null>(null);
  const [route, setRoute] = useState<QuayRoute | null>(null);
  const [departures, setDepartures] = useState<DepartureOption[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    setRoute(null);
    setDepartures([]);
    setLastRefreshAt(null);
    setFitBoundsSignal((s) => s + 1);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedQuay(null);
    setRoute(null);
    setDepartures([]);
    setLastRefreshAt(null);
  }, []);

  // Destination search → resolve the FIRST ferry quay on the route, then select it.
  const handleSelectDestination = useCallback(
    async (result: ResultItem) => {
      if (!API_URL || !userLocation) return;
      const journeys = await fetchJourney(API_URL, userLocation[0], userLocation[1], result.latitude, result.longitude);
      const firstFerry = journeys[0]?.legs.find((l): l is FerryLeg => l.mode === "water");
      const quay = firstFerry?.fromQuayId ? quays.find((q) => q.id === firstFerry.fromQuayId) : undefined;
      if (quay) handleSelectQuay(quay);
    },
    [userLocation, quays, handleSelectQuay],
  );

  // On selection: fetch the drive route, then poll departures with a live arrival estimate.
  useEffect(() => {
    const apiUrl = API_URL;
    if (!apiUrl || !selectedQuay || !userLocation) return;
    const quay = selectedQuay;
    const [lat, lng] = userLocation;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refreshDepartures = async (driveSeconds: number) => {
      const arrival = new Date(Date.now() + driveSeconds * 1000).toISOString();
      setIsRefreshing(true);
      const data = await fetchQuayDepartures(apiUrl, quay.id, arrival);
      if (cancelled) return;
      setDepartures(data.departures);
      setLastRefreshAt(new Date());
      setIsRefreshing(false);
      const margin = data.selectedDeparture?.marginMinutes ?? null;
      timer = setTimeout(() => refreshDepartures(driveSeconds), getRefreshIntervalMs(margin));
    };

    (async () => {
      setPanelLoading(true);
      const r = await fetchQuayRoute(apiUrl, lat, lng, quay.id);
      if (cancelled) return;
      setRoute(r);
      setFitBoundsSignal((s) => s + 1);
      await refreshDepartures(r?.durationSeconds ?? 0);
      if (!cancelled) setPanelLoading(false);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [selectedQuay, userLocation]);

  return (
    <div className="absolute inset-0">
      <MapView
        quays={quays}
        userLocation={userLocation}
        selectedQuay={selectedQuay}
        route={route}
        onSelectQuay={handleSelectQuay}
        fitBoundsSignal={fitBoundsSignal}
      />
      {!selectedQuay && (
        <SearchOverlay quays={quays} onSelectQuay={handleSelectQuay} onSelectDestination={handleSelectDestination} />
      )}
      {selectedQuay && (
        <MarginPanel
          quay={selectedQuay}
          route={route}
          departures={departures}
          loading={panelLoading}
          onClose={handleClose}
          lastRefreshAt={lastRefreshAt}
          isRefreshing={isRefreshing}
        />
      )}
    </div>
  );
}
