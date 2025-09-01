import React, { useEffect, useState } from "react";
import type { Departure, Quay } from "@/types";
import { View, Text, Pressable } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useQuayDetails } from "@/hooks/useQuayDetails";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDuration, formatTime } from "@/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MarginBadge from "./MarginBadge";
import { ThemedActivityIndicator } from "./ThemedActivityIndicator";
import { ThemedIcon } from "./ThemedIcon";

interface QuayCardProps {
  quay: Quay;
  className?: string;
  onFavoriteToggle?: (quayId: string, isNowFavorite: boolean) => void;
  onPress?: () => void;
}

async function getFavoriteQuays(): Promise<string[]> {
  const favs = await AsyncStorage.getItem("favorites");
  return favs ? JSON.parse(favs) : [];
}

async function addFavoriteQuay(quayId: string) {
  const favs = await getFavoriteQuays();
  if (!favs.includes(quayId)) {
    favs.push(quayId);
    await AsyncStorage.setItem("favorites", JSON.stringify(favs));
  }
}

async function removeFavoriteQuay(quayId: string) {
  let favs = await getFavoriteQuays();
  favs = favs.filter((id) => id !== quayId);
  await AsyncStorage.setItem("favorites", JSON.stringify(favs));
}

export default function QuayCard({
  quay: originalQuay,
  className = "",
  onFavoriteToggle,
  onPress,
}: QuayCardProps) {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { quayDetails, loading, fetchQuayDetails } = useQuayDetails(
    originalQuay.id
  );

  useEffect(() => {
    getFavoriteQuays().then((favs) => {
      setIsFavorite(favs.includes(String(originalQuay.id)));
    });
  }, [originalQuay.id]);

  const toggleFavorite = async () => {
    if (isFavorite) {
      await removeFavoriteQuay(String(originalQuay.id));
      setIsFavorite(false);
      if (onFavoriteToggle) onFavoriteToggle(String(originalQuay.id), false);
    } else {
      await addFavoriteQuay(String(originalQuay.id));
      setIsFavorite(true);
      if (onFavoriteToggle) onFavoriteToggle(String(originalQuay.id), true);
    }
  };

  const toggleExpanded = async () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && !quayDetails && !loading) {
      fetchQuayDetails();
    }
  };

  return (
    <View
      className={`bg-surface border border-border rounded-xl mb-2 overflow-hidden ${className}`.trim()}
    >
      <View className="p-4">
        <View className="flex-row justify-between">
          <Pressable className="flex-1 flex-grow" onPress={onPress}>
            <Text className="text-surface-on text-lg font-bold mb-1 ">
              {originalQuay.name}
            </Text>
            <Text className="text-surface-on text-sm mb-0.5">
              {originalQuay.municipality}, {originalQuay.region}
            </Text>
          </Pressable>
          <Pressable onPress={toggleFavorite} className="ml-4 p-1 items-start">
            <ThemedIcon
              name="heart"
              variant="error"
              size={20}
              solid={isFavorite}
            />
          </Pressable>
        </View>
      </View>

      {isExpanded && (
        <View className="px-4 pb-4">
          {loading ? (
            <ThemedActivityIndicator variant="primary" size="small" />
          ) : quayDetails ? (
            <>
              {quayDetails.route && (
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <ThemedIcon name="clock" size={16} variant="primary" />
                    <Text className="text-surface-on">
                      {formatDuration(
                        Math.round(quayDetails.route.duration / 60),
                        t
                      )}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <ThemedIcon
                      name="flag-checkered"
                      size={16}
                      variant="primary"
                    />
                    <Text className="text-surface-on">
                      {quayDetails.route.expectedEndTime
                        ? formatTime(quayDetails.route.expectedEndTime)
                        : t("unavailable")}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <ThemedIcon name="car" size={16} variant="primary" />
                    <Text className="text-surface-on">
                      {Math.round((quayDetails.route.distance / 1000) * 10) /
                        10}
                      km
                    </Text>
                  </View>
                </View>
              )}

              {quayDetails.departuresByDestination &&
                Object.keys(quayDetails.departuresByDestination).length > 0 && (
                  <>
                    {/* Find first reachable departure for each destination */}
                    {Object.entries(quayDetails.departuresByDestination)
                      .map(
                        ([destination, departures]: [string, Departure[]]) => {
                          // Find the departure marked as first reachable for this destination
                          const firstReachableDeparture = departures.find(
                            (departure) => departure.isFirstReachableDeparture
                          );

                          if (!firstReachableDeparture) return null;

                          return (
                            <View
                              key={destination}
                              className="flex-row items-center gap-1"
                            >
                              <Text className="text-surface-on">
                                {destination}
                              </Text>
                              <Text
                                className={`text-lg ${
                                  firstReachableDeparture.realtime
                                    ? "text-primary font-bold"
                                    : "text-surface-on"
                                }`}
                              >
                                {formatTime(
                                  firstReachableDeparture.expectedDepartureTime
                                )}
                              </Text>
                              <MarginBadge
                                arrivalTime={
                                  quayDetails.route?.expectedEndTime
                                    ? new Date(
                                        quayDetails.route.expectedEndTime
                                      )
                                    : new Date()
                                }
                                departureTime={
                                  new Date(
                                    firstReachableDeparture.expectedDepartureTime
                                  )
                                }
                              />
                            </View>
                          );
                        }
                      )
                      .filter(Boolean)}
                  </>
                )}
              <View>
                <Link href={`/${originalQuay.id}`} asChild>
                  <View className="flex-row items-center">
                    <ThemedIcon
                      name="arrow-up-right-from-square"
                      size={16}
                      variant="primary"
                    />
                    <Text className="text-primary ml-2">
                      {t("viewDetails")}
                    </Text>
                  </View>
                </Link>
              </View>
            </>
          ) : (
            <View className="bg-error rounded-xl p-4">
              <Text className="text-error-on">{t("errorLoadingDetails")}</Text>
            </View>
          )}
        </View>
      )}

      {/* Full-width arrow button */}
      <Pressable
        onPress={toggleExpanded}
        className="w-full py-2 bg-surface-variant border-border items-center"
      >
        <ThemedIcon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          variant="onSurface"
        />
      </Pressable>
    </View>
  );
}
