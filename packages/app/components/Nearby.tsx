import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from "expo-location";
import QuayCard from "@/components/QuayCard";
import type { Quay } from "@/types";
import { useTranslation } from "../hooks/useTranslation";

interface NearbyProps {
  onLoadMore: () => void;
  onLoadMoreComplete: () => void;
  onHasMoreChange: (hasMore: boolean) => void;
  loadingMore: boolean;
  hasMore: boolean;
}

export default function Nearby({
  onLoadMore,
  onLoadMoreComplete,
  onHasMoreChange,
  loadingMore,
  hasMore,
}: NearbyProps) {
  const { t } = useTranslation();
  const [quays, setQuays] = useState<Quay[]>([]);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);

  const fetchDocks = useCallback(
    async (isInitial = false) => {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const { coords } = await getCurrentPositionAsync({});
      const currentOffset = isInitial ? 0 : offset;

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/quays?coords=${coords.latitude},${coords.longitude}&limit=${limit}&offset=${currentOffset}`,
          { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await response.json();

        if (isInitial) {
          setQuays(data);
          setOffset(limit);
        } else {
          setQuays((prev) => [...prev, ...data]);
          setOffset((prev) => prev + limit);
        }

        const newHasMore = data.length === limit;
        onHasMoreChange(newHasMore);
      } catch (error) {
        console.error("Error fetching quays:", error);
      } finally {
        onLoadMoreComplete();
      }
    },
    [offset, limit, onHasMoreChange, onLoadMoreComplete]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    await fetchDocks(false);
  }, [hasMore, fetchDocks]);

  useEffect(() => {
    if (loadingMore && hasMore) {
      loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  return (
    <View className="flex-1 relative min-h-96">
      {quays.length > 0 && (
        <Text className="text-background-on text-3xl font-bebas-neue">
          {t("nearbyQuays")}
        </Text>
      )}
      {quays.map((quay, index) => (
        <QuayCard quay={quay} key={`nearby-${quay.id}-${index}`} />
      ))}
      {loadingMore && (
        <ActivityIndicator size="small" color="white" className="mt-4" />
      )}
      {!hasMore && quays.length > 0 && (
        <Text className="text-center mt-4">{t("allQuaysShown")}</Text>
      )}
    </View>
  );
}
