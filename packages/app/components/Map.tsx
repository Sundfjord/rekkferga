import React, { useEffect, useRef } from "react";
import { View, Platform, Text, Animated, Image } from "react-native";
import type { JourneyResult, CarLeg, FerryLeg } from "@shared/types";

interface MapProps {
  journey: JourneyResult | null;
  userLocation: { latitude: number; longitude: number } | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
  /** Increment to trigger fitToCoordinates on the full route. */
  fitBoundsSignal?: number;
}

// Shared marker shell — matches web MapElements style
// No shadows — react-native-maps clips custom marker views tightly
const markerShell = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "#42a5f5",
  borderWidth: 2.5,
  borderColor: "#011683",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  overflow: "hidden" as const,
};

function QuayMarker() {
  return (
    <View style={{ width: 32, height: 32 }}>
      <View style={markerShell}>
        <Image
          source={require("../assets/images/fergo.png")}
          style={{ width: 25, height: 10, borderRadius: 10 }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

function DestinationMarker() {
  const size = 8;
  const dark = "#011638";
  const light = "#ffffff";
  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3];
  return (
    <View style={{ width: 32, height: 32 }}>
      <View style={markerShell}>
        <View style={{ width: 32, height: 32 }}>
          {rows.map((r) => (
            <View key={r} style={{ flexDirection: "row" }}>
              {cols.map((c) => (
                <View
                  key={c}
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: (r + c) % 2 === 0 ? dark : light,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function PulsingUserMarker() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.15, 0] });

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{
        position: "absolute", width: 20, height: 20, borderRadius: 10,
        backgroundColor: "rgba(59,130,246,0.4)", transform: [{ scale }], opacity,
      }} />
      <View style={{
        width: 14, height: 14, borderRadius: 7, backgroundColor: "#3b82f6",
        borderWidth: 2.5, borderColor: "white",
        shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.45, shadowRadius: 6, elevation: 4,
      }} />
    </View>
  );
}

function MapNativeImpl({ journey, userLocation, completedLegs, followUser, fitBoundsSignal }: MapProps) {
  const MapView = require("react-native-maps").default;
  const { Marker, Polyline } = require("react-native-maps");
  const mapRef = useRef<any>(null);

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 1.5, longitudeDelta: 1.5 }
    : { latitude: 60.472, longitude: 8.468, latitudeDelta: 5, longitudeDelta: 5 };

  // Fit to full route when signal fires
  useEffect(() => {
    if (!fitBoundsSignal || !journey) return;
    const coords: { latitude: number; longitude: number }[] = [];
    for (const leg of journey.legs) {
      const { fromPlace, toPlace } = leg;
      if (fromPlace.latitude && fromPlace.longitude) coords.push({ latitude: fromPlace.latitude, longitude: fromPlace.longitude });
      if (toPlace.latitude && toPlace.longitude) coords.push({ latitude: toPlace.latitude, longitude: toPlace.longitude });
    }
    if (coords.length > 0) {
      // Small delay ensures MapView is fully mounted before fitting
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 64, right: 64, bottom: 64, left: 64 },
          animated: true,
        });
      }, 300);
    }
    // journey intentionally omitted — only refit when signal fires
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitBoundsSignal]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      showsUserLocation={false}
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
          const { fromPlace, toPlace } = ferryLeg;
          const markers = [];
          if (fromPlace.latitude && fromPlace.longitude) {
            markers.push(
              <Marker key={`from-${i}`} coordinate={{ latitude: fromPlace.latitude, longitude: fromPlace.longitude }}
                title={fromPlace.name} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={true}>
                <QuayMarker />
              </Marker>
            );
          }
          if (toPlace.latitude && toPlace.longitude) {
            markers.push(
              <Marker key={`to-${i}`} coordinate={{ latitude: toPlace.latitude, longitude: toPlace.longitude }}
                title={toPlace.name} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={true}>
                <QuayMarker />
              </Marker>
            );
          }
          return markers;
        })}

      {/* Destination marker at end of route */}
      {journey && (() => {
        const lastLeg = journey.legs[journey.legs.length - 1];
        if (!lastLeg?.toPlace.latitude || !lastLeg?.toPlace.longitude) return null;
        return (
          <Marker
            coordinate={{ latitude: lastLeg.toPlace.latitude, longitude: lastLeg.toPlace.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
          >
            <DestinationMarker />
          </Marker>
        );
      })()}

      {userLocation && (
        <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
          <PulsingUserMarker />
        </Marker>
      )}
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
