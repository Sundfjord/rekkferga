import React from "react";
import { View, Platform, Text } from "react-native";
import type { JourneyResult, CarLeg, FerryLeg } from "@shared/types";

interface MapProps {
  journey: JourneyResult | null;
  userLocation: { latitude: number; longitude: number } | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
}

function MapNativeImpl({ journey, userLocation, completedLegs, followUser }: MapProps) {
  // Dynamic require to avoid bundling react-native-maps on web
  const MapView = require("react-native-maps").default;
  const { Marker, Polyline } = require("react-native-maps");

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 1.5, longitudeDelta: 1.5 }
    : { latitude: 60.472, longitude: 8.468, latitudeDelta: 5, longitudeDelta: 5 };

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      showsUserLocation
      followsUserLocation={followUser ?? false}
    >
      {journey?.legs.map((leg, i) => {
        const from = leg.fromPlace;
        const to = leg.toPlace;
        if (!from.latitude || !from.longitude || !to.latitude || !to.longitude) return null;
        const isFerry = leg.mode === "water";
        const isCompleted = completedLegs?.has(i) ?? false;
        const roadGeometry = !isFerry ? (leg as CarLeg).geometry : undefined;
        const coordinates = roadGeometry
          ? roadGeometry.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
          : [
              { latitude: from.latitude, longitude: from.longitude },
              { latitude: to.latitude, longitude: to.longitude },
            ];
        return (
          <Polyline
            key={i}
            coordinates={coordinates}
            strokeColor={isFerry ? "#0ea5e9" : "#3b82f6"}
            strokeWidth={4}
            lineDashPattern={isFerry ? [8, 6] : undefined}
            strokeOpacity={isCompleted ? 0.3 : 1}
          />
        );
      })}

      {journey?.legs
        .filter((l) => l.mode === "water")
        .flatMap((leg, i) => {
          const ferryLeg = leg as FerryLeg;
          const from = ferryLeg.fromPlace;
          const to = ferryLeg.toPlace;
          const markers = [];
          if (from.latitude && from.longitude) {
            markers.push(
              <Marker
                key={`from-${i}`}
                coordinate={{ latitude: from.latitude, longitude: from.longitude }}
                title={from.name}
                pinColor="#0ea5e9"
              />
            );
          }
          if (to.latitude && to.longitude) {
            markers.push(
              <Marker
                key={`to-${i}`}
                coordinate={{ latitude: to.latitude, longitude: to.longitude }}
                title={to.name}
                pinColor="#0ea5e9"
              />
            );
          }
          return markers;
        })}
    </MapView>
  );
}

export default function Map(props: MapProps) {
  if (Platform.OS === "web") {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-surface-on opacity-50">Map not available on web</Text>
      </View>
    );
  }
  return <MapNativeImpl {...props} />;
}
