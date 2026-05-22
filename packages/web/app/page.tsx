"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useQuays } from "@/hooks/useQuays";
import type { Quay } from "@shared/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

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
    </div>
  );
}
