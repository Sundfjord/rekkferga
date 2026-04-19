import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SearchResult } from "@shared/types";
import type { SavedDestination } from "@shared/types";
import { useThemeColors } from "../contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";

// Simple filled location pin
const PinIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, lineHeight: 24, color }}>📍</Text>
);

interface SearchProps {
  onSelect: (result: SearchResult) => void;
  showTagline?: boolean;
}

export default function Search({ onSelect, showTagline = false }: SearchProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { favorites, isFavorite } = useFavorites();
  const [searchPhrase, setSearchPhrase] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedPhrase, setDebouncedPhrase] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const justSelectedRef = useRef(false);

  // Filtered favorites based on current query
  const filteredFavorites = searchPhrase.trim()
    ? favorites.filter((f) =>
        f.destination.name.toLowerCase().includes(searchPhrase.trim().toLowerCase())
      )
    : favorites;

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedPhrase(searchPhrase), 300);
    return () => clearTimeout(handler);
  }, [searchPhrase]);

  useEffect(() => {
    const doSearch = async () => {
      // Don't re-search immediately after a selection
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      if (debouncedPhrase.length > 2) {
        setLoading(true);
        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/search?query=${encodeURIComponent(debouncedPhrase)}`);
          const data: SearchResult[] = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        } catch {
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        // Keep dropdown open for favorites when input is empty and focused
        if (debouncedPhrase.length === 0 && isFocused) {
          setShowDropdown(true);
        }
      }
    };
    doSearch();
  }, [debouncedPhrase, isFocused]);

  const handleSelect = (result: SearchResult) => {
    justSelectedRef.current = true;
    setSearchPhrase(result.name);
    setShowDropdown(false);
    setSearchResults([]);
    setIsFocused(false);
    onSelect(result);
  };

  const handleFavoriteSelect = (fav: SavedDestination) => {
    const result: SearchResult = { ...fav.destination, type: "location" };
    handleSelect(result);
  };

  // Exclude search results that match any favorite (not just filtered ones)
  const allFavoriteIds = new Set(favorites.map((f) => f.destination.id));
  const dedupedResults = searchResults.filter((r) => !allFavoriteIds.has(r.id));

  const hasResults = dedupedResults.length > 0;
  const hasFavorites = filteredFavorites.length > 0;
  const hasDropdown = showDropdown && (hasResults || hasFavorites);

  return (
    <View>
      {showTagline && (
        <Text style={[styles.tagline, { color: "rgba(255,255,255,0.65)", fontFamily: "Syne-SemiBold" }]}>
          {t("searchTagline").toUpperCase()}
        </Text>
      )}

      {/* Input row */}
      <View
        style={[
          styles.inputCard,
          { backgroundColor: colors.surface },
          hasDropdown && styles.inputCardOpen,
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.onSurface, fontFamily: "DMSans-Regular" }]}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={colors.onSurface + "55"}
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {loading && (
          <ActivityIndicator size="small" color={colors.primaryLight} />
        )}
      </View>

      {/* Dropdown */}
      {hasDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface }]}>
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {/* Favorites section */}
            {hasFavorites && (
              <>
                {!hasResults && !searchPhrase.trim() && (
                  <Text style={[styles.sectionLabel, { color: colors.onSurface + "88" }]}>
                    {t("favorites").toUpperCase()}
                  </Text>
                )}
                {filteredFavorites.map((fav, index) => (
                  <TouchableOpacity
                    key={`fav-${fav.destination.id}-${index}`}
                    onPress={() => handleFavoriteSelect(fav)}
                    style={styles.favoriteRow}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="heart" size={16} color="#ef4444" />
                    <View style={styles.favoriteText}>
                      <Text style={[styles.favoriteName, { color: colors.onSurface }]} numberOfLines={1}>
                        {fav.destination.name}
                      </Text>
                      {fav.destination.subName && (
                        <Text style={[styles.favoriteSubName, { color: colors.onSurface }]} numberOfLines={1}>
                          {fav.destination.subName}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Search results */}
            {dedupedResults.map((item, index) => (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                onPress={() => handleSelect(item)}
                style={[styles.favoriteRow]}
                activeOpacity={0.7}
              >
                {isFavorite(item.id) ? (
                  <Ionicons name="heart" size={16} color="#ef4444" />
                ) : (
                  <Ionicons name="location-sharp" size={16} color={colors.onSurface + "55"} />
                )}
                <View style={styles.favoriteText}>
                  <Text style={[styles.favoriteName, { color: colors.onSurface }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.subName && (
                    <Text style={[styles.favoriteSubName, { color: colors.onSurface }]} numberOfLines={1}>
                      {item.subName}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagline: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  inputCardOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  input: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    padding: 0,
  },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: "DMSans-Medium",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  favoriteText: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontFamily: "DMSans-Medium",
  },
  favoriteSubName: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 1,
    fontFamily: "DMSans-Regular",
  },
});
