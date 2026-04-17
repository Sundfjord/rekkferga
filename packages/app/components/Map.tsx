import React, { useEffect, useRef } from "react";
import { View, Platform, Text, Animated, Image } from "react-native";
import type { JourneyResult, CarLeg, FerryLeg } from "@shared/types";

interface MapProps {
  journey: JourneyResult | null;
  userLocation: { latitude: number; longitude: number } | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
}

function QuayMarker() {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "white",
        borderWidth: 2.5,
        borderColor: "#2569A3",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 5,
        elevation: 5,
        overflow: "hidden",
        padding: 2,
      }}
    >
      <Image
        source={require("../assets/images/Logo.png")}
        style={{ width: 26, height: 26, borderRadius: 13 }}
        resizeMode="cover"
      />
    </View>
  );
}

function PulsingUserMarker() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.15, 0] });

  return (
    <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "rgba(59, 130, 246, 0.4)",
          transform: [{ scale }],
          opacity,
        }}
      />
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: "#3b82f6",
          borderWidth: 2.5,
          borderColor: "white",
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.45,
          shadowRadius: 6,
          elevation: 4,
        }}
      />
    </View>
  );
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
          const from = ferryLeg.fromPlace;
          const to = ferryLeg.toPlace;
          const markers = [];
          if (from.latitude && from.longitude) {
            markers.push(
              <Marker
                key={`from-${i}`}
                coordinate={{ latitude: from.latitude, longitude: from.longitude }}
                title={from.name}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <QuayMarker />
              </Marker>
            );
          }
          if (to.latitude && to.longitude) {
            markers.push(
              <Marker
                key={`to-${i}`}
                coordinate={{ latitude: to.latitude, longitude: to.longitude }}
                title={to.name}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <QuayMarker />
              </Marker>
            );
          }
          return markers;
        })}

      {userLocation && (
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges
        >
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
