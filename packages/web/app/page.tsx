"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useQuays } from "@/hooks/useQuays";
import { useQuayDepartures } from "@/hooks/useQuayDepartures";
import SearchOverlay, { type DestinationStatus } from "@/components/SearchOverlay";
import MarginPanel from "@/components/MarginPanel";
import type { Quay, ResultItem, FerryLeg } from "@shared/types";
import { fetchJourney } from "@shared/services/journey";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { quays } = useQuays();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedQuay, setSelectedQuay] = useState<Quay | null>(null);
  const [destinationStatus, setDestinationStatus] = useState<DestinationStatus>(null);
  // Bumped on every selection so a slow destination lookup can't override a newer choice.
  const selectionTokenRef = useRef(0);
  const departures = useQuayDepartures(selectedQuay, userLocation);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserLocation([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleSelectQuay = useCallback((quay: Quay) => {
    selectionTokenRef.current++;
    setDestinationStatus(null);
    setSelectedQuay(quay);
  }, []);

  const handleClose = useCallback(() => setSelectedQuay(null), []);

  // Destination search → resolve the FIRST ferry quay on the route, then select it.
  const handleSelectDestination = useCallback(
    async (result: ResultItem) => {
      if (!API_URL) return;
      if (!userLocation) {
        setDestinationStatus({ kind: "error", messageKey: "locationRequired" });
        return;
      }
      const token = ++selectionTokenRef.current;
      setDestinationStatus({ kind: "resolving", name: result.name });

      const journeys = await fetchJourney(API_URL, userLocation[0], userLocation[1], result.latitude, result.longitude);
      if (token !== selectionTokenRef.current) return;

      let quay: Quay | undefined;
      for (const journey of journeys) {
        const ferry = journey.legs.find((l): l is FerryLeg => l.mode === "water" && !!l.fromQuayId);
        quay = ferry && quays.find((q) => q.id === ferry.fromQuayId);
        if (quay) break;
      }
      if (quay) handleSelectQuay(quay);
      else setDestinationStatus({ kind: "error", messageKey: "noRouteQuays" });
    },
    [userLocation, quays, handleSelectQuay],
  );

  return (
    <div className="absolute inset-0">
      <MapView
        quays={quays}
        userLocation={userLocation}
        selectedQuay={selectedQuay}
        route={departures.route}
        onSelectQuay={handleSelectQuay}
      />
      {selectedQuay ? (
        <MarginPanel key={selectedQuay.id} quay={selectedQuay} onClose={handleClose} {...departures} />
      ) : (
        <SearchOverlay
          quays={quays}
          userLocation={userLocation}
          destinationStatus={destinationStatus}
          onSelectQuay={handleSelectQuay}
          onSelectDestination={handleSelectDestination}
        />
      )}
    </div>
  );
}
