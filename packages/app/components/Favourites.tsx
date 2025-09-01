import React, { useEffect, useState, useCallback } from "react";
import { Text, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QuayCard from "@/components/QuayCard";
import type { Quay } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

async function getFavoriteDocks(): Promise<string[]> {
  const favs = await AsyncStorage.getItem("favorites");
  return favs ? JSON.parse(favs) : [];
}

export default function Favourites() {
  const { t } = useTranslation();
  const [favourites, setFavourites] = useState<Quay[]>([]);

  // Remove a dock from the list by id
  const handleFavoriteToggle = useCallback(
    (dockId: string, isNowFavorite: boolean) => {
      if (!isNowFavorite) {
        setFavourites((prev) =>
          prev.filter((dock) => String(dock.id) !== String(dockId))
        );
      }
    },
    []
  );

  useEffect(() => {
    const fetchFavourites = async () => {
      const favIds = await getFavoriteDocks();
      if (favIds.length === 0) {
        setFavourites([]);
        return;
      }
      try {
        // Build query string with all favorite IDs
        const nsrIdsParam = favIds
          .map((id) => `nsrIds=${encodeURIComponent(id)}`)
          .join("&");
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/quays?${nsrIdsParam}`,
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          }
        );
        const data = await response.json();
        // API returns an array of docks
        const allFavourites = Array.isArray(data) ? data : [data];
        setFavourites(allFavourites);
      } catch (e) {
        console.error("Error fetching favorites:", e);
        setFavourites([]);
      }
    };
    fetchFavourites();
  }, []);

  return favourites.length > 0 ? (
    <ScrollView>
      <Text className="text-background-on text-3xl font-bebas-neue">
        {t("favorites")}
      </Text>
      {favourites.map((quay, index) => (
        <QuayCard
          quay={quay}
          key={`favourites-${quay.id}-${index}`}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}
    </ScrollView>
  ) : null;
}
