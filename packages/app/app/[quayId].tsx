import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { useQuayDetails } from "@/hooks/useQuayDetails";
import Directions from "@/components/Directions";
import DepartureBoard from "@/components/DepartureBoard";
import { formatDuration, formatTime } from "@/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedActivityIndicator } from "@/components/ThemedActivityIndicator";
import { ThemedIcon } from "@/components/ThemedIcon";

// NSR ID validation function (matches the backend validation)
function isValidNsrId(input: string): boolean {
  const pattern = /^NSR:StopPlace:\d+$/;
  return pattern.test(input);
}

export default function Quay() {
  const { t } = useTranslation();
  const { quayId } = useLocalSearchParams<{ quayId: string }>();
  const { quayDetails, loading, error, fetchQuayDetails } = useQuayDetails(
    quayId || ""
  );

  useEffect(() => {
    if (quayId) {
      // Validate the quay ID format before making the API call
      if (!isValidNsrId(quayId)) {
        // For invalid quay IDs, we'll show an error state instead of redirecting
        // This prevents the redirect loop issue in useEffect
        return;
      }
      fetchQuayDetails();
    }
  }, [quayId]);

  // Check for invalid quay ID and show not-found content
  if (quayId && !isValidNsrId(quayId)) {
    return (
      <View className="flex-1 p-4 bg-background">
        <Link href="/">
          <Pressable className="flex-row items-center mb-4">
            <ThemedIcon name="arrow-left" size={24} variant="onBackground" />
            <Text className="text-background-on ml-2">{t("back")}</Text>
          </Pressable>
        </Link>
        <View className="flex-1 items-center p-4">
          <Text className="text-background-on text-xl text-center mb-4">
            {t("quayNotFoundTitle")}
          </Text>
          <Text className="text-background-on text-center mb-6">
            {t("quayNotFoundDescription")}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 pt-4 items-center">
        <ThemedActivityIndicator size="large" variant="onBackground" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-primary-text">
          {t("loadingError", { error })}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-background">
      {quayDetails?.quay && (
        <>
          <Link href="/">
            <Pressable className="flex-row items-center mb-4">
              <ThemedIcon name="arrow-left" size={24} variant="onBackground" />
              <Text className="text-background-on ml-2">{t("back")}</Text>
            </Pressable>
          </Link>
          <Text className="text-3xl font-bebas-neue text-background-on mb-4">
            {quayDetails?.quay?.name || ""}
          </Text>
        </>
      )}

      {quayDetails?.departuresByDestination &&
        Object.keys(quayDetails.departuresByDestination).length > 0 && (
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-xl font-bold text-background-on mb-3">
              {t("departures")}
            </Text>
            {Object.entries(quayDetails.departuresByDestination).map(
              ([destination, departures]) => (
                <DepartureBoard
                  key={destination}
                  destination={destination}
                  departures={departures}
                  expectedEndTime={quayDetails.route.expectedEndTime}
                />
              )
            )}
            <Text className="text-primary italic text-xs mt-2">
              {t("realtimeDisclaimer")}
            </Text>
          </View>
        )}

      {quayDetails?.quay && (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold text-surface-on mb-2">
            {t("quayDetails")}
          </Text>
          <View className="flex-row items-center gap-2 mb-2">
            <ThemedIcon name="location-dot" size={16} variant="primary" />
            <Text className="text-surface-on">
              {quayDetails.quay.municipality}, {quayDetails.quay.region}
            </Text>
          </View>
          {quayDetails?.route && (
            <>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="flex-row items-center">
                  <ThemedIcon name="clock" size={16} variant="primary" />
                  <Text className="text-surface-on ml-2">
                    {formatDuration(
                      Math.round(quayDetails.route.duration / 60),
                      t
                    )}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <ThemedIcon
                    name="flag-checkered"
                    size={16}
                    variant="primary"
                  />
                  <Text className="text-surface-on ml-2">
                    {quayDetails.route.expectedEndTime
                      ? formatTime(quayDetails.route.expectedEndTime)
                      : t("unavailable")}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <ThemedIcon name="car" size={16} variant="primary" />
                  <Text className="text-surface-on ml-2">
                    {Math.round((quayDetails.route.distance / 1000) * 10) / 10}
                    km
                  </Text>
                </View>
              </View>
              {quayDetails.route.legs.length > 0 && (
                <>
                  <View className="flex-row items-center">
                    <ThemedIcon
                      name="diamond-turn-right"
                      size={16}
                      variant="primary"
                    />
                    <Text className="text-surface-on ml-2">
                      {t("directions")}
                    </Text>
                  </View>
                  <View className="flex-row items-center pl-4">
                    <Directions
                      legs={quayDetails.route.legs}
                      quayName={quayDetails.quay.name}
                    />
                  </View>
                </>
              )}
              <Text className="text-primary italic text-xs mt-4">
                {t("trafficDisclaimer")}
              </Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
