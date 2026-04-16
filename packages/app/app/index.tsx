import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";
import type { SearchResult, JourneyResult, FerryLeg, DepartureOption } from "@shared/types";
import { setTripData } from "@/store/tripStore";
import Map from "@/components/Map";
import Search from "@/components/Search";
import JourneyPanel from "@/components/JourneyPanel";

async function fetchJourney(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<JourneyResult[]> {
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/journey?from=${fromLat},${fromLng}&to=${toLat},${toLng}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchDeparturesForLeg(
  ferryLeg: FerryLeg,
  arrivalTimeAtQuay: string
): Promise<DepartureOption[]> {
  if (!ferryLeg.fromQuayId) return [];
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/quay/departures?quayId=${ferryLeg.fromQuayId}&arrivalTime=${encodeURIComponent(arrivalTimeAtQuay)}`);
  if (!res.ok) return [];
  const data: Record<string, DepartureOption[]> = await res.json();
  const destName = ferryLeg.toPlace.name;
  const key =
    Object.keys(data).find((k) => k === destName) ??
    Object.keys(data).find((k) => k.toLowerCase() === destName.toLowerCase()) ??
    Object.keys(data)[0];
  return key ? data[key] : [];
}

export default function HomeScreen() {
  const router = useRouter();
  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDestinationSelect = useCallback(async (result: SearchResult) => {
    setDestination(result);
    setError(null);
    setIsLoading(true);
    setJourney(null);

    const { status } = await requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location access denied. Please enable location services.");
      setIsLoading(false);
      return;
    }

    try {
      const { coords } = await getCurrentPositionAsync({});
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });

      const journeys = await fetchJourney(
        coords.latitude,
        coords.longitude,
        result.latitude,
        result.longitude
      );
      if (!journeys.length) {
        setError("No route found to this destination.");
        return;
      }

      const base = journeys[0];
      const hydratedLegs = await Promise.all(
        base.legs.map(async (leg, index) => {
          if (leg.mode !== "water") return leg;
          const prevLeg = index > 0 ? base.legs[index - 1] : null;
          const driveDurationMs = (prevLeg?.duration ?? 0) * 1000;
          const arrivalTimeAtQuay = new Date(Date.now() + driveDurationMs).toISOString();
          const departures = await fetchDeparturesForLeg(leg as FerryLeg, arrivalTimeAtQuay);
          return { ...leg, departures };
        })
      );

      setJourney({ ...base, legs: hydratedLegs });
    } catch {
      setError("Failed to calculate route. Please try again.");
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

  // Landing state
  if (!destination) {
    return (
      <View className="flex-1 px-4 pt-4">
        <Search onSelect={handleDestinationSelect} />
      </View>
    );
  }

  // Result / loading state
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-4 pt-4">
        <Search onSelect={handleDestinationSelect} />
      </View>

      {isLoading && (
        <View className="flex-row items-center mx-4 mt-3 px-4 py-3 bg-surface rounded-xl"
          style={{ gap: 10 }}>
          <ActivityIndicator size="small" />
          <Text className="text-surface-on text-sm">Calculating route...</Text>
        </View>
      )}

      {error && (
        <View className="mx-4 mt-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", borderWidth: 1 }}>
          <Text style={{ color: "#dc2626", fontSize: 14 }}>{error}</Text>
        </View>
      )}

      {journey && (
        <>
          <View style={{ height: 200, marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: "hidden" }}>
            <Map journey={journey} userLocation={userLocation} />
          </View>
          <JourneyPanel
            journey={journey}
            destination={destination}
            onClose={handleClose}
            onStartTrip={() => {
                setTripData(journey, destination);
                router.push("/trip" as Href);
              }}
          />
        </>
      )}
    </ScrollView>
  );
}
