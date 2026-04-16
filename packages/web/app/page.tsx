"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ferryLeg: FerryLeg,
  arrivalTimeAtQuay: string
): Promise<DepartureOption[]> {
  if (!ferryLeg.fromQuayId) return [];
  const url = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${url}/quay/departures?quayId=${ferryLeg.fromQuayId}&arrivalTime=${encodeURIComponent(arrivalTimeAtQuay)}`);
  if (!res.ok) return [];
  const data: Record<string, DepartureOption[]> = await res.json();
  const destName = ferryLeg.toPlace.name;
  const key =
    Object.keys(data).find((k) => k === destName) ??
    Object.keys(data).find((k) => k.toLowerCase() === destName.toLowerCase()) ??
    Object.keys(data)[0];
  return key ? data[key] : [];
}

export default function Home() {
  const router = useRouter();
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
      const hydratedLegs = await Promise.all(
        base.legs.map(async (leg, index) => {
          if (leg.mode !== "water") return leg;
          const prevLeg = index > 0 ? base.legs[index - 1] : null;
          const arrivalTimeAtQuay = prevLeg?.expectedEndTime ?? leg.expectedStartTime;
          const departures = await fetchDeparturesForLeg(leg as FerryLeg, arrivalTimeAtQuay);
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

  const handleClose = () => {
    setJourney(null);
    setDestination(null);
    setError(null);
    setUserLocation(null);
  };

  // Landing state: vertically centered, nothing but the search input
  if (!destination) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-full max-w-lg">
          <Search onSelect={handleDestinationSelect} />
        </div>
      </div>
    );
  }

  // Result state: top-aligned scrollable column
  return (
    <div className="flex flex-col items-center overflow-y-auto h-full px-4 py-8">
      <div className="w-full max-w-lg flex flex-col gap-4">
        <Search onSelect={handleDestinationSelect} />

        {isLoading && (
          <div className="px-4 py-3 bg-white rounded-xl shadow-sm text-sm text-gray-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 flex-shrink-0" />
            Calculating route...
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {journey && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56">
              <MapWrapper journey={journey} userLocation={userLocation} />
            </div>
            <JourneyPanel
              journey={journey}
              destination={destination}
              onClose={handleClose}
              onStartTrip={() => router.push("/trip")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
