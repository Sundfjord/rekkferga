import React from "react";
import { View, Text, Pressable } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { ThemedIcon } from "@/components/ThemedIcon";
import { useTranslation } from "@/hooks/useTranslation";

export default function DestinationLocationPage() {
  const { location } = useLocalSearchParams<{
    location: string;
  }>();
  const { t } = useTranslation();
  // Parse coordinates from "lat,lng" format with validation
  const parseCoordinates = (coordString: string) => {
    try {
      const [latStr, lngStr] = coordString.split(",");

      if (!latStr || !lngStr) {
        throw new Error("Invalid coordinate format");
      }

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      // Validate coordinate ranges
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinate values");
      }

      if (lat < -90 || lat > 90) {
        throw new Error("Latitude must be between -90 and 90");
      }

      if (lng < -180 || lng > 180) {
        throw new Error("Longitude must be between -180 and 180");
      }

      return { latitude: lat, longitude: lng };
    } catch (error) {
      console.error("Error parsing coordinates:", error);
      return null;
    }
  };

  const coordinates = location ? parseCoordinates(location) : null;

  return (
    <View className="flex-1 p-4 bg-background">
      <Link href="/">
        <Pressable className="flex-row items-center mb-4">
          <ThemedIcon name="arrow-left" size={24} variant="onBackground" />
          <Text className="text-primary-text ml-2">{t("back")}</Text>
        </Pressable>
      </Link>
      <Text className="text-lg font-bold text-background-onBackground">
        Destination & Location
      </Text>
      {coordinates ? (
        <>
          <Text className="text-base text-background-onBackground">
            Latitude: {coordinates.latitude.toFixed(6)}
          </Text>
          <Text className="text-base text-background-onBackground">
            Longitude: {coordinates.longitude.toFixed(6)}
          </Text>
        </>
      ) : (
        <Text className="text-base text-background-onBackground">
          Invalid coordinates format
        </Text>
      )}
    </View>
  );
}
