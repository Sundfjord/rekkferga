import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  Dimensions,
  Text,
  Platform,
} from "react-native";
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from "expo-location";
import type { Dock } from "@/types";

export default function MapNative() {
  const [docks, setDocks] = useState<Dock[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<any>(null);
  const [mapComponents, setMapComponents] = useState<{
    MapView: any;
    Marker: any;
    PROVIDER_GOOGLE: any;
  } | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      import("react-native-maps").then((maps) => {
        setMapComponents({
          MapView: maps.default,
          Marker: maps.Marker,
          PROVIDER_GOOGLE: maps.PROVIDER_GOOGLE,
        });
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let userRegion = null;
      try {
        const { status } = await requestForegroundPermissionsAsync();
        if (status === "granted") {
          const { coords } = await getCurrentPositionAsync({});
          userRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          };
          setRegion(userRegion);
        }
      } catch (e) {}
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/quays`,
          { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await response.json();
        setDocks(data);
        if (!userRegion && data.length) {
          setRegion({
            latitude: data[0].latitude,
            longitude: data[0].longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      } catch (e) {
        setDocks([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !region || !mapComponents) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3a4a5d" />
      </View>
    );
  }

  const { MapView, Marker, PROVIDER_GOOGLE } = mapComponents;

  return (
    <View className="flex-1">
      {Platform.OS === "ios" && (
        <View className="absolute top-0 left-0 right-0 h-10 bg-red-500">
          <Text>Map</Text>
        </View>
      )}
      <MapView
        style={{ flex: 1, width: Dimensions.get("window").width }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
      >
        {docks.map((dock, index) => (
          <Marker
            key={`map-${dock.id}-${index}`}
            coordinate={{
              latitude: dock.latitude,
              longitude: dock.longitude,
            }}
            title={dock.name}
            description={dock.municipality}
          />
        ))}
      </MapView>
    </View>
  );
}
