import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";
import type { SearchResult, JourneyResult, FerryLeg, DepartureOption } from "@shared/types";
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

async function fetchDeparturesForLeg(ferryLeg: FerryLeg): Promise<DepartureOption[]> {
  if (!ferryLeg.fromQuayId) return [];
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/quay/departures?quayId=${ferryLeg.fromQuayId}&arrivalTime=${encodeURIComponent(ferryLeg.expectedStartTime)}`);
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
  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleDestinationSelect = useCallback(async (result: SearchResult) => {
    setDestination(result);
    setJourney(null);

    const { status } = await requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const { coords } = await getCurrentPositionAsync({});
    setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });

    const journeys = await fetchJourney(
      coords.latitude,
      coords.longitude,
      result.latitude,
      result.longitude
    );
    if (!journeys.length) return;

    const base = journeys[0];
    const hydratedLegs = await Promise.all(
      base.legs.map(async (leg) => {
        if (leg.mode !== "water") return leg;
        const departures = await fetchDeparturesForLeg(leg as FerryLeg);
        return { ...leg, departures };
      })
    );

    setJourney({ ...base, legs: hydratedLegs });
  }, []);

  return (
    <View style={styles.container}>
      <Map journey={journey} userLocation={userLocation} />

      <View style={styles.searchOverlay}>
        <Search onSelect={handleDestinationSelect} />
      </View>

      {journey && destination && (
        <JourneyPanel journey={journey} destination={destination} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
});
