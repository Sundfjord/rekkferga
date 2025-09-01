import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";
import { SearchResult } from "../types";
import SearchResultItem from "./SearchResultItem";
import { useTranslation } from "../hooks/useTranslation";

export default function Search() {
  const { t } = useTranslation();
  const [searchPhrase, setSearchPhrase] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedPhrase, setDebouncedPhrase] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Clear search results when search phrase changes (user is typing new search)
  useEffect(() => {
    if (searchPhrase) {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchPhrase]);

  // Debounce searchPhrase
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPhrase(searchPhrase);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchPhrase]);

  // Perform search when debouncedPhrase changes
  useEffect(() => {
    const doSearch = async () => {
      if (debouncedPhrase.length > 2) {
        setLoading(true);
        try {
          const response = await fetch(
            `${
              process.env.EXPO_PUBLIC_API_URL
            }/search?query=${encodeURIComponent(debouncedPhrase)}`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
          );
          const data = await response.json();
          setSearchResults(data);
          setShowDropdown(true);
        } catch (e) {
          setSearchResults([]);
          setShowDropdown(false);
        }
        setLoading(false);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };
    doSearch();
  }, [debouncedPhrase]);

  const getRouteQuays = async (location: SearchResult) => {
    const { status } = await requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return [];
    }

    const { coords } = await getCurrentPositionAsync({});

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/quays/route?from=${coords.latitude},${coords.longitude}&to=${location.latitude},${location.longitude}`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      );

      if (!response.ok) {
        console.error(`Route API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      // Handle empty or invalid responses
      if (!data || !Array.isArray(data)) {
        console.log("Route API returned empty or invalid data");
        return [];
      }

      return data;
    } catch (error) {
      console.error("Failed to fetch route quays:", error);
      return [];
    }
  };

  return (
    <View className="mb-4">
      <Text className="text-background-on text-3xl font-bebas-neue">
        {t("search")}
      </Text>

      <View className="relative">
        <View className="flex-row items-center">
          <TextInput
            className={`flex-1 bg-surface text-surface-on px-4 py-2 text-base border border-border shadow-sm ${
              showDropdown && searchResults.length > 0
                ? "rounded-t-xl"
                : "rounded-xl"
            }`}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor="#bdbdbd"
            value={searchPhrase}
            onChangeText={setSearchPhrase}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            style={{
              fontWeight: "500",
            }}
          />
        </View>

        {/* Loading indicator */}
        {loading && (
          <View className="absolute right-4 top-3">
            <ActivityIndicator size="small" color="#011638" />
          </View>
        )}

        {/* Search results dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <View className="bg-surface rounded-b-xl border border-border shadow-sm max-h-60 border-t-0">
            <ScrollView
              style={{ maxHeight: 240 }}
              showsVerticalScrollIndicator={false}
            >
              {searchResults.map((item, index) => (
                <SearchResultItem
                  item={item}
                  isLastItem={index === searchResults.length - 1}
                  key={item.id}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}
