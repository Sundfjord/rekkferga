"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Search from "@/components/Search";
import JourneyPanel from "@/components/JourneyPanel";
import type { SearchResult, JourneyResult, FerryLeg, DepartureOption } from "@shared/types";

const MapWrapper = dynamic(() => import("@/components/MapWrapper"), { ssr: false });

async function fetchJourney(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<JourneyResult[]> {
  const url = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${url}/journey?from=${fromLat},${fromLng}&to=${toLat},${toLng}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchDeparturesForLeg(
  ferryLeg: FerryLeg
): Promise<DepartureOption[]> {
  if (!ferryLeg.fromQuayId) return [];
  const url = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${url}/quay/departures?quayId=${ferryLeg.fromQuayId}&arrivalTime=${encodeURIComponent(ferryLeg.expectedStartTime)}`);
  if (!res.ok) return [];
  const data: Record<string, DepartureOption[]> = await res.json();
  // Find the bucket matching this leg's destination quay
  const destName = ferryLeg.toPlace.name;
  const key =
    Object.keys(data).find((k) => k === destName) ??
    Object.keys(data).find((k) => k.toLowerCase() === destName.toLowerCase()) ??
    Object.keys(data)[0];
  return key ? data[key] : [];
}

export default function Home() {
  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDestinationSelect = useCallback(async (result: SearchResult) => {
    setDestination(result);
    setError(null);
    setIsLoading(true);
    setJourney(null);

    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          reject,
          { enableHighAccuracy: true, timeout: 10000 }
        )
      );
      const userLat = coords.latitude;
      const userLng = coords.longitude;
      setUserLocation([userLat, userLng]);

      const journeys = await fetchJourney(userLat, userLng, result.latitude, result.longitude);
      if (!journeys.length) {
        setError("No route found to this destination.");
        return;
      }

      const base = journeys[0];

      // Hydrate ferry legs with departure data
      const hydratedLegs = await Promise.all(
        base.legs.map(async (leg) => {
          if (leg.mode !== "water") return leg;
          const departures = await fetchDeparturesForLeg(leg as FerryLeg);
          return { ...leg, departures };
        })
      );

      setJourney({ ...base, legs: hydratedLegs });
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError("Location access denied. Please enable location services.");
      } else {
        setError("Failed to calculate route. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <div className="flex-1 h-full">
        <MapWrapper journey={journey} userLocation={userLocation} />
      </div>

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-80">
        <Search onSelect={handleDestinationSelect} />

        {isLoading && (
          <div className="px-4 py-2 bg-white rounded-lg shadow text-sm text-gray-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 flex-shrink-0" />
            Calculating route...
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {journey && destination && (
          <JourneyPanel
            journey={journey}
            destination={destination}
            onClose={() => {
              setJourney(null);
              setDestination(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
